// Remplace la boucle de lecture des secteurs de TruckSim Maps par une lecture en deux passes, économe en mémoire.
export function patchSecteurs(s) {
  const start = s.indexOf('  const seenNodeUids = new Set<bigint>();\n  for (const f of baseFiles) {');
  const endMark = '    bar.increment({ filename: f });\n  }\n';
  const end = s.indexOf(endMark, start);
  if (start < 0 || end < 0) throw new Error('boucle des secteurs introuvable');
  const nouveau = `
  // TCH Map : deux passes. 1) objets utiles + nœuds qu'ils citent ; 2) seulement ces nœuds.
  const __garder = (it: any) => it.type !== ItemType.Terrain &&
    !(it.type === ItemType.Model && __defs && !__defs.models.has(it.token));
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
  const __cles: [string, string, number, number][] = [];
  for (const f of baseFiles) {
    const sectorKey = f.replace(/\\.(base|aux)$/, '');
    const m = sectorRegex.exec(sectorKey);
    if (!m) throw new Error(\`unexpected sector key "\${sectorKey}"\`);
    __cles.push([f, sectorKey, parseFloat(m[1]), parseFloat(m[2])]);
    const sector = putIfAbsent(sectorKey, { items: [], nodes: [] }, sectors);
    const baseFile = assertExists(entries.files.get(\`map/\${map}/\${f}\`));
    const tous = { has: () => true } as unknown as Set<bigint>;
    const parsed = parseSector(baseFile.read(), tous);
    for (const item of parsed.items) {
      if (!__garder(item)) continue;
      __citer(item);
      sector.items.push(withDlcGuard(item, map, baseFile.scsSource));
    }
    bar.increment({ filename: f });
  }
  const seenNodeUids = new Set<bigint>();
  const ignorer = { has: (uid: bigint) => !__refs.has(uid) || seenNodeUids.has(uid) } as unknown as Set<bigint>;
  for (const [f, sectorKey] of __cles) {
    const sector = sectors.get(sectorKey)!;
    const baseFile = assertExists(entries.files.get(\`map/\${map}/\${f}\`));
    const parsed = parseSector(baseFile.read(), ignorer);
    for (const node of parsed.nodes) {
      if (seenNodeUids.has(node.uid) || !__refs.has(node.uid)) continue;
      seenNodeUids.add(node.uid);
      sector.nodes.push(node);
    }
  }
`;
  s = s.slice(0, start) + nouveau + s.slice(end + endMark.length);
  s = s.replace('function parseSectorFiles(entries: Entries): {', 'function parseSectorFiles(entries: Entries, __defs?: any): {');
  const avant = s.length;
  s = s.replace('const sectorData = parseSectorFiles(entries);', 'const sectorData = parseSectorFiles(entries, defData);');
  if (s.length === avant) throw new Error('appel parseSectorFiles introuvable');
  return s;
}
