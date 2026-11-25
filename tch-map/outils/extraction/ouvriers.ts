// TCH Map : ouvriers (worker_threads) qui décodent les secteurs de la carte en parallèle.
// Le même fichier compilé (extraire.cjs) sert de programme principal et d'ouvrier.
import os from 'os';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { parseSector } from '@maps/clis/parser/game-files/sector-parser';
import { ItemType } from '@truckermudgeon/map/constants';

export const estOuvrier = !isMainThread && !!(workerData && workerData.tchOuvrier);

// Combien d'ouvriers : un par cœur, moins deux (le jeu, Windows et le fil principal), au plus 8,
// et pas plus que ce que la mémoire libre permet (~400 Mo chacun, en gardant 1,5 Go de marge).
export function nombreOuvriers(): number {
  const env = Number(process.env.TCH_OUVRIERS);
  if (env > 0) return Math.min(32, Math.floor(env));
  const coeurs = typeof os.availableParallelism === 'function' ? os.availableParallelism() : os.cpus().length;
  const libreGo = os.freemem() / 2 ** 30;
  return Math.max(1, Math.min(coeurs - 2, 8, Math.floor((libreGo - 1.5) / 0.4)));
}

// ---------- Côté principal ----------
export function creerOuvriers(modeles: string[]) {
  const n = nombreOuvriers();
  const fichier = __filename;
  const ouvriers = Array.from({ length: n }, () => {
    const w = new Worker(fichier, { workerData: { tchOuvrier: true, modeles }, resourceLimits: { maxOldGenerationSizeMb: 1024 } });
    const o = { w, charge: 0, attentes: new Map<number, [(r: any) => void, (e: Error) => void]>() };
    w.on('message', (m: any) => {
      const a = o.attentes.get(m.id); if (!a) return;
      o.attentes.delete(m.id); o.charge--; libere();
      if (m.erreur) a[1](new Error(m.erreur)); else a[0](m);
    });
    w.on('error', (e) => { for (const [, a] of o.attentes) a[1](e); o.attentes.clear(); });
    return o;
  });
  let id = 0, enAttente: (() => void)[] = [];
  const total = () => ouvriers.reduce((s, o) => s + o.charge, 0);
  const libere = () => { while (enAttente.length && total() < 2 * n) enAttente.shift()!(); };
  return {
    n,
    // Attend qu'une place se libère (au plus 2 secteurs par ouvrier en même temps)
    place: () => (total() < 2 * n ? Promise.resolve() : new Promise<void>((r) => enAttente.push(r))),
    confier(ab: ArrayBuffer): Promise<any> {
      const o = ouvriers.reduce((a, b) => (b.charge < a.charge ? b : a));
      const i = ++id; o.charge++;
      return new Promise((res, rej) => { o.attentes.set(i, [res, rej]); o.w.postMessage({ id: i, ab }, [ab]); });
    },
    fermer: () => Promise.all(ouvriers.map(o => o.w.terminate())),
  };
}

// ---------- Côté ouvrier ----------
export function lancerOuvrier() {
  const modeles = new Set<string>(workerData.modeles || []);
  const aucun = { has: () => false } as unknown as Set<bigint>;
  // La carte n'affiche ni terrains, ni bâtiments, ni bordures, ni panneaux, ni modèles 3D, ni trajectoires :
  // on les jette dès le décodage (et avec eux les millions de nœuds qu'ils citent).
  const inutiles = new Set<number>([ItemType.Terrain, ItemType.Building, ItemType.Curve, ItemType.Sign, ItemType.Model, ItemType.TrajectoryItem]);
  const garder = (it: any) => !inutiles.has(it.type);
  void modeles;
  parentPort!.on('message', ({ id, ab }: { id: number; ab: ArrayBuffer }) => {
    try {
      const s = parseSector(Buffer.from(ab), aucun);
      const items = s.items.filter(garder);
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
      parentPort!.postMessage({ id, items, n, u: u.buffer, f: f.buffer, c: c.buffer }, [u.buffer, f.buffer, c.buffer]);
    } catch (e: any) {
      parentPort!.postMessage({ id, erreur: String(e && e.message || e) });
    }
  });
}
