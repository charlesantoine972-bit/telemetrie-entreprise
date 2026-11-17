const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { calculate, duration } = require('../app/mission-time');
const { scan, archives, rootFromLog } = require('../src/game-content');
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
