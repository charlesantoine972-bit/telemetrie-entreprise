// Truck Tools : outils camion, remorque, garages et carte sur le texte d'un game.sii déchiffré.
// Écrit pour Truck & Coach Hub d'après le format des sauvegardes SCS (blocs « type : id { … } »).
// Toutes les fonctions sont pures : elles prennent le texte et renvoient le nouveau texte.
'use strict';

const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isNull = v => v == null || v === '' || v === 'null' || v === '""';

// ---------- Lecture des blocs
// Bloc d'un identifiant : { type, start, end, body } (end = position du « \n} » final)
function unit(text, id) {
  if (isNull(id)) return null;
  const re = new RegExp(`^([a-z0-9_]+) : ${esc(id)} \\{$`, 'm');
  const m = re.exec(text); if (!m) return null;
  const end = text.indexOf('\n}', m.index);
  return { type: m[1], start: m.index, end, body: text.slice(m.index, end) };
}
function firstUnit(text, type) {
  const m = new RegExp(`^${type} : ([^\\s{]+) \\{$`, 'm').exec(text); if (!m) return null;
  const end = text.indexOf('\n}', m.index);
  return { type, id: m[1], start: m.index, end, body: text.slice(m.index, end) };
}
function units(text, type) {
  const out = []; const re = new RegExp(`^${type} : ([^\\s{]+) \\{$`, 'gm'); let m;
  while ((m = re.exec(text))) { const end = text.indexOf('\n}', m.index); out.push({ type, id: m[1], start: m.index, end, body: text.slice(m.index, end) }); }
  return out;
}
const get = (body, key) => { const m = body.match(new RegExp(`^ ${esc(key)}: (.*)$`, 'm')); return m ? m[1].trim() : null; };
const has = (body, key) => new RegExp(`^ ${esc(key)}: `, 'm').test(body);
const set = (body, key, v) => body.replace(new RegExp(`^( ${esc(key)}: ).*$`, 'm'), `$1${v}`);
const arr = (body, key) => { const out = []; const re = new RegExp(`^ ${esc(key)}\\[(\\d+)\\]: (.*)$`, 'gm'); let m; while ((m = re.exec(body))) out[+m[1]] = m[2].trim(); return out; };
const setArr = (body, key, list) => {
  body = body.replace(new RegExp(`^ ${esc(key)}\\[\\d+\\]: .*\\n?`, 'gm'), '');
  return body.replace(new RegExp(`^ ${esc(key)}: \\d+$`, 'm'), ` ${key}: ${list.length}` + list.map((v, i) => `\n ${key}[${i}]: ${v}`).join(''));
};
// Remplace plusieurs blocs d'un coup (du dernier au premier pour garder les positions valides)
function patch(text, changes) {
  for (const c of changes.filter(Boolean).sort((a, b) => b.start - a.start)) text = text.slice(0, c.start) + c.body + text.slice(c.end);
  return text;
}
// Nombre SII : décimal ou « &hex » (float IEEE 754)
function num(v) {
  if (v == null) return 0;
  if (v.startsWith('&')) { const b = Buffer.alloc(4); b.writeUInt32BE(parseInt(v.slice(1), 16) >>> 0); return b.readFloatBE(0); }
  return parseFloat(v) || 0;
}
// Écriture d'un décimal : le jeu accepte les nombres en texte (« 0.5 ») comme en hexadécimal
const fnum = n => { const r = Math.round(n * 1000) / 1000; return Number.isInteger(r) ? String(r) : String(r); };

// Chaînes SII : octets non ASCII écrits en \xHH
function decStr(v) {
  if (v == null) return '';
  v = v.trim().replace(/^"|"$/g, '');
  const bytes = []; for (let i = 0; i < v.length; i++) {
    if (v[i] === '\\' && v[i + 1] === 'x') { bytes.push(parseInt(v.substr(i + 2, 2), 16)); i += 3; }
    else if (v[i] === '\\' && v[i + 1] === '"') { bytes.push(34); i += 1; }
    else for (const b of Buffer.from(v[i], 'utf8')) bytes.push(b);
  }
  return Buffer.from(bytes).toString('utf8');
}
function encStr(t) {
  let out = ''; for (const b of Buffer.from(String(t), 'utf8')) out += (b < 0x20 || b > 0x7e || b === 34 || b === 92) ? '\\x' + b.toString(16).padStart(2, '0') : String.fromCharCode(b);
  return '"' + out + '"';
}

// ---------- Véhicules du joueur
// Formats récents : player.assigned_vehicles -> player_vehicles { vehicle, trailer }.
// Formats anciens : player.my_truck / assigned_truck et player.my_trailer / assigned_trailer.
function player(text) { return firstUnit(text, 'player'); }

function playerVehicleUnits(text) {
  const p = player(text); if (!p) return [];
  return units(text, 'player_vehicles');
}

function current(text) {
  const p = player(text); if (!p) return { truck: null, trailer: null };
  const av = get(p.body, 'assigned_vehicles');
  if (!isNull(av)) {
    const pv = unit(text, av);
    if (pv) {
      const v = get(pv.body, 'vehicle'), t = get(pv.body, 'trailer');
      return { truck: isNull(v) ? null : v, trailer: isNull(t) ? null : t, playerVehicles: av };
    }
  }
  const truck = [get(p.body, 'my_truck'), get(p.body, 'assigned_truck')].find(v => !isNull(v)) || null;
  const trailer = [get(p.body, 'my_trailer'), get(p.body, 'assigned_trailer')].find(v => !isNull(v)) || null;
  return { truck, trailer };
}

// Modèle d'un véhicule d'après le chemin de ses accessoires (ex. /def/vehicle/truck/scania.s_2016/data.sii)
function modelOf(text, vehicle) {
  for (const acc of arr(vehicle.body, 'accessories')) {
    const a = unit(text, acc); if (!a) continue;
    const dp = (get(a.body, 'data_path') || '').replace(/"/g, '');
    const m = dp.match(/\/def\/vehicle\/(?:truck|bus|trailer_owned|trailer)\/([^/]+)\/data\.sii$/);
    if (m) {
      const [brand, ...rest] = m[1].split('.');
      const nice = s => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      return { code: m[1], brand: nice(brand), model: nice(rest.join(' ') || brand) };
    }
  }
  return { code: '', brand: '', model: '' };
}

// Ville du garage qui contient un véhicule
function garageOf(text, id) {
  for (const g of units(text, 'garage')) if (arr(g.body, 'vehicles').includes(id) || arr(g.body, 'trailers').includes(id)) return g.id.replace(/^garage\./, '');
  return null;
}

const WEAR_KEYS = ['engine_wear', 'transmission_wear', 'cabin_wear', 'chassis_wear'];
function maxWear(body, keys) {
  let w = 0; for (const k of keys) { const v = get(body, k); if (v != null) w = Math.max(w, num(v)); }
  for (const v of arr(body, 'wheels_wear')) w = Math.max(w, num(v));
  return w;
}
const plateText = v => { const s = decStr(v || ''); return s.split('|')[0].replace(/<[^>]*>/g, '').trim(); };
const plateCountry = v => { const s = decStr(v || ''); const i = s.lastIndexOf('|'); return i < 0 ? '' : s.slice(i + 1); };

function trucks(text) {
  const p = player(text); if (!p) return [];
  const cur = current(text).truck;
  return arr(p.body, 'trucks').filter(v => !isNull(v)).map(id => {
    const v = unit(text, id); if (!v) return null;
    return { id, ...modelOf(text, v), plate: plateText(get(v.body, 'license_plate')), country: plateCountry(get(v.body, 'license_plate')),
      odometer: Math.round(num(get(v.body, 'odometer'))), fuel: num(get(v.body, 'fuel_relative')), wear: maxWear(v.body, WEAR_KEYS),
      garage: garageOf(text, id), current: id === cur };
  }).filter(Boolean);
}

// Chaîne d'une remorque : la remorque puis ses remorques esclaves (doubles, triples)
function trailerChain(text, id) {
  const out = []; const seen = new Set();
  while (!isNull(id) && !seen.has(id)) { const t = unit(text, id); if (!t) break; seen.add(id); out.push(t); id = get(t.body, 'slave_trailer'); }
  return out;
}

function trailers(text) {
  const p = player(text); if (!p) return [];
  const cur = current(text).trailer;
  return arr(p.body, 'trailers').filter(v => !isNull(v)).map(id => {
    const t = unit(text, id); if (!t) return null;
    const chain = trailerChain(text, id);
    const def = unit(text, get(t.body, 'trailer_definition'));
    return { id, ...modelOf(text, t), plate: plateText(get(t.body, 'license_plate')), country: plateCountry(get(t.body, 'license_plate')),
      cargoMass: Math.round(num(get(t.body, 'cargo_mass'))), parts: chain.length,
      wear: Math.max(...chain.map(c => maxWear(c.body, ['trailer_body_wear', 'chassis_wear']))),
      restricted: def ? Number(get(def.body, 'country_validity')) > 0 : false,
      garage: garageOf(text, id), current: id === cur };
  }).filter(Boolean);
}

// Remorque attelée (même si elle n'appartient pas au joueur : remorque de mission)
function currentTrailerInfo(text) {
  const id = current(text).trailer; if (!id) return null;
  const chain = trailerChain(text, id); if (!chain.length) return null;
  const def = unit(text, get(chain[0].body, 'trailer_definition'));
  return {
    id, parts: chain.length, ...modelOf(text, chain[0]),
    cargoMass: chain.map(c => Math.round(num(get(c.body, 'cargo_mass')))),
    bodyMass: def && has(def.body, 'body_mass') ? Math.round(num(get(def.body, 'body_mass'))) : null,
    chassisMass: def && has(def.body, 'chassis_mass') ? Math.round(num(get(def.body, 'chassis_mass'))) : null,
    restricted: def ? Number(get(def.body, 'country_validity')) > 0 : false,
    plate: plateText(get(chain[0].body, 'license_plate')),
    owned: (() => { const p = player(text); return p ? arr(p.body, 'trailers').includes(id) : false; })()
  };
}

// ---------- Garages
// Statut des garages : 0 = non acheté, 6 = petit (1 place), 2 = moyen (3 places), 3 = grand (5 places).
const GARAGE_SIZES = { 6: 1, 2: 3, 3: 5 };
const GARAGE_RANK = { 0: 0, 1: 0, 6: 1, 2: 2, 3: 3 };
function garagesSummary(text) {
  const out = { total: 0, owned: 0, tiny: 0, small: 0, large: 0 };
  for (const g of units(text, 'garage')) {
    out.total++; const s = Number(get(g.body, 'status')) || 0;
    if (s > 1) out.owned++;
    if (s === 6) out.tiny++; else if (s === 2) out.small++; else if (s === 3) out.large++;
  }
  return out;
}
const used = (body, key) => arr(body, key).some(v => !isNull(v));
// Achète (ou agrandit) tous les garages vides. Ne touche jamais un garage qui contient un camion,
// un chauffeur ou une remorque, et ne réduit jamais un garage existant.
function buyGarages(text, status) {
  status = Number(status);
  if (!GARAGE_SIZES[status]) throw new Error('Taille de garage inconnue.');
  const slots = GARAGE_SIZES[status]; let n = 0;
  const changes = units(text, 'garage').map(g => {
    const cur = Number(get(g.body, 'status')) || 0;
    if (GARAGE_RANK[cur] >= GARAGE_RANK[status]) return null;
    if (used(g.body, 'vehicles') || used(g.body, 'drivers') || used(g.body, 'trailers')) return null;
    let b = set(g.body, 'status', status);
    const nulls = Array(slots).fill('null');
    b = setArr(b, 'vehicles', nulls); b = setArr(b, 'drivers', nulls);
    n++; return { start: g.start, end: g.end, body: b };
  });
  return { text: patch(text, changes), count: n };
}

// ---------- Villes, concessionnaires, agences
function cities(text) {
  const eco = firstUnit(text, 'economy'); if (!eco) return [];
  const s = new Set();
  for (const c of arr(eco.body, 'companies')) { const p = String(c).split('.'); if (p.length >= 4) s.add(p[p.length - 1]); }
  for (const g of arr(eco.body, 'garages')) { const p = String(g).split('.'); if (p.length >= 2) s.add(p[p.length - 1]); }
  for (const g of units(text, 'garage')) s.add(g.id.replace(/^garage\./, ''));
  return [...s].filter(Boolean).sort();
}
// Débloque une liste de l'économie (unlocked_dealers, unlocked_recruitments) pour toutes les villes connues.
// Le jeu ignore les villes qui n'ont pas de concessionnaire ou d'agence.
function unlockList(text, key) {
  const eco = firstUnit(text, 'economy'); if (!eco || !has(eco.body, key)) throw new Error('Liste « ' + key + ' » introuvable dans la sauvegarde.');
  const curList = arr(eco.body, key).filter(v => !isNull(v));
  const all = [...new Set([...curList, ...cities(text)])];
  return { text: patch(text, [{ start: eco.start, end: eco.end, body: setArr(eco.body, key, all) }]), count: all.length - curList.length };
}

// ---------- Réparation et carburant
function repairBody(body) {
  return body
    .replace(/^( (?:engine|transmission|cabin|chassis|trailer_body)_wear(?:_unfixable)?: ).*$/gm, '$10')
    .replace(/^( wheels_wear(?:_unfixable)?\[\d+\]: ).*$/gm, '$10')
    .replace(/^( cargo_damage: ).*$/gm, '$10');
}
function repairTrucks(text, target) {
  const ids = target === 'current' ? [current(text).truck] : arr(player(text).body, 'trucks');
  const list = ids.filter(v => !isNull(v)).map(id => unit(text, id)).filter(Boolean);
  if (!list.length) throw new Error(target === 'current' ? 'Aucun camion attribué à ton chauffeur.' : 'Aucun camion dans ta flotte.');
  return { text: patch(text, list.map(u => ({ ...u, body: repairBody(u.body) }))), count: list.length };
}
function repairTrailers(text, target) {
  const ids = target === 'current' ? [current(text).trailer] : arr(player(text).body, 'trailers');
  const list = ids.filter(v => !isNull(v)).flatMap(id => trailerChain(text, id));
  if (!list.length) throw new Error(target === 'current' ? 'Aucune remorque attelée.' : 'Aucune remorque dans ta flotte.');
  return { text: patch(text, list.map(u => ({ ...u, body: repairBody(u.body) }))), count: list.length };
}
// level : 0 à 1 = remplissage du réservoir ; au-delà (jusqu'à 10) = réservoir « géant » (carburant quasi infini)
function setFuel(text, target, level) {
  level = Math.min(10, Math.max(0, Number(level)));
  if (!Number.isFinite(level)) throw new Error('Niveau de carburant invalide.');
  const ids = target === 'current' ? [current(text).truck] : arr(player(text).body, 'trucks');
  const list = ids.filter(v => !isNull(v)).map(id => unit(text, id)).filter(u => u && has(u.body, 'fuel_relative'));
  if (!list.length) throw new Error('Aucun camion à ravitailler.');
  return { text: patch(text, list.map(u => ({ ...u, body: set(u.body, 'fuel_relative', fnum(level)) }))), count: list.length };
}

// ---------- Camion actuel
function setTruckKm(text, km) {
  km = Math.round(Number(km));
  if (!Number.isFinite(km) || km < 0 || km > 9999999) throw new Error('Kilométrage invalide (0 à 9 999 999).');
  const u = unit(text, current(text).truck); if (!u) throw new Error('Aucun camion attribué à ton chauffeur.');
  let b = u.body; for (const k of ['odometer', 'integrity_odometer', 'trip_distance_km']) if (has(b, k)) b = set(b, k, km);
  if (has(b, 'odometer_float_part')) b = set(b, 'odometer_float_part', 0);
  const changes = [{ ...u, body: b }];
  // Journal de rentabilité du camion (même rang que le camion dans player.trucks) : distance cumulée
  const p = player(text), idx = arr(p.body, 'trucks').indexOf(current(text).truck);
  const log = idx >= 0 ? unit(text, arr(p.body, 'truck_profit_logs')[idx]) : null;
  if (log) { let lb = log.body; if (has(lb, 'acc_distance_on_job')) lb = set(lb, 'acc_distance_on_job', km); if (has(lb, 'acc_distance_free')) lb = set(lb, 'acc_distance_free', 0); changes.push({ ...log, body: lb }); }
  return { text: patch(text, changes) };
}

// Plaque : texte (8 caractères max conseillés) + couleur facultative, le pays d'origine est conservé.
function plateValue(oldValue, plate, color) {
  plate = String(plate || '').trim();
  if (!plate) throw new Error('La plaque ne peut pas être vide.');
  if (plate.length > 12) throw new Error('Plaque : 12 caractères maximum.');
  if (/[<>|"\\]/.test(plate)) throw new Error('Plaque : les caractères < > | " et \\ sont interdits.');
  const country = plateCountry(oldValue);
  let t = plate;
  if (color && /^#?[0-9a-f]{6}$/i.test(color)) { const h = color.replace('#', ''); t = `<color value=ff${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}>${plate}`; } // le jeu attend AABBGGRR
  return encStr(country ? `${t}|${country}` : t);
}
function setPlate(text, kind, plate, color) {
  const id = kind === 'trailer' ? current(text).trailer : current(text).truck;
  const u = unit(text, id); if (!u || !has(u.body, 'license_plate')) throw new Error(kind === 'trailer' ? 'Aucune remorque attelée.' : 'Aucun camion attribué à ton chauffeur.');
  return { text: patch(text, [{ ...u, body: set(u.body, 'license_plate', plateValue(get(u.body, 'license_plate'), plate, color)) }]) };
}

// Changer de camion sans passer par le garage : le chauffeur du joueur prend la place du chauffeur du nouveau camion.
function setPlayerTruck(text, newId) {
  const p = player(text); if (!p) throw new Error('Bloc joueur introuvable.');
  if (!arr(p.body, 'trucks').includes(newId) || !unit(text, newId)) throw new Error('Ce camion n\'est pas dans ta flotte.');
  const cur = current(text).truck;
  if (cur === newId) throw new Error('C\'est déjà ton camion.');
  const changes = [];
  // Garages : échange des chauffeurs entre l'ancien et le nouveau camion
  const gs = units(text, 'garage');
  const where = id => { for (const g of gs) { const i = arr(g.body, 'vehicles').indexOf(id); if (i >= 0) return { g, i }; } return null; };
  const a = cur ? where(cur) : null, b = where(newId);
  if (!b) throw new Error('Garage du nouveau camion introuvable.');
  if (a) {
    const dA = arr(a.g.body, 'drivers')[a.i], dB = arr(b.g.body, 'drivers')[b.i];
    if (a.g === b.g) {
      let body = a.g.body.replace(new RegExp(`^ drivers\\[${a.i}\\]: .*$`, 'm'), ` drivers[${a.i}]: ${dB}`).replace(new RegExp(`^ drivers\\[${b.i}\\]: .*$`, 'm'), ` drivers[${b.i}]: ${dA}`);
      changes.push({ ...a.g, body });
    } else {
      changes.push({ ...a.g, body: a.g.body.replace(new RegExp(`^ drivers\\[${a.i}\\]: .*$`, 'm'), ` drivers[${a.i}]: ${dB}`) });
      changes.push({ ...b.g, body: b.g.body.replace(new RegExp(`^ drivers\\[${b.i}\\]: .*$`, 'm'), ` drivers[${b.i}]: ${dA}`) });
    }
  }
  // Joueur : ville du QG = garage du nouveau camion ; anciens formats : my_truck / assigned_truck
  let pb = p.body;
  const city = b.g.id.replace(/^garage\./, '');
  if (has(pb, 'hq_city')) pb = set(pb, 'hq_city', city);
  for (const k of ['my_truck', 'assigned_truck']) if (has(pb, k) && !isNull(get(pb, k))) pb = set(pb, k, newId);
  changes.push({ ...p, body: pb });
  // Format récent : tous les player_vehicles de l'ancien camion pointent vers le nouveau
  for (const pv of playerVehicleUnits(text)) if (cur && get(pv.body, 'vehicle') === cur) changes.push({ ...pv, body: set(pv.body, 'vehicle', newId) });
  return { text: patch(text, changes), city };
}

// Atteler une autre remorque de la flotte
function setPlayerTrailer(text, newId) {
  const p = player(text); if (!p) throw new Error('Bloc joueur introuvable.');
  if (!arr(p.body, 'trailers').includes(newId) || !unit(text, newId)) throw new Error('Cette remorque n\'est pas dans ta flotte.');
  const truck = current(text).truck; const changes = [];
  let n = 0;
  for (const pv of playerVehicleUnits(text)) if (truck && get(pv.body, 'vehicle') === truck && has(pv.body, 'trailer')) { changes.push({ ...pv, body: set(pv.body, 'trailer', newId) }); n++; }
  let pb = p.body;
  for (const k of ['my_trailer', 'assigned_trailer']) if (has(pb, k)) { pb = set(pb, k, newId); n++; }
  if (pb !== p.body) changes.push({ ...p, body: pb });
  if (!n) throw new Error('Impossible de trouver l\'attelage du joueur dans cette sauvegarde.');
  return { text: patch(text, changes) };
}

// ---------- Accessoires du camion actuel (badge, moteur, boîte de vitesses)
function accessories(text, vehicle) {
  return arr(vehicle.body, 'accessories').map(id => { const a = unit(text, id); return a ? { id, unit: a, path: (get(a.body, 'data_path') || '').replace(/"/g, '') } : null; }).filter(Boolean);
}
const partName = p => (p.split('/').pop() || '').replace(/\.sii$/, '').replace(/_/g, ' ').toUpperCase();
// Moteurs et boîtes disponibles : ceux déjà montés sur un camion du même modèle dans ta flotte
function partsInfo(text) {
  const cur = unit(text, current(text).truck); if (!cur) return null;
  const model = modelOf(text, cur).code; if (!model) return null;
  const pick = (v, kind) => (accessories(text, v).find(a => a.path.includes(`/${kind}/`)) || {}).path || null;
  const engines = new Set(), gearboxes = new Set();
  for (const id of arr(player(text).body, 'trucks')) {
    const v = unit(text, id); if (!v || modelOf(text, v).code !== model) continue;
    const e = pick(v, 'engine'), g = pick(v, 'transmission'); if (e) engines.add(e); if (g) gearboxes.add(g);
  }
  const badge = accessories(text, cur).some(a => a.path.split('/').includes('badge'));
  return { model, engine: pick(cur, 'engine'), transmission: pick(cur, 'transmission'), engines: [...engines].sort(), transmissions: [...gearboxes].sort(), badge,
    names: Object.fromEntries([...engines, ...gearboxes].map(p => [p, partName(p)])) };
}
function setPart(text, kind, newPath) {
  const info = partsInfo(text); if (!info) throw new Error('Aucun camion attribué à ton chauffeur.');
  const list = kind === 'engine' ? info.engines : info.transmissions;
  if (!list.includes(newPath)) throw new Error('Pièce non disponible pour ce modèle.');
  const cur = unit(text, current(text).truck);
  const acc = accessories(text, cur).find(a => a.path.includes(`/${kind}/`)); if (!acc) throw new Error('Pièce actuelle introuvable.');
  return { text: patch(text, [{ ...acc.unit, body: set(acc.unit.body, 'data_path', `"${newPath}"`) }]) };
}
// Retire le badge (logo de marque) de la calandre : l'accessoire est enlevé de la liste du camion et son bloc supprimé
function removeBadge(text) {
  const cur = unit(text, current(text).truck); if (!cur) throw new Error('Aucun camion attribué à ton chauffeur.');
  const badges = accessories(text, cur).filter(a => a.path.split('/').includes('badge'));
  if (!badges.length) throw new Error('Ce camion n\'a pas de badge.');
  const keep = arr(cur.body, 'accessories').filter(id => !badges.some(b => b.id === id));
  const changes = [{ ...cur, body: setArr(cur.body, 'accessories', keep) }];
  for (const b of badges) { let end = b.unit.end + 2; if (text[end] === '\n') end++; changes.push({ start: b.unit.start, end, body: '' }); }
  return { text: patch(text, changes), count: badges.length };
}

// ---------- Remorque attelée
// Poids de la cargaison (kg), sur la remorque et, si demandé, sur ses remorques esclaves (doubles, triples)
function setCargoMass(text, mass, withSlaves = true, everywhere = false) {
  mass = Math.round(Number(mass));
  if (!Number.isFinite(mass) || mass < 0 || mass > 200000) throw new Error('Poids invalide (0 à 200 000 kg).');
  if (everywhere) {
    const all = units(text, 'trailer').filter(u => has(u.body, 'cargo_mass') && num(get(u.body, 'cargo_mass')) > 0);
    if (!all.length) throw new Error('Aucune remorque chargée dans la sauvegarde.');
    return { text: patch(text, all.map(u => ({ ...u, body: set(u.body, 'cargo_mass', mass) }))), count: all.length };
  }
  const chain = trailerChain(text, current(text).trailer);
  if (!chain.length) throw new Error('Aucune remorque attelée.');
  const list = (withSlaves ? chain : chain.slice(0, 1)).filter(u => has(u.body, 'cargo_mass'));
  if (!list.length) throw new Error('Cette remorque n\'a pas de cargaison.');
  return { text: patch(text, list.map(u => ({ ...u, body: set(u.body, 'cargo_mass', mass) }))), count: list.length };
}
// Poids à vide de la remorque (définition) : caisse et châssis, en kg
function setTrailerDefMass(text, body, chassis) {
  const chain = trailerChain(text, current(text).trailer); if (!chain.length) throw new Error('Aucune remorque attelée.');
  const def = unit(text, get(chain[0].body, 'trailer_definition')); if (!def) throw new Error('Définition de la remorque introuvable.');
  let b = def.body;
  for (const [k, v] of [['body_mass', body], ['chassis_mass', chassis]]) {
    if (v == null || v === '') continue;
    const n = Math.round(Number(v)); if (!Number.isFinite(n) || n < 0 || n > 100000) throw new Error('Poids à vide invalide (0 à 100 000 kg).');
    if (has(b, k)) b = set(b, k, n);
  }
  return { text: patch(text, [{ ...def, body: b }]) };
}
// Autoriser la remorque partout : supprime la liste des pays autorisés de sa définition
function unlockTrailer(text) {
  const chain = trailerChain(text, current(text).trailer); if (!chain.length) throw new Error('Aucune remorque attelée.');
  const changes = []; const done = new Set();
  for (const t of chain) {
    const def = unit(text, get(t.body, 'trailer_definition')); if (!def || done.has(def.start)) continue; done.add(def.start);
    let b = def.body;
    if (has(b, 'country_validity')) b = setArr(b, 'country_validity', []);
    if (has(b, 'source_name')) b = set(b, 'source_name', 'null');
    changes.push({ ...def, body: b });
  }
  if (!changes.length) throw new Error('Définition de la remorque introuvable.');
  return { text: patch(text, changes) };
}

// ---------- Téléportation (position de la caméra de développement, fichier cams.txt)
// Une ligne de cams.txt : « …;x;y;z;rw;rx;ry;rz;… » (Alt+F12 en mode développeur)
function parseCams(content) {
  const lines = String(content || '').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#') && l.includes(';'));
  const out = [];
  for (const l of lines) {
    const p = l.replace(/\s+/g, '').split(';');
    if (p.length < 8) continue;
    const n = p.slice(1, 8).map(Number); if (n.some(x => !Number.isFinite(x))) continue;
    out.push({ x: n[0], y: n[1], z: n[2], rot: n.slice(3, 7), raw: l });
  }
  return out;
}
const placement = c => `(${c.x}, ${c.y}, ${c.z}) (${c.rot[0]}; ${c.rot[1]}, ${c.rot[2]}, ${c.rot[3]})`;
function teleport(text, cam) {
  const truck = current(text).truck; if (!truck) throw new Error('Aucun camion attribué à ton chauffeur.');
  const changes = [];
  for (const pv of playerVehicleUnits(text)) {
    if (get(pv.body, 'vehicle') !== truck || !has(pv.body, 'stored_vehicle_placement')) continue;
    let b = set(pv.body, 'stored_vehicle_placement', placement(cam));
    const tp = arr(b, 'stored_trailer_placements');
    if (tp.length) { b = setArr(b, 'stored_trailer_placements', tp.map(() => placement(cam))); if (has(b, 'stored_trailer_attached')) b = set(b, 'stored_trailer_attached', 'true'); }
    changes.push({ ...pv, body: b });
  }
  if (!changes.length) throw new Error('Position du camion introuvable dans cette sauvegarde (format trop ancien).');
  return { text: patch(text, changes) };
}

// ---------- Résumé pour l'interface
function overview(text) {
  const eco = firstUnit(text, 'economy');
  return {
    trucks: trucks(text), trailers: trailers(text), attached: currentTrailerInfo(text),
    garages: garagesSummary(text), cities: cities(text).length, parts: partsInfo(text),
    dealers: eco ? arr(eco.body, 'unlocked_dealers').length : 0,
    recruitments: eco ? arr(eco.body, 'unlocked_recruitments').length : 0
  };
}

// ---------- Application d'un lot de modifications (clés envoyées par l'interface)
const TOOL_KEYS = ['truckRepair', 'trailerRepair', 'truckFuel', 'truckKm', 'truckPlate', 'trailerPlate', 'playerTruck', 'playerTrailer',
  'cargoMass', 'trailerDefMass', 'unlockTrailer', 'garages', 'unlockDealers', 'unlockRecruitments', 'teleport', 'truckEngine', 'truckTransmission', 'removeBadge'];
function applyTools(text, e, report) {
  const tgt = v => (v === 'current' ? 'current' : 'all');
  if (e.playerTruck) { const r = setPlayerTruck(text, String(e.playerTruck)); text = r.text; report.push('camion changé (QG : ' + r.city + ')'); }
  if (e.playerTrailer) { text = setPlayerTrailer(text, String(e.playerTrailer)).text; report.push('remorque changée'); }
  if (e.truckRepair) { const r = repairTrucks(text, tgt(e.truckRepair)); text = r.text; report.push(`réparation de ${r.count} camion(s)`); }
  if (e.trailerRepair) { const r = repairTrailers(text, tgt(e.trailerRepair)); text = r.text; report.push(`réparation de ${r.count} remorque(s)`); }
  if (e.truckFuel) { const r = setFuel(text, tgt(e.truckFuel.target), e.truckFuel.level); text = r.text; report.push(`carburant de ${r.count} camion(s)`); }
  if (e.truckKm != null) { text = setTruckKm(text, e.truckKm).text; report.push('kilométrage'); }
  if (e.truckPlate) { text = setPlate(text, 'truck', e.truckPlate.text, e.truckPlate.color).text; report.push('plaque du camion'); }
  if (e.trailerPlate) { text = setPlate(text, 'trailer', e.trailerPlate.text, e.trailerPlate.color).text; report.push('plaque de la remorque'); }
  if (e.truckEngine) { text = setPart(text, 'engine', String(e.truckEngine)).text; report.push('moteur'); }
  if (e.truckTransmission) { text = setPart(text, 'transmission', String(e.truckTransmission)).text; report.push('boîte de vitesses'); }
  if (e.removeBadge) { text = removeBadge(text).text; report.push('badge retiré'); }
  if (e.cargoMass) { const r = setCargoMass(text, e.cargoMass.mass, e.cargoMass.slaves !== false, !!e.cargoMass.everywhere); text = r.text; report.push(`poids de la cargaison (${r.count} remorque(s))`); }
  if (e.trailerDefMass) { text = setTrailerDefMass(text, e.trailerDefMass.body, e.trailerDefMass.chassis).text; report.push('poids à vide de la remorque'); }
  if (e.unlockTrailer) { text = unlockTrailer(text).text; report.push('remorque autorisée partout'); }
  if (e.garages) { const r = buyGarages(text, e.garages); text = r.text; report.push(`${r.count} garage(s) acheté(s) ou agrandi(s)`); }
  if (e.unlockDealers) { const r = unlockList(text, 'unlocked_dealers'); text = r.text; report.push('concessionnaires débloqués'); }
  if (e.unlockRecruitments) { const r = unlockList(text, 'unlocked_recruitments'); text = r.text; report.push('agences de recrutement débloquées'); }
  if (e.teleport) { text = teleport(text, e.teleport).text; report.push('téléportation'); }
  return text;
}

module.exports = {
  TOOL_KEYS, GARAGE_SIZES, applyTools, overview, parseCams,
  current, trucks, trailers, currentTrailerInfo, cities, garagesSummary,
  repairTrucks, repairTrailers, setFuel, setTruckKm, setPlate, setPlayerTruck, setPlayerTrailer,
  setCargoMass, setTrailerDefMass, partsInfo, setPart, removeBadge, unlockTrailer, buyGarages, unlockList, teleport,
  _internal: { unit, units, get, arr, setArr, num, decStr, encStr, plateValue }
};
