// Réception des données du plugin (UDP local) + comptage des kilomètres.
// Tourne dans le processus principal : le comptage continue même si la fenêtre est réduite.
const dgram = require('dgram');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const PORT = 47311;
const MAX_TICK_KM = 0.5; // au-delà : saut (ferry, train, changement de camion) -> non compté

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
  }

  load() {
    const empty = { totals: { loaded: 0, empty: 0, real: 0, race: 0, deliveries: 0, cancelled: 0, revenue: 0, fuelUsed: 0, fines: 0, finesAmount: 0 }, days: {}, jobs: [] };
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
      else if (msg.type === 'shutdown') { this.live = null; this.lastOdo = null; }
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

  thresholds() {
    const s = this.getSettings();
    return { limit: s.vehicleType === 'car' ? s.limitCar : s.limitTruck, pct: s.racePct };
  }

  // ---------------------------------------------------------------- état reçu
  onState(s) {
    this.live = s;
    const kmh = s.speed * 3.6;

    // Mission : début / fin détectés via la configuration "job"
    const jobKey = s.job ? `${s.job['source.city']}|${s.job['destination.city']}|${s.job['cargo']}|${s.job['income']}` : null;
    if (!jobKey) this.finishedKey = null;
    if (jobKey && jobKey !== this.finishedKey && (!this.current || this.current.key !== jobKey)) {
      if (this.current) this.finishJob('interrompue');
      this.current = {
        key: jobKey, started: Date.now(),
        from: s.job['source.city'], fromCompany: s.job['source.company'],
        to: s.job['destination.city'], toCompany: s.job['destination.company'],
        cargo: s.job['cargo'], mass: s.job['cargo.mass'] || 0, income: s.job['income'] || 0,
        planned: s.job['planned_distance.km'] || 0,
        loaded: 0, empty: 0, over: 0, maxSpeed: 0,
        truck: s.truck ? `${s.truck.brand || ''} ${s.truck.name || ''}`.trim() : ''
      };
    } else if (!jobKey && this.current && !this.pendingFinish) {
      // Ancienne version du jeu sans évènement de livraison : on clôture quand la mission disparaît
      this.pendingFinish = setTimeout(() => {
        this.pendingFinish = null;
        if (this.current && !(this.live && this.live.job)) this.finishJob('terminée');
      }, 2000);
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

    // Carburant consommé (les pleins sont ignorés)
    if (this.lastFuel !== null && s.fuel < this.lastFuel && this.lastFuel - s.fuel < 5) {
      this.data.totals.fuelUsed += this.lastFuel - s.fuel;
    }
    this.lastFuel = s.fuel;
  }

  onGameplay(e) {
    this.lastEvent = { id: e.id, at: Date.now(), data: e.data };
    const t = this.data.totals;
    if (e.id === 'job.delivered') this.finishJob('livrée', e.data);
    else if (e.id === 'job.cancelled') this.finishJob('annulée', e.data);
    else if (e.id === 'player.fined') { t.fines++; t.finesAmount += e.data['fine.amount'] || 0; this.dirty = true; }
    this.emit('event', this.lastEvent);
  }

  finishJob(status, info, silent) {
    const j = this.current;
    if (!j) return;
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
      ...j, key: undefined, status, ended: Date.now(), distance: dist, overPct, mode: race ? 'course' : 'réel',
      revenue: info && info.revenue != null ? info.revenue : (status === 'livrée' ? j.income : 0),
      damage: info && info['cargo.damage'] != null ? info['cargo.damage'] : (this.live ? this.live.cargoDamage : 0),
      gameDistance: info && info['distance.km'] != null ? info['distance.km'] : null
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
    const th = this.thresholds();
    let job = null;
    if (this.current) {
      const dist = this.current.loaded + this.current.empty;
      const overPct = dist > 0 ? (this.current.over / dist) * 100 : 0;
      job = { ...this.current, key: undefined, distance: dist, overPct, mode: overPct > th.pct ? 'course' : 'réel' };
    }
    return {
      connected, socketError: this.socketError || null,
      live: s, job, thresholds: th,
      session: this.session,
      totals: this.data.totals,
      today: this.data.days[today()] || { loaded: 0, empty: 0 },
      jobs: this.data.jobs.slice(0, 50),
      lastEvent: this.lastEvent
    };
  }
}

module.exports = { Telemetry, PORT };
