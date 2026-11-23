// Autocar (DLC Coaches d'ETS2) : reconnaissance du véhicule et lecture de la mission bus_job.
//
// Le SDK 1.16 de SCS déclare la configuration « bus_job » mais n'en documente pas encore les
// attributs. Les noms sont donc cherchés de façon tolérante (plusieurs variantes possibles), et
// une information introuvable reste vide : rien n'est inventé. La page HUD affiche la liste brute
// des champs reçus pour vérifier ou compléter ces correspondances.

// Modèles de cars connus (DLC Coaches et mods courants). « id » ressemble à « vehicle.marque.modele ».
const COACH_WORDS = /(^|[^a-z0-9])(bus|coach|coaches|autocar|autobus|touring|tourismo|travego|intouro|citaro|setra|neoplan|irizar|cityliner|skyliner|tourliner|interliner|crossway|evadys|lion'?s|lions?_?coach|9700(dd)?|9900|8900|7900|futura|marcopolo|temsa|otokar|van_hool|vanhool|s5\d\d)([^a-z0-9]|$)/i;

const valid = v => typeof v === 'number' && Number.isFinite(v);
const text = v => (typeof v === 'string' && v.trim()) ? v.trim() : null;

// Valeur d'un attribut, indexé ({"0": …, "1": …}) ou simple.
function at(value, index) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (index == null) return null;
    return value[String(index)] ?? value[index] ?? null;
  }
  return index == null || index === 0 ? value ?? null : null;
}
function lastIndex(value) {
  if (!value || typeof value !== 'object') return 0;
  const keys = Object.keys(value).map(Number).filter(Number.isInteger);
  return keys.length ? Math.max(...keys) : 0;
}
// Premier attribut dont le nom correspond à l'un des motifs (dans l'ordre des motifs).
function pick(attrs, patterns) {
  if (!attrs) return null;
  const names = Object.keys(attrs);
  for (const p of patterns) {
    const name = typeof p === 'string' ? names.find(n => n === p) : names.find(n => p.test(n));
    if (name) return { name, value: attrs[name] };
  }
  return null;
}
function num(found, index) {
  if (!found) return null;
  const v = at(found.value, index);
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return valid(n) ? n : null;
}

/** Le véhicule conduit est-il un car ? (modèle reconnu, ou déjà vu pendant un service car) */
function isCoachVehicle(truck, known = []) {
  if (!truck || typeof truck !== 'object') return false;
  const id = text(truck.id);
  if (id && known.includes(id)) return true;
  const label = [truck.id, truck.brand_id, truck.name].filter(v => typeof v === 'string').join(' ');
  if (COACH_WORDS.test(label.replace(/\./g, ' '))) return true;
  return Object.keys(truck).some(k => /passeng|seats?(\.|$)/i.test(k));
}

/** Lecture d'une configuration bus_job. Renvoie null s'il n'y a pas de service car. */
function parseBusJob(attrs) {
  if (!attrs || typeof attrs !== 'object' || !Object.keys(attrs).length) return null;
  const destName = pick(attrs, ['destination_stop.name', /^destination_stop\.(name|city)$/, /^(stop|stops)\.name$/, /dest.*stop.*name/]);
  const srcName = pick(attrs, ['source_stop.name', /^source_stop\.(name|city)$/, /source.*stop.*name/]);
  const countAttr = pick(attrs, ['bus.stages.count', /stages?\.count$/, /stops?\.count$/]);
  const count = num(countAttr) ?? (destName ? lastIndex(destName.value) + 1 : null);
  if (!count && !destName) return null;
  const last = Math.max(0, (count || 1) - 1);
  const current = Math.max(0, Math.min(last, num(pick(attrs, ['bus.stages.current', /stages?\.current$/, /stops?\.current$/, /current.*(stage|stop)/])) ?? 0));
  const stop = (found, i) => found ? text(at(found.value, i)) : null;
  const stopId = (name, i) => stop(pick(attrs, [name]), i);

  // Ligne : numéro et nom / terminus, si le jeu les fournit.
  const lineNo = pick(attrs, [/^(bus\.)?line(\.|_)(number|no|num|code|short)/, /^(bus\.)?route(\.|_)(number|no|num|code)/, /^(bus\.)?line(\.|_)id$/, /^(bus\.)?line$/]);
  const lineName = pick(attrs, [/^(bus\.)?line(\.|_)(name|title|destination|terminus)/, /^(bus\.)?route(\.|_)(name|title)/, /terminus/]);
  // Passagers : à bord / capacité.
  const onBoard = pick(attrs, [/passengers?(\.|_)(count|current|on_?board|inside|now)$/, /^passengers?$/, /on_?board/]);
  const capacity = pick(attrs, [/passengers?(\.|_)(capacity|max|limit|seats)$/, /seats?(\.|_)(count|total)?$/, /capacity$/]);
  // Horaire : heure prévue à l'arrêt suivant (minutes de jeu), sinon fin de service.
  const stopTime = pick(attrs, [/destination_stop\.(arrival|planned|scheduled|time)/, /(arrival|schedule|planned).*time/, /^stops?\.time$/]);
  const endTime = pick(attrs, ['delivery.time', /delivery\.time$/, /deadline/]);
  const schedule = num(stopTime, current) ?? num(stopTime) ?? num(endTime);

  // Satisfaction / confort des voyageurs : nom non documenté, lu seulement si le jeu l’envoie.
  const satisfaction = pick(attrs, [/satisf/, /comfort/, /happiness/, /(passengers?|bus)\.(rating|mood)$/, /^rating$/]);
  const used = [destName, srcName, countAttr, lineNo, lineName, onBoard, capacity, stopTime, endTime, satisfaction].filter(Boolean).map(f => f.name);
  return {
    id: text(attrs.bus_job_id) || text(attrs['bus_job.id']) || null,
    market: text(attrs['bus_job.market']) || null,
    stageCount: count || 1, stageCurrent: current,
    from: stop(srcName, 0), to: stop(destName, last), nextStop: stop(destName, current),
    fromId: stopId('source_stop.id', 0), toId: stopId('destination_stop.id', last),
    lineNumber: lineNo ? text(String(at(lineNo.value, 0) ?? '')) : null,
    lineName: lineName ? text(String(at(lineName.value, 0) ?? '')) : null,
    passengers: num(onBoard, current) ?? num(onBoard),
    capacity: num(capacity),
    satisfaction: num(satisfaction, current) ?? num(satisfaction),
    scheduleGameMinutes: schedule,
    income: num(pick(attrs, ['income'])) || 0,
    planned: num(pick(attrs, ['planned_distance.km'])) || 0,
    used
  };
}

// Températures : aucune n'existe dans le SDK 1.16 ; affichées seulement si le jeu en envoie un jour.
function temperature(sources, kind) {
  const re = kind === 'outside' ? /temp.*(out|ext|ambient|air)|(out|ext|ambient|air).*temp/i : /temp.*(cabin|cab|inside|interior)|(cabin|interior).*temp/i;
  for (const s of sources) {
    const f = s && pick(s, [re]);
    const v = num(f);
    if (v != null) return v;
  }
  return null;
}

/**
 * Données prêtes à afficher pour le bandeau car.
 * live : dernier état du plugin ; job : mission en cours suivie par l'appli ; extra : horloge et distance.
 */
function describeCoach(live, job, extra = {}) {
  if (!live) return null;
  const bus = parseBusJob(live.busJob);
  const truck = live.truck || {};
  const capacityTruck = num(pick(truck, [/passengers?(\.|_)(capacity|max|seats)/, /seats?(\.|_)?(count)?$/]));
  const fuelCap = num(pick(truck, ['fuel.capacity']));
  const eta = valid(live.gameTime) && valid(live.navTime) && (live.navTime > 0 || live.navDistance > 0) ? live.gameTime + live.navTime / 60 : null;
  const schedule = bus && bus.scheduleGameMinutes;
  return {
    inService: !!bus,
    lineNumber: bus && bus.lineNumber,
    lineName: bus && (bus.lineName || bus.to),
    nextStop: bus && bus.nextStop,
    stage: bus ? { current: bus.stageCurrent + 1, count: bus.stageCount } : null,
    // Avance (+) ou retard (−) prévu à l'arrivée, en minutes de jeu.
    scheduleMarginMinutes: valid(schedule) && eta != null ? Math.round(schedule - eta) : null,
    passengers: bus && bus.passengers,
    capacity: (bus && bus.capacity) ?? capacityTruck,
    // 0..1 ou 0..100 selon le jeu : ramené en pourcentage
    satisfactionPct: bus && valid(bus.satisfaction) ? Math.max(0, Math.min(100, bus.satisfaction <= 1 ? bus.satisfaction * 100 : bus.satisfaction)) : null,
    outsideTemp: temperature([live.busJob, live, truck], 'outside'),
    cabinTemp: temperature([live.busJob, live, truck], 'cabin'),
    fuelPct: valid(live.fuel) && fuelCap > 0 ? Math.max(0, Math.min(100, live.fuel / fuelCap * 100)) : null,
    distanceKm: job && valid(job.distance) ? job.distance : valid(extra.boardedKm) ? extra.boardedKm : null,
    clockSeconds: valid(extra.clockSeconds) ? extra.clockSeconds : null,
    mandatoryBreak: valid(live.mandatoryBreak) ? live.mandatoryBreak : null
  };
}

/** Liste lisible des champs reçus, pour le diagnostic (noms + valeurs, tronqués). */
function fieldList(attrs) {
  if (!attrs || typeof attrs !== 'object') return [];
  return Object.keys(attrs).sort().map(name => {
    const v = attrs[name];
    const shown = v && typeof v === 'object' ? Object.entries(v).slice(0, 6).map(([i, x]) => `${i}: ${x}`).join(' · ') + (Object.keys(v).length > 6 ? ' …' : '') : String(v);
    return { name, value: shown.length > 120 ? shown.slice(0, 117) + '…' : shown };
  });
}

module.exports = { isCoachVehicle, parseBusJob, describeCoach, fieldList, COACH_WORDS };
