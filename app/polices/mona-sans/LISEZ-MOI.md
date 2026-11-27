# Mona Sans (police de l'interface)

- Source : https://github.com/github/mona-sans (commit 4bc6ba8 du 29 septembre 2026), dossier `fonts/webfonts/variable/`.
- Licence : SIL Open Font License 1.1 (`OFL.txt`, à garder avec les fichiers). Usage commercial permis ; interdit de vendre la police seule. Nom réservé : « Mona ».
- Fichiers : `MonaSansVF.woff2` (droit) et `MonaSansVF-Italic.woff2` (italique), variables sur trois axes : graisse 200–900, largeur 75–125 %, taille optique.
- Intégrée dans l'appli (aucun appel réseau, compatible avec la Content-Security-Policy).

Déclaration à utiliser (pas encore branchée dans l'interface) :

```css
@font-face { font-family: 'Mona Sans'; src: url('../polices/mona-sans/MonaSansVF.woff2') format('woff2');
  font-weight: 200 900; font-stretch: 75% 125%; font-style: normal; font-display: swap; }
@font-face { font-family: 'Mona Sans'; src: url('../polices/mona-sans/MonaSansVF-Italic.woff2') format('woff2');
  font-weight: 200 900; font-stretch: 75% 125%; font-style: italic; font-display: swap; }
```

Le chemin `url(...)` est relatif au fichier CSS qui la déclare.
