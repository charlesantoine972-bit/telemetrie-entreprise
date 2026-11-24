// TCH Map — programme de carte, lancé en arrière-plan par Truck & Coach Hub.
//
// Copyright (C) 2026 Truck & Coach Hub — TCH Map
// Ce programme est un logiciel libre : GNU General Public License v3 ou ultérieure (voir LICENSE).
//
// Rôle : servir la carte (page MapLibre + données) sur ce PC uniquement, et lui transmettre en direct les
// messages reçus de l'application hôte (position du camion, trace, villes, thème).
//
// Sécurité :
//   - écoute seulement 127.0.0.1, sur un port choisi au hasard ;
//   - toutes les adresses commencent par un jeton secret aléatoire (sinon : 404) ;
//   - ne sert que les fichiers de viewer/ et du dossier de données, jamais au-delà (chemins vérifiés).
//
// Communication avec l'hôte (voir PROTOCOLE.md) : messages JSON simples, par le canal du processus
// (Electron utilityProcess : process.parentPort ; Node : process.send / 'message').
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const VIEWER = path.join(__dirname, 'viewer');
const DATA = process.argv[2] ? path.resolve(process.argv[2]) : null;   // cartes générées depuis le jeu (plus tard)
const TOKEN = crypto.randomBytes(24).toString('hex');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.geojson': 'application/geo+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.pmtiles': 'application/octet-stream', '.txt': 'text/plain; charset=utf-8' };
const CSP = "default-src 'self'; script-src 'self'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; base-uri 'none'; form-action 'none'";

// Derniers messages reçus de l'hôte, rejoués à chaque nouvel affichage
const last = {};
const clients = new Set();
const KINDS = ['config', 'theme', 'cities', 'trail', 'state'];

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': CSP });
  res.end(body);
}

// Fichier sous `root` uniquement (pas de « .. », pas de lien vers l'extérieur)
function serveFile(res, root, rel) {
  if (!root) return send(res, 404, 'Introuvable');
  let file;
  try { file = path.resolve(root, '.' + path.posix.normalize('/' + decodeURIComponent(rel))); } catch { return send(res, 400, 'Adresse invalide'); }
  if (file !== root && !file.startsWith(root + path.sep)) return send(res, 403, 'Interdit');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Introuvable');
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Content-Length': st.size, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': CSP });
    fs.createReadStream(file).pipe(res);
  });
}

function broadcast(kind, data) {
  const line = `event: ${kind}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of clients) c.write(line);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET') return send(res, 405, 'Méthode non autorisée');
  const u = new URL(req.url, 'http://127.0.0.1');
  const parts = u.pathname.split('/');            // ['', jeton, ...]
  if (parts[1] !== TOKEN) return send(res, 404, 'Introuvable');
  const rest = parts.slice(2).join('/');
  if (rest === '' ) return serveFile(res, VIEWER, 'index.html');
  if (rest === 'events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', 'Connection': 'keep-alive', 'X-Content-Type-Options': 'nosniff' });
    res.write('retry: 2000\n\n');
    for (const k of KINDS) if (last[k]) res.write(`event: ${k}\ndata: ${JSON.stringify(last[k])}\n\n`);
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  if (rest.startsWith('data/')) return serveFile(res, DATA, rest.slice(5));
  return serveFile(res, VIEWER, rest);
});

// Messages de l'hôte : on ne garde que des objets simples des types attendus
function onMessage(msg) {
  const m = msg && msg.data !== undefined && msg.type === undefined ? msg.data : msg;
  if (!m || typeof m !== 'object' || !KINDS.includes(m.type)) return;
  last[m.type] = m;
  broadcast(m.type, m);
}
const parent = process.parentPort;                 // Electron utilityProcess
const toHost = (m) => { if (parent) parent.postMessage(m); else if (process.send) process.send(m); else console.log(JSON.stringify(m)); };
if (parent) parent.on('message', (e) => onMessage(e.data)); else process.on('message', onMessage);

// Les connexions restent ouvertes : un petit battement évite qu'elles soient coupées
setInterval(() => { for (const c of clients) c.write(': ping\n\n'); }, 20000).unref();

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  toHost({ type: 'ready', port, token: TOKEN, url: `http://127.0.0.1:${port}/${TOKEN}/` });
});
