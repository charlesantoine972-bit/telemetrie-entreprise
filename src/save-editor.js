// Lecture et modification des sauvegardes ETS2 / ATS (Atelier).
// Déchiffrement : outil « decrypt_truck » (DecryptTruck, licence MIT, https://github.com/CoffeSiberian/DecryptTruck).
// Les fichiers modifiés sont réécrits en texte clair (format accepté par le jeu, comme avec g_save_format 2).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, execFile } = require('child_process');

const TRUCK_SKILLS = [
  { key: 'adr', label: 'ADR (matières dangereuses)', max: 63, adr: true },
  { key: 'long_dist', label: 'Longue distance', max: 6 },
  { key: 'heavy', label: 'Cargaisons lourdes', max: 6 },
  { key: 'fragile', label: 'Cargaisons fragiles', max: 6 },
  { key: 'urgent', label: 'Livraisons urgentes', max: 6 },
  { key: 'mechanical', label: 'Éco-conduite', max: 6 }
];
// Compétences du DLC Coaches : 3 rangs chacune
const COACH_SKILLS = [
  { key: 'long_duty', label: 'Longues tournées', max: 3 },
  { key: 'tight_schedule', label: 'Horaires serrés', max: 3 },
  { key: 'satisfaction_increase', label: 'Favori des passagers', max: 3 },
  { key: 'satisfaction_decrease', label: 'Passagers patients', max: 3 },
  { key: 'low_acceleration', label: 'Conduite en douceur', max: 3 },
  { key: 'ecodriving', label: 'Éco-conduite (car)', max: 3 }
];

class SaveEditor {
  constructor(decryptExe) { this.exe = decryptExe; }

  available() { return !!this.exe && fs.existsSync(this.exe); }

  // Renvoie le texte clair d'un fichier .sii (chiffré, binaire ou déjà en texte)
  read(file) {
    const head = Buffer.alloc(8); const fd = fs.openSync(file, 'r'); fs.readSync(fd, head, 0, 8, 0); fs.closeSync(fd);
    if (head.toString('latin1', 0, 8) === 'SiiNunit') return fs.readFileSync(file, 'utf8');
    if (!this.available()) throw new Error('Outil de déchiffrement introuvable.');
    const tmp = path.join(os.tmpdir(), `tch-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.sii`);
    try {
      execFileSync(this.exe, [file, tmp], { windowsHide: true, timeout: 60000 });
      const txt = fs.readFileSync(tmp, 'utf8');
      if (!txt.startsWith('SiiNunit')) throw new Error('Déchiffrement impossible.');
      return txt;
    } finally { fs.rmSync(tmp, { force: true }); }
  }

  // Version asynchrone de read() : ne bloque pas l'appli pendant le déchiffrement (analyse de nombreux fichiers)
  readAsync(file) {
    return new Promise((resolve, reject) => {
      const head = Buffer.alloc(8); const fd = fs.openSync(file, 'r'); fs.readSync(fd, head, 0, 8, 0); fs.closeSync(fd);
      if (head.toString('latin1', 0, 8) === 'SiiNunit') return resolve(fs.readFileSync(file, 'utf8'));
      if (!this.available()) return reject(new Error('Outil de déchiffrement introuvable.'));
      const tmp = path.join(os.tmpdir(), `tch-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.sii`);
      execFile(this.exe, [file, tmp], { windowsHide: true, timeout: 60000 }, (err) => {
        try {
          if (err) throw new Error('Déchiffrement impossible.');
          const txt = fs.readFileSync(tmp, 'utf8');
          if (!txt.startsWith('SiiNunit')) throw new Error('Déchiffrement impossible.');
          resolve(txt);
        } catch (e) { reject(e); } finally { fs.rmSync(tmp, { force: true }); }
      });
    });
  }

  // ----------- analyse : la sauvegarde est-elle corrompue ?
  // Format d'après les premiers octets : texte clair, chiffré (ScsC) ou binaire (BSII)
  static format(head) {
    const s = head.toString('latin1', 0, 8);
    if (s === 'SiiNunit') return 'texte';
    if (s.startsWith('ScsC')) return 'chiffré';
    if (s.startsWith('BSII')) return 'binaire';
    return null;
  }
  // Vérifie la structure d'un texte SII : blocs bien ouverts et fermés, lignes lisibles, unités obligatoires présentes
  static checkText(text, required = []) {
    const issues = [];
    if (text.includes('\u0000')) issues.push('Le fichier contient des octets nuls (écriture interrompue).');
    const lines = text.replace(/\r/g, '').split('\n');
    let i = 0; while (i < lines.length && !lines[i].trim()) i++;
    if ((lines[i] || '').trim() !== 'SiiNunit') return { issues: ['En-tête « SiiNunit » absent.'], units: 0 };
    i++; while (i < lines.length && !lines[i].trim()) i++;
    if ((lines[i] || '').trim() !== '{') return { issues: ['Accolade d\'ouverture absente après l\'en-tête.'], units: 0 };
    let unit = null, closed = false, units = 0, bad = 0, firstBad = '';
    const ids = new Set(), types = new Set(); let dup = 0;
    for (i = i + 1; i < lines.length; i++) {
      const l = lines[i].trimEnd();
      if (!l.trim()) continue;
      if (closed) { issues.push('Du contenu se trouve après la fin du fichier.'); break; }
      if (l.trim() === '}') { if (unit) unit = null; else closed = true; continue; }
      const h = l.match(/^([a-z0-9_]+)\s*:\s*([^\s{]+)\s*\{$/i);
      if (h) {
        if (unit) { issues.push(`Bloc « ${unit} » jamais refermé.`); }
        unit = h[1]; units++; types.add(h[1]);
        if (ids.has(h[2])) dup++; else ids.add(h[2]);
        continue;
      }
      if (unit && /^\s+[A-Za-z0-9_]+(\[\d*\])?\s*:/.test(l)) continue;
      bad++; if (!firstBad) firstBad = `ligne ${i + 1}`;
    }
    if (unit) issues.push(`Le fichier s'arrête au milieu du bloc « ${unit} » (fichier tronqué).`);
    else if (!closed) issues.push('Accolade de fin absente (fichier tronqué).');
    if (bad) issues.push(`${bad} ligne(s) illisible(s) (première : ${firstBad}).`);
    if (dup) issues.push(`${dup} identifiant(s) de bloc en double.`);
    for (const r of required) if (!types.has(r)) issues.push(`Bloc obligatoire « ${r} » absent.`);
    return { issues, units };
  }
  // Analyse un fichier .sii : { status: 'ok' | 'warn' | 'bad', format, size, issues, notes }
  async checkFile(file, required = [], optional = false) {
    const res = { file: path.basename(file), status: 'ok', format: null, size: 0, issues: [], notes: [] };
    let st; try { st = fs.statSync(file); } catch {
      res.status = optional ? 'warn' : 'bad'; res.issues.push('Fichier absent.'); return res;
    }
    res.size = st.size;
    if (!st.size) { res.status = 'bad'; res.issues.push('Fichier vide (0 octet).'); return res; }
    const n = Math.min(st.size, 4096), head = Buffer.alloc(n);
    const fd = fs.openSync(file, 'r'); fs.readSync(fd, head, 0, n, 0); fs.closeSync(fd);
    if (head.every(b => b === 0)) { res.status = 'bad'; res.issues.push('Fichier rempli de zéros (coupure pendant l\'enregistrement).'); return res; }
    res.format = SaveEditor.format(head);
    if (!res.format) { res.status = 'bad'; res.issues.push('Format inconnu : ce n\'est pas un fichier de sauvegarde lisible.'); return res; }
    if (res.format !== 'texte' && !this.available()) { res.status = 'warn'; res.notes.push('Contenu non vérifié : outil de déchiffrement absent.'); return res; }
    let text; try { text = await this.readAsync(file); } catch (e) { res.status = 'bad'; res.issues.push('Impossible de lire le contenu : ' + e.message); return res; }
    const c = SaveEditor.checkText(text, required);
    res.units = c.units; res.issues.push(...c.issues);
    if (c.issues.length) res.status = 'bad';
    return res;
  }
  // Analyse un créneau de sauvegarde (game.sii + info.sii)
  async analyzeSlot(slotDir) {
    const game = await this.checkFile(path.join(slotDir, 'game.sii'), ['economy', 'bank', 'player']);
    const info = await this.checkFile(path.join(slotDir, 'info.sii'), [], true);
    if (info.status === 'bad') info.status = 'warn'; // le jeu reconstruit info.sii ; seul game.sii est vital
    const status = game.status === 'bad' ? 'bad' : (game.status === 'warn' || info.status === 'warn') ? 'warn' : 'ok';
    return { status, files: [game, info] };
  }

  // ----------- outils sur le texte SII
  static block(text, re) {
    const m = re.exec(text); if (!m) return null;
    const start = m.index, end = text.indexOf('\n}', start);
    return { start, end, body: text.slice(start, end) };
  }
  static unitBlocks(text, type) {
    const out = []; const re = new RegExp(`^${type} : [^\\n]*\\{`, 'gm'); let m;
    while ((m = re.exec(text))) { const end = text.indexOf('\n}', m.index); out.push({ start: m.index, end }); }
    return out;
  }
  static get(body, key) { const m = body.match(new RegExp(`^ ${key}: (.*)$`, 'm')); return m ? m[1].trim() : null; }
  static set(body, key, value) { return body.replace(new RegExp(`^( ${key}: ).*$`, 'm'), `$1${value}`); }
  static getArray(body, key) {
    const out = []; const re = new RegExp(`^ ${key}\\[(\\d+)\\]: (.*)$`, 'gm'); let m;
    while ((m = re.exec(body))) out[+m[1]] = m[2].trim();
    return out;
  }
  static setArray(body, key, arr) {
    body = body.replace(new RegExp(`^ ${key}\\[\\d+\\]: .*\\n`, 'gm'), '');
    return body.replace(new RegExp(`^ ${key}: \\d+$`, 'm'), ` ${key}: ${arr.length}` + arr.map((v, i) => `\n ${key}[${i}]: ${v}`).join(''));
  }
  static replaceBlock(text, b, newBody) { return text.slice(0, b.start) + newBody + text.slice(b.end); }
  // Chaînes SII : caractères non ASCII écrits en \xHH (octets UTF-8)
  static decStr(v) {
    if (v == null) return '';
    v = v.trim().replace(/^"|"$/g, '');
    const bytes = []; for (let i = 0; i < v.length; i++) {
      if (v[i] === '\\' && v[i + 1] === 'x') { bytes.push(parseInt(v.substr(i + 2, 2), 16)); i += 3; }
      else if (v[i] === '\\' && v[i + 1] === '"') { bytes.push(34); i += 1; }
      else for (const b of Buffer.from(v[i], 'utf8')) bytes.push(b);
    }
    return Buffer.from(bytes).toString('utf8');
  }
  static encStr(t) {
    let out = ''; for (const b of Buffer.from(String(t), 'utf8')) out += (b < 0x20 || b > 0x7e || b === 34 || b === 92) ? '\\x' + b.toString(16).padStart(2, '0') : String.fromCharCode(b);
    return '"' + out + '"';
  }
  static checkName(t, label) {
    t = String(t || '').trim();
    if (!t) throw new Error(label + ' ne peut pas être vide.');
    if (t.length > 30) throw new Error(label + ' : 30 caractères maximum.');
    if (/[\u0000-\u001f]/.test(t)) throw new Error(label + ' contient des caractères interdits.');
    return t;
  }
  profileNames(profileDir) {
    const t = this.read(path.join(profileDir, 'profile.sii'));
    return { profileName: SaveEditor.decStr(SaveEditor.get(t, 'profile_name')), companyName: SaveEditor.decStr(SaveEditor.get(t, 'company_name')) };
  }
  static float(v) {
    if (v == null) return 0;
    if (v.startsWith('&')) { const b = Buffer.alloc(4); b.writeUInt32BE(parseInt(v.slice(1), 16)); return b.readFloatBE(0); }
    return parseFloat(v) || 0;
  }

  // ----------- créneaux de sauvegarde d'un profil
  slots(profileDir) {
    const saveDir = path.join(profileDir, 'save');
    let dirs = []; try { dirs = fs.readdirSync(saveDir, { withFileTypes: true }).filter(d => d.isDirectory()); } catch { return []; }
    return dirs.filter(d => d.name !== 'multiplayer_backup' && fs.existsSync(path.join(saveDir, d.name, 'game.sii')))
      .map(d => {
        const dir = path.join(saveDir, d.name); let name = '';
        try { const info = this.read(path.join(dir, 'info.sii')); name = (SaveEditor.get(info, 'name') || '').replace(/^"|"$/g, ''); } catch {}
        const label = d.name === 'autosave' ? 'Sauvegarde automatique' : d.name === 'quicksave' ? 'Sauvegarde rapide'
          : /^autosave_drive/.test(d.name) ? 'Auto (conduite)' : /^autosave_job/.test(d.name) ? 'Auto (mission)' : (name || 'Sauvegarde ' + d.name);
        return { slot: d.name, label, name, modified: fs.statSync(path.join(dir, 'game.sii')).mtimeMs };
      }).sort((a, b) => b.modified - a.modified);
  }

  static cities(text) {
    const eco = SaveEditor.block(text, /^economy : /m).body;
    const set = new Set();
    for (const c of SaveEditor.getArray(eco, 'companies')) { const p = String(c).split('.'); if (p.length >= 4) set.add(p[p.length - 1]); }
    for (const g of SaveEditor.getArray(eco, 'garages')) { const p = String(g).split('.'); if (p.length >= 2) set.add(p[p.length - 1]); }
    return [...set].sort();
  }

  // ----------- lecture (résumé pour l'interface)
  summary(slotDir) {
    const text = this.read(path.join(slotDir, 'game.sii'));
    const eco = SaveEditor.block(text, /^economy : /m).body;
    const bank = SaveEditor.block(text, /^bank : /m).body;
    const player = SaveEditor.block(text, /^player : /m).body;
    const busStops = SaveEditor.unitBlocks(text, 'bus_stop');
    const discovered = busStops.filter(b => /^ discovered: true$/m.test(text.slice(b.start, b.end))).length;
    const wear = [];
    for (const t of ['vehicle', 'trailer']) for (const b of SaveEditor.unitBlocks(text, t)) {
      const body = text.slice(b.start, b.end);
      for (const k of ['engine_wear', 'transmission_wear', 'cabin_wear', 'chassis_wear', 'trailer_body_wear']) { const v = SaveEditor.get(body, k); if (v != null) wear.push(SaveEditor.float(v)); }
    }
    const vehicles = SaveEditor.unitBlocks(text, 'vehicle').map(b => text.slice(b.start, b.end));
    const fuel = vehicles.map(v => SaveEditor.float(SaveEditor.get(v, 'fuel_relative')));
    let names = { profileName: '', companyName: '' };
    try { names = this.profileNames(path.join(slotDir, '..', '..')); } catch {}
    return {
      ...names,
      money: Number(SaveEditor.get(bank, 'money_account')) || 0,
      xp: Number(SaveEditor.get(eco, 'experience_points')) || 0,
      busXp: SaveEditor.get(eco, 'bus_experience_points') == null ? null : Number(SaveEditor.get(eco, 'bus_experience_points')),
      skills: Object.fromEntries(TRUCK_SKILLS.map(s => [s.key, Number(SaveEditor.get(eco, s.key)) || 0])),
      coachSkills: SaveEditor.get(eco, 'long_duty') == null ? null : Object.fromEntries(COACH_SKILLS.map(s => [s.key, Number(SaveEditor.get(eco, s.key)) || 0])),
      visitedCities: Number(SaveEditor.get(eco, 'visited_cities')) || 0,
      totalCities: SaveEditor.cities(text).length,
      dealers: Number(SaveEditor.get(eco, 'unlocked_dealers')) || 0,
      recruitments: Number(SaveEditor.get(eco, 'unlocked_recruitments')) || 0,
      hqCity: SaveEditor.get(player, 'hq_city'),
      busStops: busStops.length, busStopsDiscovered: discovered,
      buses: Number(SaveEditor.get(player, 'buses')) || 0,
      vehicles: vehicles.length, trailers: SaveEditor.unitBlocks(text, 'trailer').length,
      wearAvg: wear.length ? wear.reduce((a, b) => a + b, 0) / wear.length : 0,
      fuelAvg: fuel.length ? fuel.reduce((a, b) => a + b, 0) / fuel.length : 0
    };
  }

  // ----------- modifications
  static applyToText(text, e) {
    let eco = SaveEditor.block(text, /^economy : /m);
    let body = eco.body;
    const report = [];
    if (e.xp != null) { body = SaveEditor.set(body, 'experience_points', Math.max(0, Math.round(e.xp))); report.push('XP camion'); }
    if (e.busXp != null && SaveEditor.get(body, 'bus_experience_points') != null) { body = SaveEditor.set(body, 'bus_experience_points', Math.max(0, Math.round(e.busXp))); report.push('XP car'); }
    if (e.skills) for (const s of TRUCK_SKILLS) if (e.skills[s.key] != null) body = SaveEditor.set(body, s.key, Math.min(s.max, Math.max(0, e.skills[s.key] | 0)));
    if (e.skills) report.push('compétences camion');
    if (e.coachSkills && SaveEditor.get(body, 'long_duty') != null) {
      for (const s of COACH_SKILLS) if (e.coachSkills[s.key] != null && SaveEditor.get(body, s.key) != null) body = SaveEditor.set(body, s.key, Math.min(s.max, Math.max(0, e.coachSkills[s.key] | 0)));
      report.push('compétences car');
    }
    if (e.visitAllCities) {
      const all = SaveEditor.cities(text);
      const cur = SaveEditor.getArray(body, 'visited_cities'), cnt = SaveEditor.getArray(body, 'visited_cities_count');
      const counts = new Map(cur.map((c, i) => [c, cnt[i] || '1']));
      for (const c of all) if (!counts.has(c)) counts.set(c, '1');
      body = SaveEditor.setArray(body, 'visited_cities', [...counts.keys()]);
      body = SaveEditor.setArray(body, 'visited_cities_count', [...counts.values()]);
      report.push('villes visitées');
    }
    text = SaveEditor.replaceBlock(text, eco, body);
    if (e.money != null) {
      const b = SaveEditor.block(text, /^bank : /m);
      text = SaveEditor.replaceBlock(text, b, SaveEditor.set(b.body, 'money_account', Math.max(0, Math.round(e.money))));
      report.push('argent');
    }
    if (e.discoverBusStops) {
      text = text.replace(/^(bus_stop : [^\n]*\{\n discovered: )false$/gm, '$1true');
      report.push('arrêts de bus');
    }
    if (e.repairAll || e.refuelAll) {
      for (const t of ['vehicle', 'trailer']) {
        const blocks = SaveEditor.unitBlocks(text, t).reverse();
        for (const b of blocks) {
          let u = text.slice(b.start, b.end);
          if (e.repairAll) {
            u = u.replace(/^( (?:engine|transmission|cabin|chassis|trailer_body)_wear(?:_unfixable)?: ).*$/gm, '$10');
            u = u.replace(/^( wheels_wear(?:_unfixable)?\[\d+\]: ).*$/gm, '$10');
            u = u.replace(/^( cargo_damage: ).*$/gm, '$10');
          }
          if (e.refuelAll && t === 'vehicle') u = u.replace(/^( fuel_relative: ).*$/m, '$11');
          text = text.slice(0, b.start) + u + text.slice(b.end);
        }
      }
      if (e.repairAll) report.push('réparation');
      if (e.refuelAll) report.push('plein de carburant');
    }
    return { text, report };
  }

  apply(profileDir, slot, edits) {
    if (!/^[A-Za-z0-9_-]+$/.test(slot) || slot === 'multiplayer_backup') throw new Error('Sauvegarde non modifiable.');
    const dir = path.join(profileDir, 'save', slot);
    const gameFile = path.join(dir, 'game.sii');
    const { text, report } = SaveEditor.applyToText(this.read(gameFile), edits);
    if (!text.startsWith('SiiNunit') || !text.trimEnd().endsWith('}')) throw new Error('Résultat invalide, rien n\'a été écrit.');
    // Résumés affichés par le jeu (écran de chargement, choix du profil)
    const eco = SaveEditor.block(text, /^economy : /m).body;
    const bank = SaveEditor.block(text, /^bank : /m).body;
    const xp = Number(SaveEditor.get(eco, 'experience_points')) || 0, busXp = Number(SaveEditor.get(eco, 'bus_experience_points')) || 0;
    const money = SaveEditor.get(bank, 'money_account'), visited = SaveEditor.get(eco, 'visited_cities');
    let info = null, profile = null;
    try {
      info = this.read(path.join(dir, 'info.sii'));
      info = SaveEditor.set(SaveEditor.set(SaveEditor.set(info, 'info_players_experience', xp + busXp), 'info_money_account', money), 'info_visited_cities', visited);
    } catch { info = null; }
    try { profile = SaveEditor.set(this.read(path.join(profileDir, 'profile.sii')), 'cached_experience', xp); } catch { profile = null; }
    if (edits.profileName != null || edits.companyName != null) {
      if (!profile) throw new Error('Fichier du profil illisible, rien n\'a été écrit.');
      if (edits.profileName != null) { profile = SaveEditor.set(profile, 'profile_name', SaveEditor.encStr(SaveEditor.checkName(edits.profileName, 'Le nom du profil'))); report.push('nom du profil'); }
      if (edits.companyName != null) { profile = SaveEditor.set(profile, 'company_name', SaveEditor.encStr(SaveEditor.checkName(edits.companyName, 'Le nom de l\'entreprise'))); report.push('nom de l\'entreprise'); }
    }
    fs.writeFileSync(gameFile, text);
    if (info) fs.writeFileSync(path.join(dir, 'info.sii'), info);
    if (profile) fs.writeFileSync(path.join(profileDir, 'profile.sii'), profile);
    return report;
  }
}

module.exports = { SaveEditor, TRUCK_SKILLS, COACH_SKILLS };
