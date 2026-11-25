// Remplace les modules natifs de TruckSim Maps (require('bindings')) par du JavaScript pur.
// CityHash64 : ../../lecteur/cityhash.js. GDeflate : seulement utilisé pour les textures, que TCH Map ne lit pas.
const { city64 } = require('../../lecteur/cityhash.js');
module.exports = (name) => (name === 'cityhash' ? { city64: (s) => city64(s) } : { gdeflate() { return -1; } });
