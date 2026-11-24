// Actualités officielles Steam d'ETS2 et d'ATS (annonces de SCS Software), pour la page News.
// API publique, sans clé : ISteamNews/GetNewsForApp.
const APPS = { ets2: 227300, ats: 270880 };
const CACHE_MS = 30 * 60 * 1000;
const cache = new Map();

// Le contenu Steam est en BBCode avec des images ({STEAM_CLAN_IMAGE}) : on garde du texte simple.
function cleanText(s) {
  return String(s || '')
    .replace(/\{STEAM_CLAN_IMAGE\}[^\s\]]*/g, ' ')
    .replace(/\[img\][\s\S]*?\[\/img\]/gi, ' ')
    .replace(/\[previewyoutube[^\]]*\][\s\S]*?\[\/previewyoutube\]/gi, ' ')
    .replace(/\[url=[^\]]*\]([\s\S]*?)\[\/url\]/gi, '$1')
    .replace(/\[\/?[a-z0-9*]+(?:=[^\]]*)?\]/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function excerpt(s, max = 220) {
  const t = cleanText(s);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 30)).replace(/[\s,;:.–-]+$/, '') + '…';
}

function parseNews(json, game) {
  const items = (json && json.appnews && Array.isArray(json.appnews.newsitems)) ? json.appnews.newsitems : [];
  return items
    .filter(n => n && n.title && /^https:\/\//.test(String(n.url || '')))
    .map(n => ({ game, title: cleanText(n.title), text: excerpt(n.contents), url: String(n.url), date: Number(n.date) * 1000 || null }));
}

async function steamNews(game, fetchImpl = globalThis.fetch) {
  const appid = APPS[game];
  if (!appid) throw new Error('Jeu inconnu');
  const hit = cache.get(game);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.items;
  const url = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appid}&count=8&maxlength=600&feeds=steam_community_announcements&format=json`;
  const r = await fetchImpl(url, { headers: { 'Accept': 'application/json' } });
  if (!r.ok) throw new Error('Steam a répondu ' + r.status);
  const items = parseNews(await r.json(), game);
  cache.set(game, { at: Date.now(), items });
  return items;
}

module.exports = { APPS, cleanText, excerpt, parseNews, steamNews };
