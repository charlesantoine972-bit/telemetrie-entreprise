// TCH Map : ouvriers (worker_threads) qui décodent les secteurs de la carte en parallèle.
// Le même fichier compilé (extraire.cjs) sert de programme principal et d'ouvrier.
import os from 'os';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { parseSector } from '@maps/clis/parser/game-files/sector-parser';
import { ItemType } from '@truckermudgeon/map/constants';

export const estOuvrier = !isMainThread && !!(workerData && workerData.tchOuvrier);

// Combien d'ouvriers : un par cœur, moins deux (le jeu, Windows et le fil principal), au plus 8,
// et pas plus que ce que la mémoire libre permet (~400 Mo chacun, en gardant 1,5 Go de marge).
// TCH_OUVRIERS=0 : mode simple, tout sur le fil principal (secours si les ouvriers ne démarrent pas)
export function nombreOuvriers(): number {
  const brut = process.env.TCH_OUVRIERS;
  const env = Number(brut);
  if (brut != null && brut !== '' && env === 0) return 0;
  if (env > 0) return Math.min(32, Math.floor(env));
  const coeurs = typeof os.availableParallelism === 'function' ? os.availableParallelism() : os.cpus().length;
  const libreGo = os.freemem() / 2 ** 30;
  return Math.max(1, Math.min(coeurs - 2, 8, Math.floor((libreGo - 1.5) / 0.4)));
}

// ---------- Côté principal ----------
// Robuste : si un ouvrier plante (mémoire, démarrage impossible…), son travail est refait sur le fil principal.
// La lecture ne peut donc jamais rester bloquée.
export function creerOuvriers(modeles: string[], decoderIci: (ab: ArrayBuffer) => any) {
  let n = nombreOuvriers();
  const fichier = __filename;
  type O = { w: Worker | null; charge: number; attentes: Map<number, { ab: ArrayBuffer | null; ok: (r: any) => void; ko: (e: Error) => void }> };
  const ouvriers: O[] = [];
  let id = 0;
  const enAttente: (() => void)[] = [];
  const total = () => ouvriers.reduce((s, o) => s + o.charge, 0);
  const libere = () => { while (enAttente.length && total() < 2 * Math.max(1, vivants().length)) enAttente.shift()!(); };
  const vivants = () => ouvriers.filter(o => o.w);
  // Ouvrier en panne : on refait ici ce qui lui avait été confié
  const panne = (o: O, raison: string) => {
    if (!o.w) return;
    process.stderr.write(`[TCH Map] ouvrier arrêté (${raison}) : reprise sur le fil principal\n`);
    try { o.w.terminate(); } catch {}
    o.w = null;
    for (const [, a] of o.attentes) {
      try { a.ok(decoderIci(a.ab!)); } catch (e: any) { a.ko(e); }
    }
    o.attentes.clear(); o.charge = 0;
    libere();
  };
  for (let k = 0; k < n; k++) {
    let w: Worker;
    try { w = new Worker(fichier, { workerData: { tchOuvrier: true, modeles } }); } catch (e: any) { process.stderr.write(`[TCH Map] ouvrier impossible : ${e.message}\n`); break; }
    const o: O = { w, charge: 0, attentes: new Map() };
    w.on('message', (m: any) => {
      const a = o.attentes.get(m.id); if (!a) return;
      o.attentes.delete(m.id); o.charge--;
      if (m.erreur) a.ko(new Error(m.erreur)); else a.ok(m);
      libere();
    });
    w.on('error', (e) => panne(o, e && e.message || 'erreur'));
    w.on('exit', (c) => { if (o.w) panne(o, 'sortie ' + c); });
    ouvriers.push(o);
  }
  return {
    get n() { return vivants().length; },
    place: () => (vivants().length && total() < 2 * vivants().length ? Promise.resolve() : vivants().length ? new Promise<void>((r) => enAttente.push(r)) : Promise.resolve()),
    confier(ab: ArrayBuffer): Promise<any> {
      const v = vivants();
      if (!v.length) { try { return Promise.resolve(decoderIci(ab)); } catch (e) { return Promise.reject(e); } } // aucun ouvrier : sur place
      const o = v.reduce((a, b) => (b.charge < a.charge ? b : a));
      const i = ++id; o.charge++;
      // On garde une copie tant que l'ouvrier n'a pas répondu, pour pouvoir refaire le travail s'il plante
      const copie = ab.slice(0);
      return new Promise((ok, ko) => { o.attentes.set(i, { ab: copie, ok, ko }); o.w!.postMessage({ id: i, ab }, [ab]); });
    },
    // Fermeture normale : on oublie l'ouvrier avant de l'arrêter (sa sortie n'est pas une panne)
    fermer: () => Promise.all(ouvriers.map(o => { const w = o.w; o.w = null; return w ? w.terminate() : 0; })),
  };
}

// ---------- Décodage d'un secteur (ouvrier, ou fil principal en secours) ----------
// La carte n'affiche ni terrains, ni bâtiments, ni bordures, ni panneaux, ni modèles 3D, ni trajectoires :
// on les jette dès le décodage (et avec eux les millions de nœuds qu'ils citent).
const INUTILES = new Set<number>([ItemType.Terrain, ItemType.Building, ItemType.Curve, ItemType.Sign, ItemType.Model, ItemType.TrajectoryItem]);
const AUCUN = { has: () => false } as unknown as Set<bigint>;
export function decoderSecteur(ab: ArrayBuffer) {
  const s = parseSector(Buffer.from(ab), AUCUN);
  const items = s.items.filter((it: any) => !INUTILES.has(it.type));
  const n = s.nodes.length;
  const u = new BigUint64Array(3 * n), f = new Float32Array(8 * n), c = new Uint8Array(2 * n);
  for (let i = 0; i < n; i++) {
    const d: any = s.nodes[i];
    u[3 * i] = BigInt.asUintN(64, d.uid); u[3 * i + 1] = BigInt.asUintN(64, d.forwardItemUid); u[3 * i + 2] = BigInt.asUintN(64, d.backwardItemUid);
    const q = d.rotationQuat || [0, 0, 0, 0], k = 8 * i;
    f[k] = d.x; f[k + 1] = d.y; f[k + 2] = d.z; f[k + 3] = d.rotation;
    f[k + 4] = q[0]; f[k + 5] = q[1]; f[k + 6] = q[2]; f[k + 7] = q[3];
    c[2 * i] = d.forwardCountryId; c[2 * i + 1] = d.backwardCountryId;
  }
  return { items, n, u: u.buffer, f: f.buffer, c: c.buffer };
}

// ---------- Côté ouvrier ----------
export function lancerOuvrier() {
  parentPort!.on('message', ({ id, ab }: { id: number; ab: ArrayBuffer }) => {
    try {
      const r = decoderSecteur(ab);
      parentPort!.postMessage({ id, ...r }, [r.u, r.f, r.c]);
    } catch (e: any) {
      parentPort!.postMessage({ id, erreur: String(e && e.message || e) });
    }
  });
}
