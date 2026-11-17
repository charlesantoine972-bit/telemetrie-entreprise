const https = require('https');

const GAME_IDS = { ets2: 227300, ats: 270880 };

function validApiKey(value) {
  return /^[a-f0-9]{32}$/i.test(String(value || ''));
}

function validSteamId(value) {
  return /^\d{17}$/.test(String(value || ''));
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
        if (body.length > 1024 * 1024) req.destroy(new Error('Réponse Steam trop volumineuse.'));
      });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Steam a répondu avec le statut HTTP ${res.statusCode}.`));
          return;
        }
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error('Réponse JSON Steam invalide.')); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('Délai de réponse Steam dépassé.')));
    req.on('error', reject);
  });
}

async function getProfile(apiKey, steamId, request = requestJson) {
  if (!validApiKey(apiKey)) throw new Error('La clé Steam Web API doit contenir 32 caractères hexadécimaux.');
  if (!validSteamId(steamId)) throw new Error('Saisis un SteamID64 valide (17 chiffres).');

  const summaryUrl = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/');
  summaryUrl.searchParams.set('key', apiKey);
  summaryUrl.searchParams.set('steamids', steamId);
  const summary = await request(summaryUrl.toString());
  const player = summary && summary.response && summary.response.players && summary.response.players[0];
  if (!player) throw new Error('Steam n’a pas trouvé ce profil. Vérifie le SteamID64 et la visibilité du profil.');

  const gamesUrl = new URL('https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/');
  gamesUrl.searchParams.set('key', apiKey);
  gamesUrl.searchParams.set('steamid', steamId);
  gamesUrl.searchParams.set('include_appinfo', 'true');
  gamesUrl.searchParams.set('include_played_free_games', 'true');
  gamesUrl.searchParams.set('appids_filter[0]', String(GAME_IDS.ets2));
  gamesUrl.searchParams.set('appids_filter[1]', String(GAME_IDS.ats));
  const owned = await request(gamesUrl.toString());
  const games = owned && owned.response && owned.response.games;
  if (!Array.isArray(games)) {
    throw new Error('La liste de jeux Steam est indisponible. Le profil doit être public.');
  }

  const byId = new Map(games.map((game) => [Number(game.appid), game]));
  return {
    name: String(player.personaname || ''),
    profileUrl: String(player.profileurl || ''),
    avatarUrl: String(player.avatarfull || ''),
    games: Object.entries(GAME_IDS).map(([id, appid]) => {
      const game = byId.get(appid);
      return {
        id,
        name: id === 'ets2' ? 'Euro Truck Simulator 2' : 'American Truck Simulator',
        owned: !!game,
        playtimeHours: game ? Math.round((Number(game.playtime_forever) || 0) / 60) : null
      };
    })
  };
}

module.exports = { GAME_IDS, validApiKey, validSteamId, getProfile };
