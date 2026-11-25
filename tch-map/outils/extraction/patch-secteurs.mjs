// Remplace la boucle de lecture des secteurs de TruckSim Maps par une lecture parallèle et économe en mémoire :
//  - le fil principal lit et décompresse les secteurs, puis les confie à des ouvriers (worker_threads), un par cœur
//    disponible (voir ouvriers.ts) ; au plus 2 secteurs en attente par ouvrier, pour borner la mémoire ;
//  - les ouvriers décodent et renvoient les objets utiles + les nœuds dans des tableaux compacts (≈ 58 octets par nœud
//    au lieu d'un objet JavaScript de plusieurs centaines d'octets) ;
//  - une seule lecture : à la fin, on ne reconstruit que les nœuds cités par les objets gardés.
// parseMapFiles et parseSectorFiles deviennent asynchrones (extraire.ts les attend).
export function patchSecteurs(s) {
  const start = s.indexOf('  const seenNodeUids = new Set<bigint>();\n  for (const f of baseFiles) {');
  const endMark = '    bar.increment({ filename: f });\n  }\n';
  const end = s.indexOf(endMark, start);
  if (start < 0 || end < 0) throw new Error('boucle des secteurs introuvable');
  const nouveau = `
  // ---- TCH Map : lecture parallèle (voir outils/extraction/patch-secteurs.mjs) ----
  const __refs = new Set<bigint>();
  const __citer = (o: any, depth = 0) => {
    if (!o || typeof o !== 'object' || depth > 4) return;
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (/nodeuids?$/i.test(k)) {
        if (typeof v === 'bigint') __refs.add(v);
        else if (Array.isArray(v)) for (const x of v) if (typeof x === 'bigint') __refs.add(x);
      } else if (v && typeof v === 'object') __citer(v, depth + 1);
    }
  };
  const __paquets: { secteur: string; n: number; u: BigUint64Array; f: Float32Array; c: Uint8Array }[] = [];
  const __pool = (globalThis as any).__tchOuvriers((__defs && [...__defs.models.keys()]) || []);
  const __enCours: Promise<void>[] = [];
  let __faits = 0;
  try {
    for (const f of baseFiles) {
      const sectorKey = f.replace(/\\.(base|aux)$/, '');
      if (!sectorRegex.test(sectorKey)) throw new Error(\`unexpected sector key "\${sectorKey}"\`);
      const sector = putIfAbsent(sectorKey, { items: [], nodes: [] }, sectors);
      const baseFile = assertExists(entries.files.get(\`map/\${map}/\${f}\`));
      const buf = baseFile.read();
      const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
      await __pool.place();
      __enCours.push(__pool.confier(ab).then((r: any) => {
        for (const item of r.items) { __citer(item); sector.items.push(withDlcGuard(item, map, baseFile.scsSource)); }
        if (r.n) __paquets.push({ secteur: sectorKey, n: r.n, u: new BigUint64Array(r.u), f: new Float32Array(r.f), c: new Uint8Array(r.c) });
        __faits++;
        (globalThis as any).__tchProgression?.(__faits, baseFiles.length);
      }));
    }
    await Promise.all(__enCours);
    if (process.env.TCH_DEBUG) console.error('ELU fil principal', (require('perf_hooks').performance.eventLoopUtilization().utilization).toFixed(2));
  } finally {
    await __pool.fermer();
  }
  // Nœuds : seulement ceux cités, une seule fois chacun
  for (const p of __paquets) {
    const sector = sectors.get(p.secteur)!;
    for (let i = 0; i < p.n; i++) {
      const uid = p.u[3 * i];
      if (!__refs.delete(uid)) continue;
      const k = 8 * i;
      sector.nodes.push({
        uid, x: p.f[k], y: p.f[k + 1], z: p.f[k + 2], rotation: p.f[k + 3],
        rotationQuat: [p.f[k + 4], p.f[k + 5], p.f[k + 6], p.f[k + 7]],
        forwardItemUid: p.u[3 * i + 1], backwardItemUid: p.u[3 * i + 2],
        forwardCountryId: p.c[2 * i], backwardCountryId: p.c[2 * i + 1],
      } as any);
    }
  }
  __paquets.length = 0;
`;
  s = s.slice(0, start) + nouveau + s.slice(end + endMark.length);
  const rep = (a, b, quoi) => { if (!s.includes(a)) throw new Error('motif introuvable : ' + quoi); s = s.replace(a, b); };
  rep("function parseSectorFiles(entries: Entries): {\n  map: 'usa' | 'europe';\n  sectors: Map<string, { items: Item[]; nodes: Node[] }>;\n} {",
    "async function parseSectorFiles(entries: Entries, __defs?: any): Promise<any> {", 'signature');
  rep('export function parseMapFiles(', 'export async function parseMapFiles(', 'parseMapFiles');
  rep('const sectorData = parseSectorFiles(entries);', 'const sectorData = await parseSectorFiles(entries, defData);', 'appel');
  return s;
}
