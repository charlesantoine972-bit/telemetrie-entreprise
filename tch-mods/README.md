# TCH Mods

**TCH Mods** analyse les mods d'ETS2 / ATS pour Truck & Coach Hub. C'est un **logiciel libre sous licence GNU GPL v3 ou ultérieure** (voir `LICENSE`), séparé de l'application : Hub lui donne un fichier de demande JSON et affiche son rapport (ligne `@TCH {…}` sur la sortie standard).

## Ce qu'il fait (lecture seule)
- Inventaire des mods locaux (`Documents/<jeu>/mod`) et du Steam Workshop, dans tous les formats (HashFS v1/v2, ZIP, dossier), avec leur `manifest.sii`.
- Versions déclarées comparées à la version du jeu, doublons et anciennes versions d'un même mod.
- Lecture du journal du jeu (`game.log.txt`) : mods signalés incompatibles, en double, erreurs attribuées à un mod.
- Mods dont une sauvegarde a besoin : éléments de la sauvegarde (camions, remorques, accessoires…) qui ne viennent ni du jeu ni de ses DLC, mais d'un mod.

## Crédits
- Lecteur d'archives : `../tch-map/lecteur` (GPL-3). Idées d'analyse inspirées d'**Easy SCSModManager** (Switch-Bros, GPL-3).
