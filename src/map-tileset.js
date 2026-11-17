const fs = require('fs');
const path = require('path');

function readTileset(game, directory) {
  if (!['ets2', 'ats'].includes(game)) throw new Error('Jeu de carte inconnu.');
  const root = path.resolve(directory);
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'TileMapInfo.json'), 'utf8'));
  const minZoom = Number(metadata.minZoom), maxZoom = Number(metadata.maxZoom);
  const info = {
    x1: Number(metadata.x1), x2: Number(metadata.x2),
    y1: Number(metadata.y1), y2: Number(metadata.y2),
    minZoom, maxZoom, tileSize: 256,
    version: metadata.game && metadata.game.version || metadata.version || 'générée localement',
    localGenerated: true
  };
  if (![info.x1, info.x2, info.y1, info.y2].every(Number.isFinite) ||
      info.x2 <= info.x1 || info.y2 <= info.y1 ||
      !Number.isInteger(minZoom) || !Number.isInteger(maxZoom) ||
      minZoom < 0 || minZoom > 10 || maxZoom < minZoom || maxZoom > 18) {
    throw new Error('Le fichier TileMapInfo.json est invalide ou incomplet.');
  }
  const firstTile = path.join(root, 'Tiles', String(minZoom), '0', '0.png');
  if (!fs.statSync(firstTile).isFile()) throw new Error('La première tuile est absente. Exporte les tuiles à partir du zoom minimum indiqué.');
  return { root, info };
}

module.exports = { readTileset };
