// TCH Map : archive « dossier » (sous-ensemble décompressé des fichiers du jeu), même interface que ScsArchive.
import fs from 'fs';
import path from 'path';
import { city64 } from '../../lecteur/cityhash.js';

export class DirArchive {
  constructor(readonly path: string, readonly scsSource: string) {}
  isValid() { return true; }
  dispose() {}
  parseEntries() {
    const root = this.path, src = this.scsSource;
    const full = (k: string) => path.join(root, k);
    return {
      files: { get: (k: string) => {
        const f = full(k);
        if (!fs.existsSync(f) || !fs.statSync(f).isFile()) return undefined;
        return { type: 'file' as const, hash: city64(k), scsSource: src, read: () => fs.readFileSync(f) };
      } },
      directories: { get: (k: string) => {
        const d = full(k);
        if (!fs.existsSync(d) || !fs.statSync(d).isDirectory()) return undefined;
        const ents = fs.readdirSync(d, { withFileTypes: true });
        return { type: 'directory' as const, hash: city64(k), scsSource: src,
          files: ents.filter(e => e.isFile()).map(e => e.name), subdirectories: ents.filter(e => e.isDirectory()).map(e => e.name) };
      } },
    };
  }
}
