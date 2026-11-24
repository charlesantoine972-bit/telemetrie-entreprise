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
