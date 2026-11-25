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

test('la feuille de route sépare camion / car et détaille frais, revenu et solde', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');
  const start = html.indexOf('function renderRoadmap(sn){');
  const end = html.indexOf('\nfunction renderPlugin(', start);
  assert.ok(start >= 0 && end > start);
  const ids = ['routeConnection', 'routeMission', 'routeStats', 'routeExpenseTotal', 'routeExpenses', 'routeFuelStops', 'routeHistory', 'routeCountTruck', 'routeCountBus'];
  const nodes = new Map(ids.map(id => [id, { innerHTML: '', textContent: '' }]));
  const context = {
    document: { getElementById: id => nodes.get(id) },
    fmt: value => String(value),
    km: value => `${value} km`,
    dur: min => `${Math.round(min)} min`,
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
  assert.match(history, /12000 €/);
  assert.match(history, /1450 €/);
  assert.match(history, /10550 €/);
  assert.match(history, /Livré/);
  for (const t of [/péage/, /200 €/, /ferry/, /450 €/, /amende/, /800 €/]) assert.match(history, t);

  render(null, [{ ...finished, ended: 5, expenseItems: undefined }]);
  assert.match(nodes.get('routeHistory').innerHTML, /Détail non disponible pour cette ancienne mission/);

  // Un service car abandonné : il n’apparaît pas dans l’onglet camion, mais les compteurs le voient.
  const bus = {
    missionType: 'bus', from: 'Lille', to: 'Rouen', nextStop: 'Amiens', stageCount: 3, stageCurrent: 1,
    ended: 9, status: 'annulée', abandoned: true, game: 'ets2', distance: 60, revenue: 0, expenses: 300,
    expenseItems: [{ type: 'annulation', amount: 300, at: 8 }],
    stops: [{ kind: 'départ', name: 'Lille', at: 0, km: 0 }, { kind: 'arrêt', name: 'Arras', at: 4, km: 40 }, { kind: 'abandon', name: 'Amiens', at: 8, km: 60 }]
  };
  render(null, [bus, { ...finished, ended: 6 }]);
  assert.equal(nodes.get('routeCountTruck').textContent, 1);
  assert.equal(nodes.get('routeCountBus').textContent, 1);
  assert.doesNotMatch(nodes.get('routeHistory').innerHTML, /Arras/);
  context.routeTab = 'bus'; vm.runInContext("routeTab = 'bus'; routeSig = ''", context);
  render(null, [bus, { ...finished, ended: 6 }]);
  const busHtml = nodes.get('routeHistory').innerHTML;
  assert.match(busHtml, /Arras/);
  assert.match(busHtml, /Abandonné ici/);
  assert.match(busHtml, /Terminus non atteint/);
  assert.match(busHtml, /-300 €/);
});

test('le raccourci Profil reste indisponible au lieu d’ouvrir Options', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');
  const button = html.match(/<button id="profileChip"([^>]*)>/);
  assert.ok(button);
  assert.match(button[1], /\bdisabled\b/);
  assert.match(button[1], /title="La page Profil est en préparation\."/);
  assert.doesNotMatch(html, /document\.getElementById\('profileChip'\)\.onclick\s*=/);
});

test('Options : catégories façon réglages de jeu, chaque réglage dans la bonne catégorie', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');
  const cat = (k) => { const m = html.match(new RegExp(`<div class="optcat" id="oc-${k}"[\\s\\S]*?(?=<div class="optcat" id="oc-|</section>)`)); assert.ok(m, k); return m[0]; };
  const nav = html.match(/<nav class="optnav" id="optNav"[\s\S]*?<\/nav>/)[0];
  for (const k of ['general', 'conduite', 'jeu', 'affichage', 'acces', 'integrations', 'maj', 'aide']) {
    assert.match(nav, new RegExp(`data-oc="${k}"`));
    cat(k);
  }
  const conduite = cat('conduite');
  for (const id of ['sPseudo', 'sType', 'sTruck', 'sCar', 'sPct', 'btnSave']) assert.match(conduite, new RegExp(`id="${id}"`));
  assert.ok(conduite.indexOf('id="btnSave"') > conduite.indexOf('id="sPct"'));
  for (const id of ['pluginList', 'btnInstall', 'btnChoose']) assert.match(cat('jeu'), new RegExp(`id="${id}"`));
  assert.match(cat('general'), /id="autoTelSwitch"/);
  // Interface → Éléments visibles : tout ce qui fait apparaître ou disparaître quelque chose
  for (const id of ['navMiniSwitch', 'soonSwitch', 'betaSwitch', 'betaDl']) assert.match(cat('affichage'), new RegExp(`id="${id}"`));
  assert.match(nav, /data-oc="affichage"[\s\S]*?<span>Interface<\/span>/);
  assert.match(cat('maj'), /id="notesSeg"/);
  // bêta 4 : un interrupteur d'outils par jeu, dans Interface → Éléments visibles
  assert.doesNotMatch(nav, /data-oc="tools"/);
  for (const g of ['ets2', 'ats']) assert.match(cat('affichage'), new RegExp(`data-atg="${g}"`));
  assert.match(cat('affichage'), /Truck &amp; Road Trip Tools/);
  assert.match(cat('maj'), /id="updCurrent"/);
  assert.match(cat('aide'), /id="coachDiag"/);
});

test('barre globale Game / News / Map / Settings / Support et page de choix du jeu', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');
  const rail = html.match(/<nav class="rail" id="rail"[\s\S]*?<\/nav>/)[0];
  const order = [...rail.matchAll(/data-rail="(\w+)"/g)].map(m => m[1]);
  assert.deepEqual(order, ['game', 'news', 'map', 'settings', 'support']);
  assert.doesNotMatch(rail, /is-soon/);                     // jamais masqués avec les pages en préparation
  const launcher = html.slice(html.indexOf('<div id="launcher">'), html.indexOf('<div id="modal"'));
  assert.match(launcher, /data-game="ets2"/); assert.match(launcher, /data-game="ats"/);
  assert.doesNotMatch(launcher, /data-open="(hub|market|atelier)"/); // plus de choix d'espace sur l'accueil
  assert.match(html, /const APP = \{ name: /);                // nom de l'appli centralisé
  assert.match(html, /id="v-support"/);
  assert.match(html, /html\.in-space \.rail\{display:none\}/);   // pas de barre globale dans les espaces
  assert.match(html, /id="navToggle"/); assert.match(html, /id="hudNavDot"/);
  assert.doesNotMatch(html, />Truck Tools</);
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

test('page HUD épurée : activateur et aperçus ; réglages dans Options → HUD', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');
  const hud = html.slice(html.indexOf('<section id="v-hud"'), html.indexOf('</section>', html.indexOf('<section id="v-hud"')));
  for (const id of ['hudOn', 'hudTestTruck', 'hudTestBus', 'hudOpenOptions']) assert.match(hud, new RegExp(`id="${id}"`));
  assert.match(hud, /data-hud-preview="truck"/); assert.match(hud, /data-hud-preview="bus"/);
  assert.doesNotMatch(hud, /data-hud-control=|id="hudTruckBoxes"|data-hstyle=/);
  const opt = html.match(/<div class="optcat" id="oc-hud"[\s\S]*?(?=<div class="optcat" id="oc-)/)[0];
  for (const id of ['hudOnOpt', 'hudTruckBoxes']) assert.match(opt, new RegExp(`id="${id}"`));
  for (const c of ['truck" data-hud-control="scale', 'truck" data-hud-control="position', 'truck" data-hud-control="opacity', 'bus" data-hud-control="scale', 'bus" data-hud-control="opacity']) assert.ok(opt.includes(`data-hud-profile="${c}"`), c);
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
  const context = { HUD_STYLES: { bandeau: 'Bandeau', compact: 'Compact', navigation: 'Navigation' }, HUD_SELECTABLE_STYLES: ['bandeau', 'navigation'], hudMission() {}, hudCoach() {}, hudTruck() {} };
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

test('bandeau camion : données du jeu, boîtes activables, rien d’inventé', () => {
  const { hudTruck } = require(path.resolve(__dirname, '..', 'app', 'hud-truck.js'));
  const el = () => ({ hidden: false, textContent: '', title: '', className: '', style: {}, classList: { s: new Set(), toggle(c, on) { on ? this.s.add(c) : this.s.delete(c); }, contains(c) { return this.s.has(c); } } });
  const els = new Map();
  const bottomKids = ['b-route', 'b-livraison', 'b-cargo', 'b-carburant', 'b-pause'];
  const panel = { classList: el().classList, setAttribute() {}, querySelector(sel) {
    const k = /data-t="(.+)"/.exec(sel)[1];
    if (!els.has(k)) els.set(k, el());
    const node = els.get(k);
    if (k === 'bottom') node.children = bottomKids.map(b => panel.querySelector(`[data-t="${b}"]`));
    return node;
  } };
  const root = { classList: { toggle() {} }, querySelector: () => panel };
  const T = k => els.get(k).textContent, H = k => els.get(k).hidden;
  hudTruck(root, { vehicleType: 'camion', options: { boxes: { pause: false } },
    live: { speed: 25, speedLimit: 25, gameTime: 2 * 1440 + 14 * 60 + 5, gear: 12, cruise: 0, fuel: 700, truck: { 'fuel.capacity': 1400 }, mandatoryBreak: 300, wear: { engine: 0.02, wheels: 0.35 } },
    mission: { type: 'truck', from: 'Paris', to: 'Prague', cargo: 'Pommes', mass: 20000, remainingKm: 521, remainingMin: 440, deadline: 3 * 1440 + 540, timeLeft: -30, loaded: true, cargoDamage: 0 } });
  assert.equal(T('route'), 'Paris → Prague');
  assert.equal(T('tag'), 'LIVRAISON');
  assert.equal(T('clock'), '14:05');
  assert.equal(T('gear'), '12');
  assert.equal(H('cruise'), true);
  assert.equal(T('left'), '521 km');
  assert.equal(T('deadline'), 'Jeu. 09:00');
  assert.match(T('timeLeft'), /de retard/);
  assert.equal(T('fuel'), '50 %');
  assert.equal(H('b-pause'), true);           // boîte désactivée dans les réglages
  assert.equal(T('wear'), '35 %');
  // Hors mission : pas de trajet ni de livraison inventés
  hudTruck(root, { vehicleType: 'camion', live: { speed: 0, gameTime: 600 }, mission: null });
  assert.equal(T('tag'), 'SANS MISSION');
  assert.equal(H('route'), true);
  assert.equal(H('b-livraison'), true);
  assert.equal(H('b-cargo'), true);
});

test('notes de version : numéros affichés, rubriques et bêta', () => {
  const ctx = { window: {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', 'app', 'data', 'notes-version.js'), 'utf8'), ctx);
  const w = ctx.window, va = w.versionAffichee;
  assert.equal(va('0.13.27'), '0.12.0.3');
  assert.equal(va('0.13.28'), '0.12.0.4');
  assert.equal(va('0.13.34'), '0.12.0.4');
  assert.equal(va('0.13.35'), '0.12.0.5');
  assert.equal(va('0.13.35-beta.1'), '0.12.0.4 bêta 1');
  assert.equal(va('0.13.35-beta.2'), '0.12.0.4 bêta 2');
  assert.equal(va('0.13.36-beta.1'), '0.12.0.5 bêta 1');
  const pkg = require('../package.json');
  // la série 0.12 est continue, sans trou
  const serie = w.NOTES_VERSION.map(n => n.version).filter(x => x.startsWith('0.12'));
  assert.deepEqual([...serie], ['0.12.0.5', '0.12.0.4', '0.12.0.3', '0.12.0.2', '0.12.0.1', '0.12.0']);
  const types = new Set(w.NOTES_RUBRIQUES.map(([k]) => k));
  for (const n of [...w.NOTES_VERSION, ...w.NOTES_BETA]) for (const [t] of n.notes) assert.ok(types.has(t), n.version + ' : ' + t);
  // la version installée a toujours sa note
  const shown = va(pkg.version);
  assert.ok([...w.NOTES_VERSION, ...w.NOTES_BETA].some(n => n.version === shown), 'note manquante pour ' + shown);
});

test('bêta : réglages par jeu (ETS2 / ATS), copie et unités', () => {
  const gs = require('../src/game-settings');
  const st = { pseudo: 'James', vehicleType: 'camion', limitTruck: 100, limitCar: 110, racePct: 5, hud: { truck: { scale: 100 } }, modules: { hud: true } };
  gs.initGameSettings(st);
  assert.equal(st.activeGame, 'ets2');
  assert.equal(st.units, 'metric');
  assert.equal(st.games.ats.units, 'imperial');
  assert.equal(st.games.ats.limitTruck, 100, 'les réglages actuels sont repris pour ATS');
  st.limitTruck = 90; gs.rememberActive(st);
  assert.equal(st.games.ets2.limitTruck, 90);
  assert.equal(gs.switchGame(st, 'ats'), true);
  assert.equal(st.limitTruck, 100); assert.equal(st.units, 'imperial'); assert.equal(st.pseudo, 'James');
  assert.equal(gs.switchGame(st, 'ats'), false);
  gs.copyGameSettings(st, 'ets2', 'ats');
  assert.equal(st.limitTruck, 90, 'copié depuis ETS2');
  assert.equal(st.units, 'imperial', 'les unités restent propres à chaque jeu');
  st.hud.truck.scale = 120; gs.rememberActive(st);
  assert.equal(st.games.ets2.hud.truck.scale, 100, 'les deux jeux ne partagent pas le même objet HUD');
});

test('bêta : actualités Steam nettoyées (BBCode, images, liens)', () => {
  const { parseNews, cleanText, excerpt } = require('../src/steam-news');
  assert.equal(cleanText('[b]Hello[/b] {STEAM_CLAN_IMAGE}/a/b.png [url=https://x.y]le lien[/url]'), 'Hello le lien');
  assert.ok(excerpt('mot '.repeat(200), 50).endsWith('…'));
  const items = parseNews({ appnews: { newsitems: [
    { title: 'Mise à jour 1.58', contents: '[img]x[/img] Nouvelles routes', url: 'https://store.steampowered.com/news/1', date: 1700000000 },
    { title: 'Sans lien', contents: 'x', url: 'javascript:alert(1)', date: 1 }
  ] } }, 'ats');
  assert.equal(items.length, 1);
  assert.deepEqual(items[0], { game: 'ats', title: 'Mise à jour 1.58', text: 'Nouvelles routes', url: 'https://store.steampowered.com/news/1', date: 1700000000000 });
});

test('bêta : unités US pour ATS dans le HUD', () => {
  const U = require('../app/units.js');
  U.set('imperial');
  assert.equal(Math.round(U.speed(100 / 3.6)), 62);
  assert.equal(U.sp, 'mph'); assert.equal(U.d, 'mi'); assert.equal(U.v, 'gal');
  assert.equal(Math.round(U.toKmh(Math.round(U.fromKmh(100)))), 100);
  U.set('metric');
  assert.equal(Math.round(U.speed(25)), 90); assert.equal(U.sp, 'km/h');
  const hud = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'hud.html'), 'utf8');
  assert.match(hud, /<script src="units\.js"><\/script>/);
  assert.match(hud, /UNITS\.set\(d\.units\)/);
});

test('bêta : News, Marketplace cachée, paramètres généraux / du jeu, retour au menu', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');
  assert.match(html, /<section id="v-news"/);
  assert.match(html, /if \(t === 'news'\) go\('news', 'news'\);/);
  assert.match(html, /\[data-side-btn="market"\],#navMarket\{display:none!important\}/);
  assert.match(html, /const OPT_GAME = \['jeu', 'conduite', 'hud'\];/);
  assert.match(html, /if \(on\) resetSpaces\(\);/);
  assert.match(html, /Quitter sans appliquer/);
  const pre = fs.readFileSync(path.resolve(__dirname, '..', 'preload.js'), 'utf8');
  for (const k of ['setGame', 'copyGameSettings', 'steamNews']) assert.match(pre, new RegExp(k + ':'));
});

test('bêta 4 : outils par jeu et carte du jeu dans son espace', () => {
  const gs = require('../src/game-settings');
  const st = { atelier: true, vehicleType: 'camion' };
  gs.initGameSettings(st);
  assert.equal(st.games.ats.atelier, true, 'reprend le réglage actuel');
  assert.equal(gs.setGameKey(st, 'ats', 'atelier', false), true);
  assert.equal(st.games.ats.atelier, false); assert.equal(st.atelier, true, 'ETS2 (jeu actif) inchangé');
  assert.equal(gs.setGameKey(st, 'ets2', 'atelier', false), true); assert.equal(st.atelier, false);
  assert.equal(gs.setGameKey(st, 'ats', 'units', 'metric'), false, 'seuls certains réglages se changent à distance');
  gs.switchGame(st, 'ats'); gs.setGameKey(st, 'ats', 'atelier', true); gs.switchGame(st, 'ets2');
  assert.equal(st.atelier, false); assert.equal(st.games.ats.atelier, true);
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');
  assert.match(html, /function mapLocked\(\)\{ return typeof railTab === 'undefined' \|\| railTab !== 'map'; \}/);
  assert.match(html, /if \(mapLocked\(\)\) mapSetGame\(activeGame === 'ats' \? 'ats' : 'ets2'\);/);
  assert.match(html, /function toolsName\(g\)\{ return \(g \|\| activeGame\) === 'ats' \? 'Truck & Road Trip Tools' : 'Truck & Coach Tools'; \}/);
});

test('accès (préparation) : rangs, hiérarchie et permissions', () => {
  const R = require('../src/acces/rangs');
  const rank = id => R.SYSTEM_RANKS.find(r => r.id === id);
  const fond = rank('fondateur'), admin = rank('admin'), test_ = rank('testeur');
  assert.equal(R.permsOf(fond).length, R.PERM_IDS.length, 'le Fondateur a tout');
  assert.ok(R.canAssign(fond, admin)); assert.ok(R.canAssign(admin, test_));
  assert.ok(!R.canAssign(admin, admin), 'pas son propre niveau'); assert.ok(!R.canAssign(admin, fond)); assert.ok(!R.canAssign(test_, rank('membre')), 'il faut la permission');
  assert.ok(!R.canEditRank(fond, admin), 'les rangs de base sont fixes');
  let v = R.validateRank({ name: 'Chef de convoi', color: '#3B82F6', level: 40, perms: ['vtc.convois'] }, admin, R.SYSTEM_RANKS);
  assert.equal(v.ok, false, 'admin n’a pas acces.rangs');
  v = R.validateRank({ name: 'Chef de convoi', color: '#3B82F6', level: 40, perms: ['vtc.convois', 'inconnue'] }, fond, R.SYSTEM_RANKS);
  assert.ok(v.ok); assert.deepEqual([...v.rank.perms], ['vtc.convois']); assert.equal(v.rank.id, 'chef-de-convoi'); assert.equal(v.rank.color, '#3b82f6');
  assert.equal(R.validateRank({ name: 'X', color: '#000000', level: 10 }, fond, []).ok, false);
  assert.equal(R.validateRank({ name: 'Trop haut', color: '#000000', level: 100 }, fond, []).ok, false);
  assert.equal(R.validateRank({ name: 'administrateur', color: '#000000', level: 10 }, fond, R.SYSTEM_RANKS).ok, false, 'nom déjà pris');
  const chef = { id: 'chef', name: 'Chef', level: 50, perms: ['acces.rangs', 'vtc.convois'] };
  assert.equal(R.validateRank({ name: 'Adjoint', color: '#111111', level: 30, perms: ['vtc.gerer'] }, chef, []).ok, false, 'pas une permission qu’on n’a pas');
  assert.equal(R.validateRank({ name: 'Adjoint', color: '#111111', level: 60 }, chef, []).ok, false, 'pas plus haut que soi');
});

test('accès (préparation) : clés d’activation', () => {
  const K = require('../src/acces/cles');
  const seen = new Set();
  for (let i = 0; i < 200; i++) { const k = K.generateKey(); assert.match(k, /^TCH-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]$/); assert.ok(K.isWellFormed(k)); seen.add(k); }
  assert.equal(seen.size, 200);
  const k = K.generateKey();
  assert.ok(K.isWellFormed(k.toLowerCase().replace(/-/g, ' ')), 'minuscules et espaces acceptés');
  const body = k.slice(4, 18).replace(/-/g, '');
  const wrong = k.slice(0, 4) + (body[0] === 'A' ? 'B' : 'A') + k.slice(5);
  assert.equal(K.isWellFormed(wrong), false, 'une faute de frappe est repérée');
  assert.equal(K.normalizeKey('n’importe quoi'), null);
  assert.equal(K.validateGrant({}).ok, false);
  assert.equal(K.validateGrant({ rank: 'testeur', maxUses: 0 }).ok, false);
  assert.deepEqual({ ...K.validateGrant({ rank: 'testeur' }).grant }, { rank: 'testeur', perms: [], expiresAt: null, maxUses: 1 });
});

test('accès (préparation) : aperçu local (rangs, clés, activation)', async () => {
  const os = require('node:os');
  const { createProvider, Serveur } = require('../src/acces/fournisseur');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'acces-'));
  const p = createProvider({ dir, getSteamId: () => '76561198000000000' });
  let s = await p.session();
  assert.equal(s.mode, 'apercu'); assert.equal(s.rankId, 'fondateur'); assert.equal(s.steamId, '76561198000000000');
  await p.saveRank({ name: 'Chef de convoi', color: '#3b82f6', level: 40, perms: ['vtc.convois'] });
  const [key] = await p.createKeys(1, { rank: 'testeur', maxUses: 1 });
  await assert.rejects(() => p.createKeys(1, { rank: 'fondateur' }), /plus bas/);
  await p.previewAs('membre');
  await assert.rejects(() => p.keys(), /ne le permet pas/);
  await assert.rejects(() => p.redeemKey('TCH-0000-0000-0000-0'), /mal écrite|inconnue/);
  const r = await p.redeemKey(key.key.toLowerCase());
  assert.equal(r.rank.id, 'testeur'); assert.ok(r.perms.includes('beta.acces'));
  await assert.rejects(() => p.redeemKey(key.key), /déjà été utilisée/);
  // relu depuis le disque
  const p2 = createProvider({ dir });
  assert.equal((await p2.session()).rankId, 'testeur');
  assert.ok((await p2.ranks()).some(x => x.id === 'chef-de-convoi'));
  await p2.resetPreview(); assert.equal((await p2.session()).rankId, 'fondateur');
  await assert.rejects(() => new Serveur('https://exemple').session(), /n’existe pas encore/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('accès (préparation) : VTC TruckersMP lue par SteamID', async () => {
  const V = require('../src/acces/vtc');
  const fake = (routes) => async (url) => { const b = routes[url]; return { ok: !!b, status: b ? 200 : 404, json: async () => b }; };
  const api = 'https://api.truckersmp.com/v2';
  const r = await V.truckersmpVtc('76561198000000001', fake({
    [`${api}/player/76561198000000001`]: { error: false, response: { name: 'James', vtc: { id: 12, name: 'Atlantique Logistique', tag: 'ATL', inVTC: true, memberID: 99 } } },
    [`${api}/vtc/12/member/99`]: { error: false, response: { role: 'Event Manager' } },
  }));
  assert.deepEqual(JSON.parse(JSON.stringify(r)), { found: true, vtc: { platform: 'truckersmp', vtcId: 12, name: 'Atlantique Logistique', tag: 'ATL', memberId: 99, player: 'James', role: 'Event Manager' } });
  const none = await V.truckersmpVtc('76561198000000002', fake({ [`${api}/player/76561198000000002`]: { error: false, response: { vtc: { inVTC: false } } } }));
  assert.equal(none.vtc, null);
  assert.equal((await V.truckersmpVtc('76561198000000003', fake({}))).found, false);
  await assert.rejects(() => V.truckersmpVtc('123'), /SteamID64/);
  assert.equal(V.mapVtcRole(' event manager ', { 'Event Manager': 'chef-de-convoi' }), 'chef-de-convoi');
});

test('sécurité : fenêtres verrouillées, aucune permission web, outils et chemins contrôlés', () => {
  const main = fs.readFileSync(path.resolve(__dirname, '..', 'main.js'), 'utf8');
  assert.match(main, /contextIsolation: true, nodeIntegration: false, sandbox: true/);
  assert.match(main, /wc\.on\('will-navigate'/);
  assert.match(main, /wc\.on\('will-attach-webview', \(e\) => e\.preventDefault\(\)\)/);
  assert.equal((main.match(/lockDown\((win|hudWin)\.webContents\)/g) || []).length, 2, 'les deux fenêtres');
  assert.match(main, /setPermissionRequestHandler\(\(_wc, _perm, cb\) => cb\(false\)\)/);
  assert.match(main, /\(!app\.isPackaged && process\.env\.TCH_DECRYPT\)/, 'pas d’exe remplaçable dans l’appli installée');
  const { Atelier } = require('../src/atelier');
  const a = new Atelier('/tmp/docs', '/tmp/bk', '/nonexistent');
  for (const bad of ['ets2/profiles/.', 'ets2/profiles/..', 'ets2/profiles/', 'ets2/profiles/../x', 'ets2/profiles/AB\\..', 'ets2/profiles/zz'])
    assert.throws(() => a.resolve(bad), /Profil inconnu/, bad);
  assert.equal(a.resolve('ets2/profiles/4A616D6573').folder, '4A616D6573');
});

test('bêta 5 : mode Paramètres (dossiers dans la barre) et recherche', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');
  for (const f of ['back', 'compte', 'appli', 'jeu', 'connexions', 'donnees', 'aide']) assert.match(html, new RegExp(`data-srail="${f}"`));
  assert.match(html, /html\[data-rail="settings"\] \.rail-tabs:not\(\.rail-settings\)\{display:none\}/);
  assert.match(html, /id="optQuery" type="search"/);
  assert.match(html, /function runOptSearch\(\)/);
  for (const c of ['notifs', 'donnees']) assert.match(html, new RegExp(`<div class="optcat is-soon" id="oc-${c}"`));
  // chaque catégorie appartient à un dossier
  const cats = [...html.matchAll(/<div class="optcat[^"]*" id="oc-([a-z]+)"/g)].map(m => m[1]);
  const folders = /const SET_FOLDERS = \{([\s\S]*?)\};/.exec(html)[1];
  for (const c of cats) assert.match(folders, new RegExp(`'${c}'`), c);
});

test('TCH Map : projection du jeu vers longitude / latitude (villes réelles)', async () => {
  const { toLngLat } = await import('../tch-map/viewer/projection.js');
  const src = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'data', 'villes.js'), 'utf8');
  const V = JSON.parse(src.slice(src.indexOf('{'), src.lastIndexOf('}') + 1));
  const near = (game, id, lon, lat, tol) => {
    const c = V[game].find(v => v[0] === id); assert.ok(c, id);
    const [x, y] = toLngLat(game, c[2], c[3]);
    assert.ok(Math.hypot(x - lon, y - lat) < tol, `${id} : ${x.toFixed(2)}, ${y.toFixed(2)}`);
  };
  near('ets2', 'paris', 2.35, 48.86, 0.5); near('ets2', 'berlin', 13.4, 52.52, 0.5); near('ets2', 'oslo', 10.75, 59.9, 0.5);
  near('ets2', 'london', -0.13, 51.5, 0.6);   // Royaume-Uni : échelle propre au jeu
  near('ats', 'los_angeles', -118.24, 34.05, 0.5); near('ats', 'seattle', -122.33, 47.6, 0.5);
  // Islande : placée par SCS plus près du continent ; le fond de carte est recalé de la même façon
  near('ets2', 'reykjavik', -21.9 - 5.93, 64.1 - 1.75, 0.3);
});

test('TCH Map : serveur local (jeton, chemins, messages)', async () => {
  const { fork } = require('node:child_process');
  const http = require('node:http');
  const child = fork(path.resolve(__dirname, '..', 'tch-map', 'server.js'), [], { stdio: 'ignore' });
  try {
    const ready = await new Promise((res, rej) => { child.on('message', m => m.type === 'ready' && res(m)); setTimeout(() => rej(new Error('pas prêt')), 5000); });
    assert.match(ready.url, /^http:\/\/127\.0\.0\.1:\d+\/[0-9a-f]{48}\/$/);
    const get = (u) => new Promise((res) => http.get(u, r => { let b = ''; r.on('data', d => b += d); r.on('end', () => res({ code: r.statusCode, body: b, h: r.headers })); }));
    const base = ready.url;
    const ok = await get(base);
    assert.equal(ok.code, 200); assert.match(ok.body, /TCH Map/); assert.match(ok.h['content-security-policy'], /default-src 'self'/);
    assert.equal((await get(`http://127.0.0.1:${ready.port}/mauvaisjeton/`)).code, 404);
    assert.equal((await get(`http://127.0.0.1:${ready.port}/`)).code, 404);
    assert.notEqual((await get(base + '..%2f..%2fpackage.json')).code, 200);
    assert.notEqual((await get(base + 'data/..%2f..%2fmain.js')).code, 200);
    assert.equal((await get(base + 'vendor/maplibre-gl.mjs')).h['content-type'], 'text/javascript; charset=utf-8');
    // un message de l'hôte est rejoué à l'ouverture du flux
    child.send({ type: 'state', game: 'ets2', connected: true, x: 1, z: 2 });
    child.send({ type: 'pirate', x: 1 });
    await new Promise(r => setTimeout(r, 100));
    const ev = await new Promise((res) => http.get(base + 'events', r => { let b = ''; r.on('data', d => { b += d; if (b.includes('event: state')) { r.destroy(); res(b); } }); }));
    assert.match(ev, /event: state\ndata: \{"type":"state","game":"ets2"/);
    assert.doesNotMatch(ev, /pirate/);
  } finally { child.kill(); }
});

test('TCH Map : séparée de l’appli (aucun code partagé) et livrée avec elle', () => {
  const pkg = require('../package.json');
  assert.ok(pkg.build.files.includes('tch-map/**/*'));
  const main = fs.readFileSync(path.resolve(__dirname, '..', 'main.js'), 'utf8');
  assert.match(main, /utilityProcess\.fork\(path\.join\(__dirname, 'tch-map', 'server\.js'\)/);
  for (const f of ['server.js', 'viewer/carte.js', 'viewer/projection.js']) {
    const t = fs.readFileSync(path.resolve(__dirname, '..', 'tch-map', f), 'utf8');
    assert.match(t, /GNU General Public License v3/, f + ' : mention de licence');
    assert.doesNotMatch(t, /require\(['"]\.\.\/(src|app)|from ['"]\.\.\/\.\.\/(src|app)/, f + ' : pas de code de l’appli');
  }
  assert.ok(fs.readFileSync(path.resolve(__dirname, '..', 'tch-map', 'LICENSE'), 'utf8').includes('GNU GENERAL PUBLIC LICENSE'));
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');
  assert.match(html, /frame-src http:\/\/127\.0\.0\.1:\*/);
  assert.match(html, /<iframe id="tchFrame"[^>]*sandbox="allow-scripts allow-same-origin allow-popups"/);
});

test('TCH Map : CityHash64 en JavaScript (mêmes résultats que la version native)', () => {
  const { city64 } = require('../tch-map/lecteur/cityhash.js');
  assert.equal(city64('manifest.sii'), 13366683130979122325n);
  assert.equal(city64('def/vehicle/truck/renault.t_evo/data.sii'), 13486561534269033072n);
  assert.equal(city64('a'), 2603192927274642682n);
  assert.equal(city64('abcdefghijklmnopq'), 237482408704357350n);
});

test('TCH Map : lecteur d’archives (dossier) qui ne sort jamais de son dossier', () => {
  const { openArchive } = require('../tch-map/lecteur/archive.js');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tch-arch-'));
  fs.mkdirSync(path.join(root, 'def'));
  fs.writeFileSync(path.join(root, 'manifest.sii'), 'SiiNunit');
  fs.writeFileSync(path.join(root, 'def', 'a.sii'), 'x');
  const a = openArchive(root);
  assert.equal(a.kind, 'dossier');
  assert.equal(a.read('manifest.sii').toString(), 'SiiNunit');
  assert.deepEqual([...a.list('').dirs], ['def']);
  assert.equal(a.read('../package.json'), null);
  assert.equal(a.read('/def/../../x'), null);
});

test('TCH Map : tuiles et données de la carte du jeu servies depuis le dossier courant', async () => {
  const { fork } = require('node:child_process');
  const http = require('node:http');
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'tch-data-'));
  fs.mkdirSync(path.join(data, 'ets2', '2026-essai'), { recursive: true });
  fs.writeFileSync(path.join(data, 'ets2', 'courant.txt'), '2026-essai');
  fs.writeFileSync(path.join(data, 'ets2', '2026-essai', 'tuiles.bin'), Buffer.from('xxABCDyy'));
  fs.writeFileSync(path.join(data, 'ets2', '2026-essai', 'tuiles.json'), JSON.stringify({ tuiles: { '5/16/10': [2, 4] } }));
  fs.writeFileSync(path.join(data, 'ets2', '2026-essai', 'info.json'), '{"version":"1.62"}');
  const child = fork(path.resolve(__dirname, '..', 'tch-map', 'server.js'), [data], { stdio: 'ignore' });
  try {
    const ready = await new Promise((res, rej) => { child.on('message', m => m.type === 'ready' && res(m)); setTimeout(() => rej(new Error('pas prêt')), 5000); });
    const get = (u) => new Promise((res) => http.get(u, r => { const c = []; r.on('data', d => c.push(d)); r.on('end', () => res({ code: r.statusCode, body: Buffer.concat(c), h: r.headers })); }));
    const t = await get(ready.url + 'data/ets2/tuiles/5/16/10.pbf');
    assert.equal(t.code, 200); assert.equal(t.body.toString(), 'ABCD'); assert.equal(t.h['content-type'], 'application/x-protobuf');
    assert.equal((await get(ready.url + 'data/ets2/tuiles/5/0/0.pbf')).code, 204);
    assert.equal((await get(ready.url + 'data/ets2/info.json')).body.toString(), '{"version":"1.62"}');
    assert.notEqual((await get(ready.url + 'data/ets2/courant.txt')).code, 200);
    assert.notEqual((await get(ready.url + 'data/ets2/..%2f..%2fcourant.txt')).code, 200);
    assert.equal((await get(ready.url + 'data/pirate/info.json')).code, 404);
  } finally { child.kill(); }
});

test('TCH Map : extraction de la carte (programme séparé, sources fournies)', () => {
  const ext = fs.readFileSync(path.resolve(__dirname, '..', 'tch-map', 'extraction', 'extraire.cjs'), 'utf8');
  assert.match(ext.slice(0, 300), /truckermudgeon\/maps \(GPL-3\)/);
  assert.doesNotMatch(ext, /require\(["']bindings["']\)/, 'aucun module natif');
  for (const f of ['build.mjs', 'extraire.ts', 'tuiles.ts', 'patch-secteurs.mjs', 'LISEZMOI.md']) assert.ok(fs.existsSync(path.resolve(__dirname, '..', 'tch-map', 'outils', 'extraction', f)), f);
  const main = fs.readFileSync(path.resolve(__dirname, '..', 'main.js'), 'utf8');
  assert.match(main, /utilityProcess\.fork\(path\.join\(ext, 'extraire\.cjs'\)/);
  const pkg = require('../package.json');
  assert.ok(pkg.build.asarUnpack.includes('tch-map/extraction/**'));
  assert.ok(pkg.build.files.includes('!tch-map/outils/**'));
});

test('Mods & sauvegarde : analyse (familles, versions, manifeste) et programme séparé', () => {
  const { famille, compatible, lireManifest } = require('../tch-mods/analyse.js');
  assert.equal(famille('promods-eu-map-v283'), famille('promods-eu-map-v284'));
  assert.notEqual(famille('BBM Trailer LB3'), famille('BBM Trailer LB4'));
  assert.equal(compatible(['1.62.*'], '1.62.3.3'), true);
  assert.equal(compatible(['1.53.*', '1.54.*'], '1.62.3.3'), false);
  assert.equal(compatible([], '1.62.3.3'), null);
  const m = lireManifest(Buffer.from('SiiNunit\n{\nmod_package : .x\n{\n package_version: "2.84"\n display_name: "ProMods"\n compatible_versions[]: "1.62.*"\n}\n}'));
  assert.equal(m.nom, 'ProMods'); assert.deepEqual([...m.compatibles], ['1.62.*']);
  const t = fs.readFileSync(path.resolve(__dirname, '..', 'tch-mods', 'analyse.js'), 'utf8');
  assert.match(t, /GNU General Public License v3/);
  assert.doesNotMatch(t, /require\(['"]\.\.\/(src|app)/);
  assert.doesNotMatch(t, /writeFile|rmSync|unlink|rename/, 'lecture seule');
  const pkg = require('../package.json');
  assert.ok(pkg.build.files.includes('tch-mods/**/*'));
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');
  assert.match(html, /data-view="at-mods"/);
  assert.match(html, /Ta sauvegarde en a besoin : ne pas retirer/);
});

test('TCH Map : préparation parallèle, économe et automatique', () => {
  const src = (f) => fs.readFileSync(path.resolve(__dirname, '..', 'tch-map', 'outils', 'extraction', f), 'utf8');
  const ouv = src('ouvriers.ts');
  assert.match(ouv, /new Worker\(/);
  assert.match(ouv, /coeurs - 2/, 'des cœurs restent libres');
  assert.match(ouv, /os\.freemem\(\)/, 'nombre d’ouvriers limité par la mémoire libre');
  assert.match(src('extraire.ts'), /PRIORITY_BELOW_NORMAL/);
  const ext = fs.readFileSync(path.resolve(__dirname, '..', 'tch-map', 'extraction', 'extraire.cjs'), 'utf8');
  assert.match(ext, /tchOuvrier/);
  const main = fs.readFileSync(path.resolve(__dirname, '..', 'main.js'), 'utf8');
  assert.match(main, /carteJeu\.auto\(\)/);
  assert.match(main, /TCH_OUVRIERS/);
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'app', 'index.html'), 'utf8');
  assert.match(html, /tchPrepMini/);
});
