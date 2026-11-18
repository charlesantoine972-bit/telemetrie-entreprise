// Réception des données du plugin (UDP local) + comptage des kilomètres.
// Tourne dans le processus principal : le comptage continue même si la fenêtre est réduite.
const dgram = require('dgram');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const PORT = 47311;
const MAX_TICK_KM = 0.5; // au-delà : saut (ferry, train, changement de camion) -> non compté
// Carte : un point de tracé tous les TRAIL_STEP mètres ; au-delà de TRAIL_JUMP, on coupe le trait (ferry, train…)
const TRAIL_STEP = 150, JOB_STEP = 400, TRAIL_JUMP = 3000, TRAIL_MAX = 20000, JOB_PATH_MAX = 300;
const BUS_JOB_COMPLETION_GRACE_MS = 60000; // bus_job.completed peut arriver après l’arrivée au dernier arrêt
const gameKey = (g) => g === 'ats' ? 'ats' : 'ets2';

function indexedValue(attributes, name, index) {
  const value = attributes && attributes[name];
  if (value && typeof value === 'object') return value[String(index)] ?? value[index] ?? null;
  return index === 0 ? value ?? null : null;
}

function busMission(attributes) {
  if (!attributes) return null;
  const count = Number(attributes['bus.stages.count']);
  if (!Number.isInteger(count) || count < 1) return null;
  const lastStage = count - 1;
  const stageCurrent = Math.max(0, Math.min(lastStage, Number(attributes['bus.stages.current']) || 0));
  const from = indexedValue(attributes, 'source_stop.name', 0);
  const to = indexedValue(attributes, 'destination_stop.name', lastStage);
  const market = attributes['bus_job.market'] || '';
  const fromId = indexedValue(attributes, 'source_stop.id', 0);
  const toId = indexedValue(attributes, 'destination_stop.id', lastStage);
  const id = attributes.bus_job_id;
  const key = `bus|${id || [market, fromId || from, toId || to, attributes.income || ''].join('|')}`;
  return {
    key, missionType: 'bus', busMarket: market, stageCount: count, stageCurrent,
    from, to, nextStop: indexedValue(attributes, 'destination_stop.name', stageCurrent),
    fromId, toId, income: Number(attributes.income) || 0,
    planned: Number(attributes['planned_distance.km']) || 0
  };
}

// Garde au plus `max` points (les coupures `null` sont conservées)
function downsample(pts, max) {
  if (pts.length <= max) return pts;
  const step = pts.length / max, out = [];
  for (let i = 0; i < pts.length; i += step) {
    const k = Math.floor(i);
    if (pts[k] === null) { if (out[out.length - 1] !== null) out.push(null); continue; }
    out.push(pts[k]);
  }
  const last = pts[pts.length - 1];
  if (last && out[out.length - 1] !== last) out.push(last);
  return out;
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

class Telemetry extends EventEmitter {
  constructor(dataDir, getSettings) {
    super();
    this.file = path.join(dataDir, 'donnees.json');
    this.getSettings = getSettings;
    this.data = this.load();
    this.live = null;         // dernier état reçu du plugin
    this.lastPacket = 0;
    this.lastOdo = null;
    this.lastFuel = null;
    this.current = null;      // mission en cours
    this.session = { loaded: 0, empty: 0, start: Date.now() };
    this.lastEvent = null;
    this.dirty = false;
    this.trail = [];          // tracé de la session : [x, z, chargé 1/0] ou null (coupure)
    this.trailGame = null;
  }

  load() {
    const empty = { totals: { loaded: 0, empty: 0, real: 0, race: 0, deliveries: 0, cancelled: 0, revenue: 0, fuelUsed: 0, fuelAdded: 0, fines: 0, finesAmount: 0 }, days: {}, jobs: [] };
    try {
      const d = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      return { ...empty, ...d, totals: { ...empty.totals, ...(d.totals || {}) } };
    } catch { return empty; }
  }

  save() {
    if (!this.dirty) return;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file + '.tmp', JSON.stringify(this.data));
      fs.renameSync(this.file + '.tmp', this.file);
      this.dirty = false;
    } catch (e) { console.error('Sauvegarde impossible :', e.message); }
  }

  start() {
    this.sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    this.sock.on('message', (buf) => {
      let msg;
      try { msg = JSON.parse(buf.toString('utf8')); } catch { return; }
      this.lastPacket = Date.now();
      if (msg.type === 'state') this.onState(msg);
      else if (msg.type === 'gameplay') this.onGameplay(msg);
      else if (msg.type === 'shutdown') { this.live = null; this.lastOdo = null; this.lastFuel = null; this.lastTruck = null; this.lastFuelGame = null; }
    });
    this.sock.on('error', (e) => { this.socketError = e.message; });
    this.sock.bind(PORT, '127.0.0.1');
    this.saveTimer = setInterval(() => this.save(), 10000);
  }

  stop() {
    clearInterval(this.saveTimer);
    this.finishJob('interrompue', null, true);
    this.save();
    try { this.sock.close(); } catch {}
  }

  vehicleType(live = this.live, connected = Date.now() - this.lastPacket < 3000) {
    const savedType = this.getSettings().vehicleType;
    if (!connected || !live) return savedType;
    if (live.busJob) return 'car';
    return savedType === 'car' ? 'car' : 'camion';
  }

  thresholds(live = this.live, connected = Date.now() - this.lastPacket < 3000) {
    const s = this.getSettings();
    return { limit: this.vehicleType(live, connected) === 'car' ? s.limitCar : s.limitTruck, pct: s.racePct };
  }

  // ---------------------------------------------------------------- état reçu
  onState(s) {
    this.live = s;
    const kmh = s.speed * 3.6;

    // bus_job fournit les étapes d’autocar ; job fournit les livraisons camion.
    const activeMission = busMission(s.busJob) || (s.job ? {
      key: `${s.job['source.city']}|${s.job['destination.city']}|${s.job['cargo']}|${s.job['income']}`,
      missionType: 'truck',
      from: s.job['source.city'], fromCompany: s.job['source.company'],
      to: s.job['destination.city'], toCompany: s.job['destination.company'],
      cargo: s.job.cargo, mass: s.job['cargo.mass'] || 0, income: s.job.income || 0,
      planned: s.job['planned_distance.km'] || 0,
      fromId: s.job['source.city.id'] || null, toId: s.job['destination.city.id'] || null
    } : null);
    const jobKey = activeMission ? activeMission.key : null;
    if (!jobKey) this.finishedKey = null;
    if (jobKey && jobKey !== this.finishedKey && (!this.current || this.current.key !== jobKey)) {
      if (this.current) this.finishJob('interrompue');
      this.current = {
        key: jobKey, started: Date.now(),
        ...activeMission,
        loaded: 0, empty: 0, over: 0, maxSpeed: 0,
        fuelUsed: 0, fuelAdded: 0, fuelStops: [], expenses: 0, expenseItems: [],
        truck: s.truck ? `${s.truck.brand || ''} ${s.truck.name || ''}`.trim() : '',
        game: gameKey(s.game),
        path: []
      };
    } else if (jobKey && this.current && this.current.key === jobKey && activeMission.missionType === 'bus') {
      this.current.nextStop = activeMission.nextStop;
      this.current.stageCurrent = activeMission.stageCurrent;
      this.current.stageCount = activeMission.stageCount;
    } else if (!jobKey && this.current && !this.pendingFinish) {
      // Ancienne version du jeu sans évènement de livraison : on clôture quand la mission disparaît
      this.pendingFinish = setTimeout(() => {
        this.pendingFinish = null;
        if (this.current && !(this.live && (this.live.job || this.live.busJob))) this.finishJob('terminée');
      }, this.current.missionType === 'bus' ? BUS_JOB_COMPLETION_GRACE_MS : 2000);
    }

    // Kilomètres
    if (this.lastOdo === null || s.paused) { this.lastOdo = s.odometer; }
    else {
      const d = s.odometer - this.lastOdo;
      this.lastOdo = s.odometer;
      if (d > 0 && d < MAX_TICK_KM) {
        const loaded = !!(s.job && s.trailerConnected);
        const k = loaded ? 'loaded' : 'empty';
        this.data.totals[k] += d;
        this.session[k] += d;
        const day = (this.data.days[today()] ||= { loaded: 0, empty: 0 });
        day[k] += d;
        if (this.current) {
          this.current[k] += d;
          if (kmh > this.thresholds().limit) this.current.over += d;
          this.current.maxSpeed = Math.max(this.current.maxSpeed, kmh);
        } else {
          this.data.totals.real += d; // hors mission : roulage normal
        }
        this.dirty = true;
      }
    }

    this.recordTrail(s);

    // Les niveaux reçus du jeu donnent le volume, mais pas le prix du plein.
    const fuel = Number.isFinite(s.fuel) && s.fuel >= 0 ? s.fuel : null;
    const truckName = s.truck ? `${s.truck.brand || ''} ${s.truck.name || ''}`.trim() : '';
    const fuelGame = gameKey(s.game);
    if (fuel !== null && this.lastFuel !== null && truckName === this.lastTruck && fuelGame === this.lastFuelGame) {
      const delta = fuel - this.lastFuel;
      if (delta < 0 && -delta < 5) {
        this.data.totals.fuelUsed += -delta;
        if (this.current) this.current.fuelUsed += -delta;
        this.dirty = true;
      } else if (delta > 0.05) {
        this.data.totals.fuelAdded += delta;
        if (this.current) {
          this.current.fuelAdded += delta;
          const now = Date.now();
          const stop = this.current.fuelStops[this.current.fuelStops.length - 1];
          if (stop && now - stop.at < 120000) {
            stop.liters += delta;
            stop.at = now;
          } else this.current.fuelStops.push({ at: now, liters: delta });
        }
        this.dirty = true;
      }
    }
    this.lastFuel = fuel;
    this.lastTruck = truckName;
    this.lastFuelGame = fuelGame;
  }

  // Tracé pour la carte (position monde x / z, en mètres)
  recordTrail(s) {
    const x = s.x, z = s.z;
    if (s.paused || !Number.isFinite(x) || !Number.isFinite(z)) return;
    const g = gameKey(s.game);
    if (this.trailGame !== g) { this.trail = []; this.trailGame = g; }
    const loaded = s.job && s.trailerConnected ? 1 : 0;
    const add = (list, step) => {
      const p = [Math.round(x), Math.round(z), loaded];
      const tail = list[list.length - 1];
      if (!tail) { list.push(p); return; }          // liste vide (ou juste après une coupure)
      const d = Math.hypot(x - tail[0], z - tail[1]);
      if (d > TRAIL_JUMP) list.push(null, p);       // saut : on coupe le trait
      else if (d >= step || tail[2] !== loaded) list.push(p);
    };
    add(this.trail, TRAIL_STEP);
    if (this.trail.length > TRAIL_MAX) this.trail.splice(0, this.trail.length - TRAIL_MAX);
    if (this.current && this.current.path && this.current.game === g) add(this.current.path, JOB_STEP);
  }

  mapHistory() {
    const snap = this.snapshot();
    return {
      game: this.trailGame, trail: this.trail,
      current: this.current ? { path: this.current.path, from: this.current.from, to: this.current.to, toId: this.current.toId, fromId: this.current.fromId, game: this.current.game } : null,
      jobs: this.data.jobs.filter(j => j.path && j.path.length > 1).slice(0, 40)
        .map(j => ({ from: j.from, to: j.to, game: j.game, status: j.status, ended: j.ended, distance: j.distance, mode: j.mode, path: j.path })),
      live: snap.live
    };
  }

  onGameplay(e) {
    this.lastEvent = { id: e.id, at: Date.now(), data: e.data };
    const t = this.data.totals;
    if (e.id === 'job.delivered' || e.id === 'bus_job.completed') this.finishJob('livrée', e.data);
    else if (e.id === 'job.cancelled' || e.id === 'bus_job.cancelled') {
      this.recordExpense('annulation', e.data && e.data['cancel.penalty']);
      this.finishJob('annulée', e.data);
    } else if (e.id === 'player.fined') {
      const amount = e.data && e.data['fine.amount'];
      t.fines++; t.finesAmount += Number.isFinite(amount) ? amount : 0;
      this.recordExpense('amende', amount);
      this.dirty = true;
    } else if (e.id === 'player.tollgate.paid') this.recordExpense('péage', e.data && e.data['pay.amount']);
    else if (e.id === 'player.use.ferry') this.recordExpense('ferry', e.data && e.data['pay.amount']);
    else if (e.id === 'player.use.train') this.recordExpense('train', e.data && e.data['pay.amount']);
    this.emit('event', this.lastEvent);
  }

  recordExpense(type, amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (this.current) {
      this.current.expenses += amount;
      this.current.expenseItems.push({ type, amount, at: Date.now() });
      this.dirty = true;
    }
  }

  finishJob(status, info, silent) {
    const j = this.current;
    if (!j) return;
    clearTimeout(this.pendingFinish);
    this.pendingFinish = null;
    this.current = null;
    this.finishedKey = j.key; // évite de recompter la même mission si le jeu la renvoie juste après la livraison
    const dist = j.loaded + j.empty;
    const overPct = dist > 0 ? (j.over / dist) * 100 : 0;
    const race = overPct > this.thresholds().pct;
    const t = this.data.totals;
    t[race ? 'race' : 'real'] += dist;
    if (status === 'livrée') { t.deliveries++; t.revenue += (info && info.revenue) || j.income || 0; }
    if (status === 'annulée') t.cancelled++;
    const entry = {
      ...j, key: undefined, path: downsample(j.path || [], JOB_PATH_MAX), status, ended: Date.now(), distance: dist, overPct, mode: race ? 'course' : 'réel',
      revenue: info && info.revenue != null ? info.revenue : (status === 'livrée' ? j.income : 0),
      damage: info && info['cargo.damage'] != null ? info['cargo.damage'] : (this.live ? this.live.cargoDamage : 0),
      gameDistance: info && info['distance.km'] != null ? info['distance.km'] : null,
      fuelUsed: j.fuelUsed, fuelAdded: j.fuelAdded, fuelStops: j.fuelStops,
      expenses: j.expenses, expenseItems: j.expenseItems
    };
    this.data.jobs.unshift(entry);
    this.data.jobs = this.data.jobs.slice(0, 300);
    this.dirty = true;
    this.save();
    if (!silent) this.emit('job', entry);
  }

  // ---------------------------------------------------------------- pour l'interface
  snapshot() {
    const connected = Date.now() - this.lastPacket < 3000;
    const s = connected ? this.live : null;
    const vehicleType = this.vehicleType(s, connected);
    const th = this.thresholds(s, connected);
    let job = null;
    if (this.current) {
      const dist = this.current.loaded + this.current.empty;
      const overPct = dist > 0 ? (this.current.over / dist) * 100 : 0;
      job = { ...this.current, key: undefined, path: undefined, distance: dist, overPct, mode: overPct > th.pct ? 'course' : 'réel' };
    }
    return {
      connected, socketError: this.socketError || null,
      live: s, job, thresholds: th, vehicleType,
      session: this.session,
      totals: this.data.totals,
      today: this.data.days[today()] || { loaded: 0, empty: 0 },
      jobs: this.data.jobs.slice(0, 50).map(j => j.path ? { ...j, path: undefined } : j),
      lastEvent: this.lastEvent
    };
  }
}

module.exports = { Telemetry, PORT };
