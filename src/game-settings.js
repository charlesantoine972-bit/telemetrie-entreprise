// Réglages par jeu (bêta) : ETS2 et ATS ont chacun leur jeu de réglages « de jeu ».
// Les réglages actifs restent à la racine (settings.vehicleType, settings.hud…) pour tout le code
// existant ; settings.games garde une copie par jeu, et settings.activeGame dit lequel est chargé.
// Changer de jeu (choix dans l'appli ou jeu détecté) range les réglages actifs dans leur jeu,
// puis charge ceux de l'autre.
const GAMES = ['ets2', 'ats'];
const GAME_KEYS = ['vehicleType', 'limitTruck', 'limitCar', 'racePct', 'hud', 'modules', 'units', 'atelier'];
// Réglages d'un jeu modifiables depuis les Paramètres généraux sans changer de jeu
const GAME_KEYS_REMOTE = ['atelier'];
const UNITS_DEFAULT = { ets2: 'metric', ats: 'imperial' };

const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const pick = (src) => Object.fromEntries(GAME_KEYS.filter(k => src[k] !== undefined).map(k => [k, clone(src[k])]));

// Premier lancement de la bêta : les réglages actuels sont repris pour les deux jeux.
function initGameSettings(settings) {
  const games = settings.games && typeof settings.games === 'object' ? settings.games : {};
  for (const g of GAMES) {
    if (!games[g] || typeof games[g] !== 'object') games[g] = { ...pick(settings), units: UNITS_DEFAULT[g] };
    if (!['metric', 'imperial'].includes(games[g].units)) games[g].units = UNITS_DEFAULT[g];
    if (typeof games[g].atelier !== 'boolean') games[g].atelier = !!settings.atelier;   // bêta 4 : outils par jeu
  }
  settings.games = games;
  if (!GAMES.includes(settings.activeGame)) settings.activeGame = 'ets2';
  Object.assign(settings, clone(games[settings.activeGame]));
  return settings;
}

// Après un changement de réglage : la copie du jeu actif suit.
function rememberActive(settings) {
  if (!settings.games || !GAMES.includes(settings.activeGame)) return settings;
  settings.games[settings.activeGame] = { ...settings.games[settings.activeGame], ...pick(settings) };
  return settings;
}

// Passe sur un autre jeu. Renvoie true si quelque chose a changé.
function switchGame(settings, game) {
  if (!GAMES.includes(game) || !settings.games) return false;
  if (settings.activeGame === game) return false;
  rememberActive(settings);
  settings.activeGame = game;
  Object.assign(settings, clone(settings.games[game]));
  return true;
}

// « Copier depuis l'autre jeu » : tous les réglages de jeu sauf les unités, propres à chaque jeu.
function copyGameSettings(settings, from, to) {
  if (!GAMES.includes(from) || !GAMES.includes(to) || from === to || !settings.games) return false;
  rememberActive(settings);
  const src = clone(settings.games[from]);
  delete src.units;
  settings.games[to] = { ...settings.games[to], ...src };
  if (settings.activeGame === to) Object.assign(settings, clone(settings.games[to]));
  return true;
}

// Change un réglage d'un jeu précis (ex. Interface → Truck & Road Trip Tools pendant qu'ETS2 est choisi).
function setGameKey(settings, game, key, value) {
  if (!GAMES.includes(game) || !GAME_KEYS_REMOTE.includes(key) || !settings.games) return false;
  const v = key === 'atelier' ? !!value : value;
  settings.games[game] = { ...settings.games[game], [key]: v };
  if (settings.activeGame === game) settings[key] = v;
  return true;
}

module.exports = { GAMES, GAME_KEYS, setGameKey, UNITS_DEFAULT, initGameSettings, rememberActive, switchGame, copyGameSettings };
