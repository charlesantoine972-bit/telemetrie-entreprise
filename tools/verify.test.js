const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { calculate, duration } = require('../app/mission-time');
const { scan, archives, rootFromLog } = require('../src/game-content');
const { readTileset } = require('../src/map-tileset');
const { mergeSavedSettings, mergeHudSettings, validateSettingsPatch } = require('../src/settings');
const steam = require('../src/steam');
const { EventEmitter } = require('node:events');
const { DiscordPresence, buildActivity } = require('../src/discord-presence');

test('syntaxe de tous les scripts de production et des pages', () => {
  const vm = require('node:vm'), root = path.resolve(__dirname, '..');
  const scripts = ['main.js', 'preload.js'];
  for (const dir of ['src', 'app']) for (const f of fs.readdirSync(path.join(root, dir))) if (f.endsWith('.js')) scripts.push(dir + '/' + f);
  for (const file of scripts) new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
  for (const file of ['app/index.html', 'app/hud.html']) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) if (m[1].trim()) new vm.Script(m[1], { filename: file });
  }
});

test('la feuille de route détaille les frais et le solde hors carburant', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');
  const start = html.indexOf('function renderRoadmap(sn){');
  const end = html.indexOf('\nfunction renderPlugin(', start);
  assert.ok(start >= 0 && end > start);
  const ids = ['routeConnection', 'routeMission', 'routeStats', 'routeExpenseTotal', 'routeExpenses', 'routeFuelStops', 'routeHistory'];
  const nodes = new Map(ids.map(id => [id, { innerHTML: '', textContent: '' }]));
  const context = {
    document: { getElementById: id => nodes.get(id) },
    fmt: value => String(value),
    km: value => `${value} km`,
    escM: value => String(value == null ? '' : value).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  };
  vm.runInNewContext(html.slice(start, end), context);
  const finished = {
    from: 'Paris', to: 'Lyon', ended: 0, status: 'livrée', game: 'ets2',
    distance: 450, fuelAdded: 25, fuelUsed: 10, revenue: 12000, expenses: 1450,
    expenseItems: [
      { type: 'péage', amount: 200, at: 0 },
      { type: 'ferry', amount: 450, at: 1 },
      { type: 'amende', amount: 800, at: 2 }
    ]
  };
  const current = {
    game: 'ets2', started: 0, from: 'Paris', to: 'Lyon', cargo: 'Colis',
    truck: 'Scania', distance: 100, income: 12000, expenses: 1450,
    fuelAdded: 0, fuelUsed: 0
  };
  const render = (job, jobs) => context.renderRoadmap({
    connected: true, live: { game: 'ets2' }, totals: { fuelAdded: 0, fuelUsed: 0 }, job, jobs
  });

  render(current, [finished]);
  assert.match(nodes.get('routeStats').innerHTML, /Solde prévu hors carburant/);
  assert.match(nodes.get('routeStats').innerHTML, /10550 €/);
  const history = nodes.get('routeHistory').innerHTML;
  assert.match(history, /Revenu 12000 €/);
  assert.match(history, /Frais 1450 €/);
  assert.match(history, /Solde hors carburant 10550 €/);
  assert.match(history, /péage/);
  assert.match(history, /200 €/);
  assert.match(history, /ferry/);
  assert.match(history, /450 €/);
  assert.match(history, /amende/);
  assert.match(history, /800 €/);

  render(null, [{ ...finished, expenseItems: undefined }]);
  assert.match(nodes.get('routeHistory').innerHTML, /détail de cette ancienne mission n’est pas disponible/);
});

test('le raccourci Profil reste indisponible au lieu d’ouvrir Options', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');
  const button = html.match(/<button id="profileChip"([^>]*)>/);
  assert.ok(button);
  assert.match(button[1], /\bdisabled\b/);
  assert.match(button[1], /title="La page Profil est en préparation\."/);
  assert.doesNotMatch(html, /document\.getElementById\('profileChip'\)\.onclick\s*=/);
});

test('les seuils de kilométrage sont regroupés dans un sous-menu replié', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');
  const submenu = html.match(/<details class="acc">\s*<summary>Règle des km réels \/ course<\/summary>([\s\S]*?)<\/details>/);
  assert.ok(submenu);
  for (const id of ['sTruck', 'sCar', 'sPct']) assert.match(submenu[1], new RegExp(`id="${id}"`));
  assert.ok(!/<details class="acc" open><summary>Règle des km réels \/ course/.test(html));
  assert.ok(html.indexOf('id="btnSave"') > html.indexOf(submenu[0]));
});

test('Plugin du jeu et Profil chauffeur sont regroupés dans une sous-catégorie repliée', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');
  const start = html.indexOf('<details class="acc" id="gameProfileOptions"');
  const end = html.indexOf('<h2 style="margin:0">Steam et Discord</h2>', start);
  assert.ok(start >= 0 && end > start);
  const group = html.slice(start, end);
  assert.match(group, /<summary>Configuration du jeu et du chauffeur<\/summary>/);
  assert.match(group, /<h2 style="margin:0">Plugin du jeu<\/h2>/);
  assert.match(group, /<h2 style="margin:0">Profil chauffeur<\/h2>/);
  assert.doesNotMatch(group.match(/^<details[^>]*>/)[0], /\bopen\b/);
});

test('les profils HUD camion et bus restent indépendants et migrent les anciens réglages', () => {
  const defaults = {
    look: { theme: 'base' },
    hud: {
      truck: { style: 'navigation', position: 'haut', logo: true, opacity: 82, scale: 100 },
      bus: { style: 'navigation', position: 'haut', logo: true, opacity: 82, scale: 100 }
    }
  };
  const migrated = mergeSavedSettings(defaults, { hud: { style: 'bandeau', opacity: 60 } });
  assert.equal(migrated.hud.truck.style, 'bandeau');
  assert.equal(migrated.hud.bus.style, 'bandeau');
  assert.equal(migrated.hud.truck.opacity, 60);
  const separate = mergeSavedSettings(defaults, { hud: { truck: { style: 'minimal' }, bus: { style: 'compact' } } });
  assert.equal(separate.hud.truck.style, 'minimal');
  assert.equal(separate.hud.bus.style, 'compact');
  assert.equal(separate.hud.truck.position, 'haut');
  const busUpdated = mergeHudSettings(defaults.hud, separate.hud, { bus: { opacity: 60 } });
  assert.equal(busUpdated.truck.style, 'minimal');
  assert.equal(busUpdated.bus.style, 'compact');
  assert.equal(busUpdated.bus.opacity, 60);
  const truckUpdated = mergeHudSettings(defaults.hud, busUpdated, { truck: { scale: 125 } });
  assert.equal(truckUpdated.truck.style, 'minimal');
  assert.equal(truckUpdated.truck.scale, 125);
  assert.equal(truckUpdated.bus.opacity, 60);
});

test('les styles HUD inachevés sont indisponibles et les tests camion/bus sont séparés', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');
  const truckStart = html.indexOf('<h2>1. Affichage camion</h2>');
  const truckEnd = html.indexOf('<h2>2. Affichage bus / car</h2>', truckStart);
  assert.ok(truckStart >= 0 && truckEnd > truckStart);
  const truckSection = html.slice(truckStart, truckEnd);
  for (const style of ['compact', 'tableau', 'minimal']) {
    assert.match(truckSection, new RegExp(`<button data-hstyle="${style}" disabled`));
  }
  for (const style of ['bandeau', 'navigation']) {
    assert.match(truckSection, new RegExp(`<button data-hstyle="${style}"`));
    assert.doesNotMatch(truckSection, new RegExp(`<button data-hstyle="${style}" disabled`));
  }
  assert.match(truckSection, /id="hudTestTruck">Tester le HUD camion/);

  const start = html.indexOf('<h2>2. Affichage bus / car</h2>');
  const end = html.indexOf('Chaque test anime uniquement l’aperçu correspondant', start);
  assert.ok(start >= 0 && end > start);
  const section = html.slice(start, end);
  assert.match(section, /Taille bus \/ car/);
  assert.match(section, /Opacité bus \/ car/);
  assert.doesNotMatch(section, /Style bus \/ car|Position bus \/ car|Logo bus \/ car/);
  assert.match(section, /id="hudTestBus">Tester le HUD bus/);
  const controls = [...section.matchAll(/data-hud-profile="bus" data-hud-control="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(controls, ['scale', 'opacity']);
});

test('le profil de carrière actif est indiqué dans les réglages HUD', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');
  assert.match(html, /Profil actif en jeu/);
  assert.match(html, /ne change pas à la sélection d’une mission camion/);
  assert.match(html, /id="hudVehicleDetected"[^>]*role="status"/);
  const coachCss = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'hud-coach.css'), 'utf8');
  assert.match(coachCss, /\.hud\.hud-coach\{[^}]*width:fit-content!important/);
  assert.doesNotMatch(coachCss, /width:min\(1080px/);
});

test('la taille de chaque aperçu HUD applique son échelle sans changer la position', () => {
  const keys = ['logo', 'speed', 'sp', 'lim', 'mode', 'kLeft', 'left', 'kKm', 'km', 'today'];
  const nodes = new Map(keys.map(key => [key, { textContent: '', className: '', classList: { toggle() {} } }]));
  const root = {
    className: '',
    classList: { toggle() {} },
    style: { setProperty() {} },
    querySelector(selector) {
      const match = /^\[data-h="(.+)"\]$/.exec(selector);
      return match && nodes.get(match[1]);
    }
  };
  const context = { HUD_STYLES: { bandeau: 'Bandeau', compact: 'Compact', navigation: 'Navigation' }, HUD_SELECTABLE_STYLES: ['bandeau', 'navigation'], hudMission() {}, hudCoach() {} };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '..', 'app', 'hud-render.js'), 'utf8'), context);
  context.hudRender(root, { options: { style: 'navigation', scale: 80, position: 'bas' }, live: {}, today: {} });
  assert.equal(root.style.transform, 'scale(0.8)');
  assert.equal(root.style.transformOrigin, 'bottom center');
  context.hudRender(root, { options: { style: 'compact' }, live: {}, today: {} });
  assert.equal(root.className, 'hud s-bandeau');
});

test('les seuils kilométriques sont bornés et entiers', () => {
  assert.doesNotThrow(() => validateSettingsPatch({ limitTruck: 60, limitCar: 150, racePct: 100 }));
  assert.throws(() => validateSettingsPatch({ limitTruck: 59 }), /entre 60 et 150/);
  assert.throws(() => validateSettingsPatch({ limitCar: 151 }), /entre 60 et 150/);
  assert.throws(() => validateSettingsPatch({ racePct: 2.5 }), /nombre entier entre 0 et 100/);
});

test('temps jeu, temps réel, délai dépassé et arrondi', () => {
  const t = calculate({ navTime: 7200, navDistance: 1000, localScale: 20, gameTime: 1440, job: { 'delivery.time': 1439 } }, 0);
  assert.equal(t.gameSeconds, 7200); assert.equal(t.realSeconds, 360); assert.equal(t.arrivalReal, 360000);
  assert.equal(t.deadlineGameSeconds, -60); assert.equal(t.deadlineRealSeconds, -3);
  assert.equal(duration(3599), '1 h 00'); assert.equal(duration(null), '—');
});
test('aucune échelle supposée, aucune heure d’arrivée pendant la pause', () => {
  assert.equal(calculate({ navTime: 100 }).realSeconds, null);
  assert.equal(calculate({ navTime: 100, localScale: 0 }).realSeconds, null);
  assert.equal(calculate({ navTime: 100, localScale: 19, paused: true }).arrivalReal, null);
  assert.equal(calculate(null).available, false);
  assert.equal(calculate({ navTime: NaN, localScale: 19 }).gameSeconds, null);
  assert.equal(calculate({ navTime: 0, navDistance: 0 }).gameSeconds, null);
});
test('le GPS du car ne promet pas la fin de la ligne', () => {
  const t = calculate({ navTime: 1200, localScale: 3, busJob: { anything: 'unknown' } });
  assert.equal(t.scope, 'prochain arrêt GPS'); assert.equal(t.coach, true);
});
test('le HUD Navigation privilégie la livraison, le chargement et le GPS', () => {
  class Element {
    constructor(tag) {
      this.tagName = tag; this.dataset = {}; this.children = []; this.hidden = false;
      this.className = ''; this.textContent = ''; this.title = '';
      this.classes = new Set();
      this.classList = {
        toggle: (name, on) => on ? this.classes.add(name) : this.classes.delete(name),
        contains: name => this.classes.has(name)
      };
    }
    append(...items) { this.children.push(...items); }
    querySelector(selector) {
      if (selector === 'b' || selector === 'span') return this.children.find(e => e.tagName === selector);
      if (selector.includes(' ')) {
        const [parent, child] = selector.split(' ');
        return this.querySelector(parent).querySelector(child);
      }
      const mission = /^\[data-mission=["']?(.+?)["']?\]$/.exec(selector);
      if (mission) return this.children.find(e => e.dataset.mission === mission[1]);
      return null;
    }
  }
  const root = new Element('root');
  root.className = 'hud s-navigation'; root.classes.add('s-navigation');
  root.children.push(Object.assign(new Element('div'), { className: 'mode', dataset: { h: 'mode' } }));
  root.children.push(Object.assign(new Element('div'), { className: 'k', dataset: { h: 'kKm' } }));
  root.children.push(Object.assign(new Element('div'), { className: 'k', dataset: { h: 'kToday' } }));
  root.querySelector = function (selector) {
    if (selector === '.mission-widgets') return this.children.find(e => e.className === 'mission-widgets');
    const hud = /^\[data-h="(.+)"\]$/.exec(selector);
    if (hud) return this.children.find(e => e.dataset.h === hud[1]);
    return null;
  };
  root.children.push(Object.assign(new Element('b'), { dataset: { h: 'coachClock' } }));
  const context = { document: { createElement: tag => new Element(tag) }, TCHMission: require('../app/mission-time') };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../app/hud-mission.js'), 'utf8'), context);
  context.hudMission(root, {
    connected: true, options: { style: 'navigation' }, vehicleType: 'camion',
    live: { navDistance: 85600, navTime: 3600, localScale: 20, gameTime: 1000, job: { 'delivery.time': 1100 } },
    job: { from: 'Paris', to: 'Lyon', cargo: 'Électronique', mass: 18000 }
  });
  const panel = root.querySelector('.mission-widgets');
  const value = key => panel.querySelector(`[data-mission=${key}]`);
  assert.equal(value('route').querySelector('b').textContent, 'Paris → Lyon');
  assert.equal(value('cargo').querySelector('b').textContent, 'Électronique · 18 t');
  assert.equal(value('remaining').querySelector('b').textContent, '85,6 km');
  assert.equal(value('real').querySelector('b').textContent, '0 h 03');
  assert.equal(value('deadlineReal').querySelector('b').textContent, '0 h 05');
  assert.equal(value('odometer').hidden, true);
  assert.equal(value('game').hidden, true);

  context.hudMission(root, {
    connected: true, options: { style: 'navigation' }, vehicleType: 'car',
    live: { navDistance: 2200, navTime: 300, localScale: 20, gameTime: 1000, odometer: 223872.7, fuelRange: 320, busJob: {}, job: { 'delivery.time': 1100 } },
    job: { from: 'Paris', to: 'Lyon', cargo: 'Électronique', mass: 18000 }
  });
  assert.equal(root.querySelector('[data-h="mode"]').textContent, 'SERVICE CAR');
  assert.equal(value('route').hidden, true);
  assert.equal(value('cargo').hidden, true);
  assert.equal(value('deadlineReal').hidden, true);
  assert.equal(value('real').hidden, false);
  assert.equal(value('odometer').hidden, false);
  assert.equal(value('odometer').querySelector('b').textContent, '223 872,7 km');
  assert.equal(value('fuelRange').querySelector('b').textContent, '320 km');
  assert.equal(root.querySelector('[data-h="coachClock"]').textContent, '16:40');
  assert.equal(root.querySelector('[data-h="kKm"]').classList.contains('off'), true);

  context.hudMission(root, {
    connected: true, options: { style: 'navigation' }, vehicleType: 'car',
    live: { busJob: {}, gameTime: NaN }, job: null
  });
  assert.equal(value('fuelRange').hidden, true);
  assert.equal(root.querySelector('[data-h="coachClock"]').textContent, '--:--');
});
test('le HUD autocar met la vitesse en avant et affiche les mesures GPS reçues', () => {
  const createNode = () => {
    const node = {
      textContent: '', title: '', dataset: {}, style: {}, children: [], attributes: {},
      classes: new Set(),
      classList: {
        toggle(name, on) { on ? node.classes.add(name) : node.classes.delete(name); },
        contains(name) { return node.classes.has(name); }
      },
      setAttribute(name, value) { node.attributes[name] = value; },
      append(...items) { node.children.push(...items); }
    };
    return node;
  };
  let panel = null;
  const root = createNode();
  root.querySelector = selector => selector === '.coach-panel' ? panel : null;
  root.append = node => { panel = node; };
  const makePanel = () => {
    const result = createNode(), fields = new Map();
    result.querySelector = selector => {
      const field = /^\[data-c="(.+)"\]$/.exec(selector);
      if (field) return fields.get(field[1]) || null;
      if (selector === '.coach-details') return result.details;
      return null;
    };
    result.details = createNode();
    Object.defineProperty(result, 'innerHTML', {
      set(markup) {
        for (const match of markup.matchAll(/data-c="([^"]+)"/g)) fields.set(match[1], createNode());
      }
    });
    return result;
  };
  const context = { document: { createElement: makePanel }, TCHMission: require('../app/mission-time') };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../app/hud-coach.js'), 'utf8'), context);
  context.hudCoach(root, {
    connected: true,
    vehicleType: 'car',
    live: {
      busJob: {}, speed: 20, speedLimit: 25, navDistance: 12345, navTime: 300,
      localScale: 20, gameTime: 64, odometer: 1200.44, fuel: 40, fuelRange: 320,
      restStop: 600, truck: { 'fuel.capacity': 100 }
    },
    coach: { inService: true, lineNumber: '232', lineName: 'Datteln Busbahnhof', nextStop: 'OER - Berliner Platz',
      stage: { current: 2, count: 4 }, scheduleMarginMinutes: -9, passengers: 0, capacity: 82,
      outsideTemp: null, cabinTemp: null, fuelPct: 40, distanceKm: 0, clockSeconds: 38, mandatoryBreak: 45 }
  });
  const value = key => panel.querySelector(`[data-c="${key}"]`).textContent;
  const hidden = key => panel.querySelector(`[data-c="${key}"]`).hidden === true;
  assert.equal(value('lineNo'), '232');
  assert.equal(value('lineName'), 'Datteln Busbahnhof');
  assert.equal(value('stage'), '2/4');
  assert.equal(value('clock'), '01:04:38');
  assert.equal(value('speed'), '72');
  assert.equal(value('limit'), '90');
  assert.equal(value('nextStop'), 'OER - Berliner Platz');
  assert.equal(value('timer'), '−9 min');
  assert.equal(panel.querySelector('[data-c="timerBox"]').classes.has('late'), true);
  assert.equal(value('distance'), '0,0 km');
  assert.equal(value('odometer'), '1 200,4 km'.replace(' ', (1200).toLocaleString('fr-FR').charAt(1)));
  assert.equal(value('pax'), '0/82');
  assert.equal(hidden('tempBox'), true, 'le SDK ne donne pas de température : case masquée');
  assert.equal(value('break'), '0 h 45');
  assert.equal(value('fuel'), '40 %');
  // Hors service : pas de ligne, prochain point GPS et temps restant
  context.hudCoach(root, { connected: true, vehicleType: 'car', live: { speed: 0, navDistance: 5000, navTime: 600, gameTime: 600 }, coach: { inService: false } });
  assert.equal(hidden('lineNo'), true);
  assert.equal(value('lineName'), 'Hors service');
  assert.equal(value('nextStop'), 'GPS · 5,0 km');
  assert.equal(value('timer'), '10 min');
  assert.equal(hidden('paxBox'), true);
  context.hudCoach(root, { connected: true, vehicleType: 'car', live: { job: null } });
  assert.equal(root.classes.has('hud-coach'), true);
});

test('le car est reconnu dès la montée à bord, avec ou sans service', () => {
  const coach = require('../src/coach');
  for (const id of ['vehicle.scania.touring', 'vehicle.volvo.9700dd', 'vehicle.man.lions_coach', 'vehicle.setra.s516hd'])
    assert.equal(coach.isCoachVehicle({ id }), true, id);
  for (const id of ['vehicle.scania.s_2016', 'vehicle.volvo.fh16_2012', 'vehicle.daf.xf', 'vehicle.man.tgx', 'vehicle.mercedes.actros2014'])
    assert.equal(coach.isCoachVehicle({ id }), false, id);
  assert.equal(coach.isCoachVehicle({ id: 'vehicle.mod.inconnu' }, ['vehicle.mod.inconnu']), true, 'car mémorisé après un service');

  const { Telemetry } = require('../src/telemetry');
  const t = new Telemetry(fs.mkdtempSync(path.join(os.tmpdir(), 'tch-coach-')), () => ({ vehicleType: 'camion', limitTruck: 100, limitCar: 110, racePct: 5, coachVehicles: [] }));
  const learned = [];
  t.on('coachVehicle', id => learned.push(id));
  t.lastPacket = Date.now();
  t.onState({ speed: 10, odometer: 100, gameTime: 600, localScale: 19, truck: { id: 'vehicle.scania.touring', brand: 'Scania', name: 'Touring' } });
  let sn = t.snapshot();
  assert.equal(sn.vehicleType, 'car', 'sans mission');
  assert.equal(sn.thresholds.limit, 110);
  assert.equal(sn.coach.inService, false);
  t.onState({ speed: 10, odometer: 100.3, gameTime: 600, localScale: 19, truck: { id: 'vehicle.volvo.fh16_2012', brand: 'Volvo', name: 'FH16' } });
  assert.equal(t.snapshot().vehicleType, 'camion', 'retour au camion');
  t.onState({ speed: 10, odometer: 50, gameTime: 601, truck: { id: 'vehicle.mod.x_2026' }, busJob: { 'bus.stages.count': 2, 'destination_stop.name': { 0: 'A', 1: 'B' } } });
  assert.deepEqual(learned, ['vehicle.mod.x_2026']);
});

test('frise de ligne : arrêts dans l’ordre et avancée sur l’étape', () => {
  const coach = require('../src/coach');
  const busJob = { 'bus.stages.count': 5, 'bus.stages.current': 2,
    'source_stop.name': { 0: 'Valencia', 1: 'Requena', 2: 'Motilla', 3: 'Tarancón', 4: 'Arganda' },
    'destination_stop.name': { 0: 'Requena', 1: 'Motilla', 2: 'Tarancón', 3: 'Arganda', 4: 'Madrid' } };
  const d = coach.describeCoach({ busJob }, null, { stageProgress: 0.25 });
  assert.deepEqual(d.route.stops, ['Valencia', 'Requena', 'Motilla', 'Tarancón', 'Arganda', 'Madrid']);
  assert.equal(d.route.next, 3, 'prochain arrêt = Tarancón');
  assert.equal(d.route.progress, 0.25);
  assert.equal(coach.describeCoach({ busJob: { 'bus.stages.count': 1, 'destination_stop.name': 'Gare' } }, null).route, null, 'un seul nom : pas de frise');

  const { Telemetry } = require('../src/telemetry');
  const t = new Telemetry(fs.mkdtempSync(path.join(os.tmpdir(), 'tch-route-')), () => ({ vehicleType: 'camion', limitTruck: 100, limitCar: 110, racePct: 5, coachVehicles: [] }));
  t.lastPacket = Date.now();
  const st = (nav, current) => ({ speed: 20, odometer: 100, gameTime: 600, navDistance: nav, truck: { id: 'vehicle.scania.touring' }, busJob: { ...busJob, 'bus.stages.current': current } });
  t.onState(st(20000, 2)); t.onState(st(15000, 2));
  assert.ok(Math.abs(t.snapshot().coach.route.progress - 0.25) < 1e-9);
  t.onState(st(30000, 3));
  assert.equal(t.snapshot().coach.route.progress, 0, 'nouvelle étape : on repart de l’arrêt');
  assert.equal(t.snapshot().coach.route.next, 4);
});

test('lecture tolérante d’un service car et kilomètres en service', () => {
  const coach = require('../src/coach');
  const b = coach.parseBusJob({
    bus_job_id: 'x1', 'bus.stages.count': 3, 'bus.stages.current': 1,
    'source_stop.name': { 0: 'Datteln Busbahnhof', 1: 'B', 2: 'C' }, 'destination_stop.name': { 0: 'B', 1: 'OER - Berliner Platz', 2: 'Recklinghausen' },
    'line.number': '232', 'line.name': 'Datteln Busbahnhof', 'passengers.count': { 0: 12, 1: 30 }, 'passengers.capacity': 82,
    'destination_stop.arrival_time': { 0: 590, 1: 640, 2: 700 }
  });
  assert.equal(b.nextStop, 'OER - Berliner Platz');
  assert.equal(b.to, 'Recklinghausen');
  assert.equal(b.lineNumber, '232');
  assert.equal(b.passengers, 30);
  assert.equal(b.capacity, 82);
  assert.equal(b.scheduleGameMinutes, 640);
  assert.equal(coach.parseBusJob({}), null);
  assert.equal(coach.parseBusJob(null), null);
  // Champs inconnus : rien n'est inventé
  const minimal = coach.parseBusJob({ 'bus.stages.count': 1, 'destination_stop.name': 'Gare' });
  assert.equal(minimal.lineNumber, null); assert.equal(minimal.passengers, null); assert.equal(minimal.nextStop, 'Gare');
  const d = coach.describeCoach({ gameTime: 600, navTime: 1800, navDistance: 9000, fuel: 150, truck: { 'fuel.capacity': 300 },
    busJob: { 'bus.stages.count': 1, 'destination_stop.name': 'Gare', 'delivery.time': 640 } }, null, {});
  assert.equal(d.scheduleMarginMinutes, 10, 'arrivée prévue 10 min avant l’horaire');
  assert.equal(d.fuelPct, 50);
  assert.equal(d.lineName, 'Gare', 'terminus à défaut de nom de ligne');
  assert.equal(d.outsideTemp, null);

  const { Telemetry } = require('../src/telemetry');
  const t = new Telemetry(fs.mkdtempSync(path.join(os.tmpdir(), 'tch-coach-')), () => ({ vehicleType: 'camion', limitTruck: 100, limitCar: 110, racePct: 5, coachVehicles: [] }));
  t.lastPacket = Date.now();
  const st = odo => ({ speed: 20, odometer: odo, gameTime: 600, truck: { id: 'vehicle.scania.touring' }, busJob: { 'bus.stages.count': 2, 'destination_stop.name': { 0: 'A', 1: 'B' } } });
  t.onState(st(100)); t.onState(st(100.2)); t.onState(st(100.4));
  assert.ok(t.snapshot().job.loaded > 0.39, 'km en service comptés comme chargés');
  assert.equal(t.snapshot().job.empty, 0);
  assert.ok(Math.abs(t.snapshot().coach.distanceKm - 0.4) < 1e-9);
});

test('lecture des archives sans modification, DLC présents distincts de leur activation', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tch-test-'));
  try {
    const dir = path.join(root, 'game'), bin = path.join(dir, 'bin', 'win_x64');
    const docs = path.join(root, 'docs'), logs = path.join(docs, 'Euro Truck Simulator 2');
    fs.mkdirSync(bin, { recursive: true }); fs.mkdirSync(logs, { recursive: true });
    fs.writeFileSync(path.join(bin, 'eurotrucks2.exe'), '');
    const data = Buffer.from([83, 67, 83, 35, 2, 0, 0, 0]);
    fs.writeFileSync(path.join(dir, 'dlc_test.scs'), data);
    fs.writeFileSync(path.join(dir, 'dlc_bad.scs'), 'broken');
    fs.writeFileSync(path.join(logs, 'game.log.txt'), `[fs] device ${dir}/dlc_test.scs mounted to scs pool.`);
    const result = await scan(docs, [], [{ id: 'ets2', bin }]);
    assert.equal(result.games.ets2.installed, true); assert.equal(result.games.ats.installed, false);
    const good = result.games.ets2.files.find(f => f.name === 'dlc_test.scs');
    assert.equal(good.format, 'HashFS 2'); assert.equal(good.mountedInLastLog, true);
    assert.equal(result.games.ets2.files.find(f => f.name === 'dlc_bad.scs').readable, false);
    assert.deepEqual(fs.readFileSync(path.join(dir, 'dlc_test.scs')), data);
    assert.equal((await archives(path.join(root, 'missing'))).error, 'ENOENT');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('chemin de jeu tiré du journal, espaces et guillemets compris', () => {
  assert.equal(rootFromLog('00:00 [sys] Command line: "D:\\Steam\\Euro Truck Simulator 2\\bin\\win_x64\\eurotrucks2.exe" -pure'), path.normalize('D:\\Steam\\Euro Truck Simulator 2'));
  assert.equal(rootFromLog('rien'), null);
});
test('import des tuiles TsMap valide les bornes et utilise le format 256 px', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tch-map-'));
  try {
    const tiles = path.join(root, 'Tiles', '0', '0');
    fs.mkdirSync(tiles, { recursive: true });
    fs.writeFileSync(path.join(root, 'TileMapInfo.json'), JSON.stringify({
      x1: -100, x2: 200, y1: -150, y2: 150, minZoom: 0, maxZoom: 8
    }));
    fs.writeFileSync(path.join(tiles, '0.png'), Buffer.from([137, 80, 78, 71]));
    const map = readTileset('ets2', root);
    assert.equal(map.info.tileSize, 256);
    assert.equal(map.info.localGenerated, true);
    assert.equal(map.info.maxZoom, 8);
    assert.throws(() => readTileset('ats', path.join(root, 'missing')), /ENOENT/);
    fs.writeFileSync(path.join(root, 'TileMapInfo.json'), JSON.stringify({
      x1: 5, x2: 1, y1: -150, y2: 150, minZoom: 0, maxZoom: 8
    }));
    assert.throws(() => readTileset('ets2', root), /invalide ou incomplet/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
test('Steam : validation des identifiants et lecture du profil public avec les deux jeux', async () => {
  const calls = [];
  const profile = await steam.getProfile('a'.repeat(32), '76561198000000000', async (url) => {
    calls.push(new URL(url));
    if (calls.length === 1) return { response: { players: [{ personaname: 'Chauffeur', profileurl: 'https://steamcommunity.com/profiles/76561198000000000', avatarfull: 'https://example.test/avatar.jpg' }] } };
    return { response: { games: [{ appid: 227300, playtime_forever: 1234 }] } };
  });
  assert.equal(profile.name, 'Chauffeur');
  assert.deepEqual(profile.games.map(({ id, owned }) => [id, owned]), [['ets2', true], ['ats', false]]);
  assert.equal(profile.games[0].playtimeHours, 21);
  assert.equal(calls[0].hostname, 'api.steampowered.com');
  assert.equal(calls[1].searchParams.get('appids_filter[1]'), '270880');
  await assert.rejects(steam.getProfile('invalid', '76561198000000000'), /32 caractères/);
  await assert.rejects(steam.getProfile('a'.repeat(32), '123'), /SteamID64/);
});
test('Discord Rich Presence ne partage pas les détails de mission', () => {
  assert.equal(buildActivity({ connected: false }), null);
  const activity = buildActivity({ connected: true, live: { game: 'ats' }, job: { from: 'Secret City', to: 'Other City' } });
  assert.equal(activity.details, 'American Truck Simulator');
  assert.equal(activity.state, 'En mission');
  assert.equal(JSON.stringify(activity).includes('Secret City'), false);
});
test('Discord : test de connexion puis effacement de la présence quand le jeu se déconnecte', async () => {
  const calls = [];
  class Client extends EventEmitter {
    async login(options) { calls.push(['login', options.clientId]); }
    async setActivity(activity) { calls.push(['set', activity.details]); }
    async clearActivity() { calls.push(['clear']); }
    async destroy() {}
  }
  const presence = new DiscordPresence({ Client });
  assert.deepEqual(await presence.test('12345678901234567'), {
    ok: true,
    message: 'Discord est connecté. Le test disparaît à la prochaine mise à jour de présence.'
  });
  await presence.update({ connected: false });
  assert.deepEqual(calls, [
    ['login', '12345678901234567'],
    ['set', 'Truck & Coach Hub'],
    ['clear']
  ]);
  await presence.disconnect();
});
