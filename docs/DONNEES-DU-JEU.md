# Données du jeu : ce que ETS2 / ATS transmettent vraiment

Vérifié le 27 novembre 2026 (bêta 6, étape 0) dans la **documentation officielle du kit de télémétrie de SCS Software** :

- les en-têtes officiels inclus dans le dépôt, `plugin/scs_sdk/include/` (ceux avec lesquels la DLL est compilée) : `common/scssdk_telemetry_common_gameplay_events.h`, `common/scssdk_telemetry_common_configs.h`, `eurotrucks2/scssdk_telemetry_eut2.h` (version de jeu **1.21**), `amtrucks/scssdk_telemetry_ats.h` (version de jeu **1.08**) ;
- la page officielle du SDK sur le wiki de SCS (<https://modding.scssoft.com/wiki/Documentation/Engine/SDK/Telemetry>), qui annonce le **SDK 1.17** comme dernière version stable. **L'archive `scs_sdk_1_17.zip` n'a pas pu être téléchargée depuis l'environnement de travail (réseau bloqué)** : si elle documente des attributs en plus (surtout ceux du car, `bus_job`), ce tableau est à compléter. Le journal des versions publié sur le wiki s'arrête au SDK 1.10.

**Règle appliquée** : si la doc dit que le jeu le transmet, l'appli l'enregistre et l'affiche. Sinon, rien n'est deviné ni calculé : la page le dit.

| Donnée | Fournie ? | Source exacte dans la doc | Jeux | Dans l'appli |
|---|---|---|---|---|
| Coût du carburant payé (plein) | **Non** | Aucun évènement de plein payé dans `scssdk_telemetry_common_gameplay_events.h`. Seul le **niveau** du réservoir existe (canal `truck.fuel`). | — | Litres ajoutés seulement (calculés d'après le niveau). **Le jeu ne transmet pas le prix du plein.** |
| Coût des réparations | **Non** | Aucun évènement de réparation dans la doc. Seule l'**usure** existe (canaux `truck.wear.*`, `trailer.wear.*`). | — | **Le jeu ne transmet pas le coût des réparations.** |
| Péages | **Oui** | Évènement `player.tollgate.paid`, attribut `pay.amount` (s64, monnaie du jeu). | ETS2 ≥ 1.14 (jeu 1.35), ATS ≥ 1.01 | Dépense « péage » de la mission |
| Ferries | **Oui** | Évènement `player.use.ferry`, attributs `pay.amount`, `source.name`, `target.name`, `source.id`, `target.id`. | idem | Dépense « ferry », avec le port de départ et d'arrivée |
| Trains | **Oui** | Évènement `player.use.train`, mêmes attributs que le ferry. | idem | Dépense « train », avec la gare de départ et d'arrivée |
| Amendes | **Oui** | Évènement `player.fined`, attributs `fine.amount` (s64) et `fine.offence` (texte : `speeding`, `red_signal`, `crash`…). | idem (`avoid_inspection`, `illegal_border_crossing`, `hard_shoulder_violation` : ETS2 ≥ 1.16, ATS ≥ 1.03) | Dépense « amende », avec l'infraction |
| Pénalité d'annulation | **Oui** | Évènements `job.cancelled` et `car_job.cancelled`, attribut `cancel.penalty` (s64, peut valoir 0). | camion : ETS2 ≥ 1.14, ATS ≥ 1.01 ; `car_job` : ATS ≥ 1.07 | Dépense « annulation » (une pénalité de 0 n'est pas notée) |
| Revenu de la mission | **Oui** | Évènements `job.delivered` / `car_job.delivered`, attribut `revenue` (s64). Revenu attendu : attribut `income` (u64) des configurations `job` et `car_job`. | idem | Revenu de la mission (celui de la livraison ; sinon le revenu attendu) |
| Masse de la cargaison | **Oui** (camion) | Configuration `job`, attribut `cargo.mass` (float, kg) ; aussi `cargo.unit.mass` et `cargo.unit.count`. | ETS2, ATS | Masse en tonnes. La configuration `car_job` n'a pas de masse. |
| Type de cargaison | **Oui** | Configuration `job` (et `car_job`), attributs `cargo` (nom traduit) et `cargo.id`. | ETS2, ATS | Nom de la cargaison |
| Matières dangereuses (ADR) | **Non** | Aucun attribut ADR / matière dangereuse dans `scssdk_telemetry_common_configs.h`. | — | **Le jeu ne transmet pas si la cargaison est dangereuse.** |
| Convoi exceptionnel | **Oui** (transport spécial) | Configuration `job`, attribut `is.special.job` (bool) : « job is special transport job ». | ETS2, ATS | Repère ⚑ « convoi exceptionnel ». **Corrigé en bêta 6** : l'appli lisait un mauvais nom (`special_job`) et ne le voyait jamais. |
| Nombre de voyageurs (car) | **Non documenté** | Configuration `bus_job` : « Supported attributes will be documented after release of bus dlc » (`scssdk_telemetry_common_configs.h`). Aucun attribut de voyageurs documenté. | ETS2 ≥ 1.20 | **Le jeu ne documente pas le nombre de voyageurs.** L'appli n'en invente pas ; si le jeu envoie un jour un champ de voyageurs, la lecture déjà en place (`src/coach.js`) l'affiche, sinon rien. |
| Fin / abandon d'un service en car | **Non documenté** | Les évènements `bus_job.completed` / `bus_job.cancelled` ne sont **pas** dans la doc. | — | Écoutés s'ils arrivent (code déjà en place) ; sinon la fin est notée quand la configuration `bus_job` se vide, sans revenu inventé. |
| Dégâts | **Oui** | `job.delivered` : `cargo.damage` (0 à 1) ; `car_job.delivered` : `cargo.damage` et `vehicle.damage` ; canal `job.cargo.damage` pendant le trajet. | ETS2, ATS | Dégâts de la cargaison en % |
| Distance de la mission | **Oui** | `job.delivered` : `distance.km` (réelle) ; configuration : `planned_distance.km` (prévue, ferry non compris). | ETS2 ≥ 1.15, ATS ≥ 1.02 | Distance prévue ; km chargés / à vide comptés par l'appli au compteur |

## Plugin : faut-il le recompiler ?

**Non, pas pour la bêta 6.** Le plugin (`plugin/telemetrie_entreprise.cpp`, version 1.5.0) transmet déjà **tous** les évènements de jeu avec **tous** leurs attributs (`on_gameplay`), et **toutes** les configurations, y compris `car_job` (message `config`). Les nouveautés de la bêta 6 sont donc entièrement dans `src/telemetry.js` (lecture des bons noms d'attributs, `car_job`, détail des dépenses) et dans l'interface. `resources/plugin/telemetrie_entreprise.dll` n'a pas été touché (point S19 du tableau de bord).

Si un jour le plugin doit changer : modifier `plugin/telemetrie_entreprise.cpp`, recompiler sous Windows avec `plugin/build-windows.ps1` (Visual Studio, x64), tester en jeu (commande console `sdk reload`), noter l'empreinte SHA-256 de la nouvelle DLL dans le Journal des tâches, puis seulement remplacer `resources/plugin/telemetrie_entreprise.dll`.

## Ce que ça change dans l'appli

- **Dépenses** : péages, ferries, trains, amendes et pénalités d'annulation, avec le montant exact donné par le jeu, rattachées à la mission en cours (Feuille de route → onglet Dépenses, Finances → Missions terminées).
- **Carburant et réparations** : jamais de montant. Pour le carburant, seuls les litres ajoutés sont affichés.
- **Euros et dollars** ne sont jamais additionnés : ETS2 en €, ATS en $.
