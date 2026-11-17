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
  const context = { HUD_STYLES: { bandeau: 'Bandeau', navigation: 'Navigation' }, hudMission() {}, hudCoach() {} };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '..', 'app', 'hud-render.js'), 'utf8'), context);
  context.hudRender(root, { options: { style: 'navigation', scale: 80, position: 'bas' }, live: {}, today: {} });
  assert.equal(root.style.transform, 'scale(0.8)');
  assert.equal(root.style.transformOrigin, 'bottom center');
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
    connected: true, options: { style: 'navigation' }, vehicleType: 'car',
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
    connected: true, options: { style: 'navigation' }, vehicleType: 'camion',
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
test('le HUD autocar affiche les mesures reçues et laisse les horaires de ligne inconnus', () => {
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
    live: {
      busJob: {}, speed: 20, speedLimit: 25, navDistance: 12345, navTime: 300,
      localScale: 20, gameTime: 64, odometer: 1200, fuel: 40, fuelRange: 320,
      restStop: 60, truck: { 'fuel.capacity': 100 }
    }
  });
  const value = key => panel.querySelector(`[data-c="${key}"]`).textContent;
  assert.equal(value('line'), '—');
  assert.equal(value('stops'), '—');
  assert.equal(value('stop'), '—');
  assert.equal(value('delay'), '—');
  assert.equal(value('satisfaction'), '—');
  assert.equal(value('clock'), '01:04');
  assert.equal(value('distance'), '12,3 km');
  assert.equal(value('speed'), '72 km/h');
  assert.equal(value('limit'), '90 km/h');
  assert.equal(value('fuelRange'), '320 km');
  assert.equal(value('restStop'), '1 h 00');
  context.hudCoach(root, { connected: true, vehicleType: 'car', live: { job: null } });
  assert.equal(root.classes.has('hud-coach'), true);
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
