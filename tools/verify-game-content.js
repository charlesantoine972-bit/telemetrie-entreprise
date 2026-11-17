// Diagnostic indépendant d'Electron, sans installation de plugin ni écriture dans le jeu.
const path = require('path');
const os = require('os');
require('../src/game-content').scan(process.argv[2] || path.join(os.homedir(), 'Documents'), process.argv.slice(3))
  .then(result => console.log(JSON.stringify(result, null, 2)))
  .catch(e => { console.error(e.message); process.exitCode = 1; });
