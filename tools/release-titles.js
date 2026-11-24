// Renomme les Releases GitHub avec le numéro affiché dans l'appli (ex. v0.13.35 → « 0.12.0.5 »,
// v0.13.36-beta.1 → « 0.12.0.5 bêta 1 »). electron-builder ne sait mettre que le numéro technique.
// Releases regroupées sous un même numéro : la plus récente porte le nom seul.
// Lancé par la CI après chaque publication ; repasse sur toutes les Releases, anciennes comprises.
// Usage : node tools/release-titles.js [--dry-run]   (nécessite gh et GH_TOKEN)
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadVersionAffichee() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'app', 'data', 'notes-version.js'), 'utf8'), ctx);
  return ctx.window.versionAffichee;
}

function titleFor(tag, va) {
  const v = String(tag || '').replace(/^v/, '');
  const shown = va(v);
  return shown && shown !== v ? shown : null;
}

function main() {
  const dry = process.argv.includes('--dry-run');
  const repo = process.env.GH_REPO || process.env.GITHUB_REPOSITORY;
  if (!repo) throw new Error('GH_REPO manquant (propriétaire/dépôt)');
  const va = loadVersionAffichee();
  const gh = (args) => execFileSync('gh', args, { encoding: 'utf8' });
  const list = JSON.parse(gh(['api', `repos/${repo}/releases?per_page=100`]));
  // Plusieurs Releases techniques peuvent porter le même numéro affiché (versions regroupées) :
  // la plus récente garde le nom seul, les autres le précisent avec leur numéro technique.
  const seen = new Set();
  for (const r of list) {
    const shown = titleFor(r.tag_name, va);
    if (!shown) continue;
    const want = seen.has(shown) ? `${shown} (mise à jour ${r.tag_name})` : shown;
    seen.add(shown);
    if (r.name === want) continue;
    console.log(`${r.tag_name} : « ${r.name} » → « ${want} »`);
    if (!dry) gh(['api', '-X', 'PATCH', `repos/${repo}/releases/${r.id}`, '-f', `name=${want}`]);
  }
}

if (require.main === module) main();
module.exports = { titleFor, loadVersionAffichee };
