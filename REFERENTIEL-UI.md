# Référentiel permanent de conception — UI/UX, Design System et Accessibilité

## 1. Objectif général

Lors de toute création, modification, refonte ou évolution de l'application, tu dois systématiquement respecter les bonnes pratiques professionnelles en matière d'UI Design, d'UX Design, d'accessibilité numérique et de conception logicielle.

L'application doit offrir une expérience moderne, professionnelle, cohérente, intuitive, performante et accessible.

Ces instructions s'appliquent à l'intégralité de l'application :

- Pages principales et secondaires.
- Menus et systèmes de navigation.
- Fenêtres principales et secondaires.
- Tableaux de bord.
- Modules et fonctionnalités.
- HUD et interfaces superposées.
- Formulaires.
- Paramètres.
- Notifications.
- Composants interactifs.
- Interfaces existantes et futures.

Ces règles constituent un référentiel permanent et ne doivent pas être considérées comme de simples suggestions facultatives.

## 2. Référentiels professionnels

Tu dois t'appuyer sur les référentiels suivants :

- **Microsoft Fluent 2 Design System** : https://fluent2.microsoft.design/
- **Apple Human Interface Guidelines** : https://developer.apple.com/design/human-interface-guidelines/
- **Google Material Design 3** : https://m3.material.io/
- **Nielsen Norman Group — 10 Usability Heuristics** : https://www.nngroup.com/articles/ten-usability-heuristics/
- **Laws of UX** : https://lawsofux.com/fr/
- **WCAG 2.2** : https://www.w3.org/TR/WCAG22/
- **WCAG2ICT — Accessibilité des logiciels non web** : https://www.w3.org/TR/wcag2ict/
- **RGAA — Référentiel général d'amélioration de l'accessibilité** : https://accessibilite.numerique.gouv.fr/
- **Opquast** : https://www.opquast.com/

Ces référentiels doivent servir de fondement méthodologique. Il ne s'agit pas de reproduire visuellement les interfaces de Microsoft, Apple ou Google, mais d'appliquer leurs bonnes pratiques tout en conservant l'identité graphique propre à l'application.

## 3. Design System centralisé

L'application doit reposer sur un Design System unique, centralisé, évolutif et réutilisable.

Celui-ci doit notamment intégrer :

- Les couleurs principales et secondaires.
- Les couleurs sémantiques.
- Les styles typographiques.
- Les espacements et marges.
- Les dimensions des composants.
- Les bordures et rayons d'arrondi.
- Les ombres et niveaux d'élévation.
- Les icônes.
- Les animations et transitions.
- Les états interactifs.
- Les règles d'accessibilité.
- Les composants réutilisables.
- Les Design Tokens.

Évite toute duplication inutile des composants, des styles et des valeurs graphiques.

Les valeurs doivent être centralisées autant que possible dans des variables, des tokens ou des fichiers de thème.

Avant de créer un composant, vérifie systématiquement si un composant équivalent existe déjà.

Une nouvelle fonctionnalité doit s'intégrer au Design System existant et non créer son propre langage graphique.

## 4. Grilles, alignements et espacements

Utilise une grille cohérente basée principalement sur des multiples de 4 et de 8 pixels logiques.

Échelle de référence :

- 4 px : espacement minimal.
- 8 px : espacement rapproché.
- 12 px : espacement intermédiaire.
- 16 px : espacement standard.
- 24 px : espacement confortable.
- 32 px : séparation importante.
- 48 px : séparation de sections.
- 64 px : séparation majeure.

Recommandations générales :

| Élément | Valeur de référence |
|---|---|
| Espacement entre une icône et son texte | 8 px |
| Espacement entre composants | 8 à 16 px |
| Marges intérieures des cartes | 16 à 24 px |
| Marges générales des pages | 24 à 32 px |
| Séparation des sections | 32 à 48 px |
| Hauteur des boutons courants | 36 à 48 px |

Ces valeurs constituent une base adaptable et non une obligation rigide.

Tous les éléments doivent être correctement alignés. Évite les marges arbitraires, les espaces incohérents et les éléments visuellement déséquilibrés.

## 5. Typographie et hiérarchie visuelle

Établis une hiérarchie typographique claire, lisible et constante.

Échelle indicative :

| Utilisation | Taille indicative | Graisse |
|---|---|---|
| Titre principal | 32 px | 600–700 |
| Titre de section | 24 px | 600 |
| Sous-section | 20 px | 500–600 |
| Texte principal | 16 px | 400 |
| Texte secondaire | 14 px | 400 |
| Métadonnées et légendes | 12 px | 400 |

Les tailles doivent rester adaptables aux paramètres d'accessibilité.

Respecte les principes suivants :

- Limiter le nombre de familles typographiques.
- Éviter les textes inutilement petits.
- Garantir une lisibilité optimale.
- Utiliser des interlignes adaptés.
- Éviter l'utilisation excessive des majuscules.
- Différencier clairement les titres, textes et informations secondaires.
- Privilégier les chiffres tabulaires pour les tableaux et données de télémétrie.
- Éviter la troncature des informations importantes.

La hiérarchie visuelle doit permettre de comprendre immédiatement la structure et les priorités d'une page.

## 6. Couleurs et identité visuelle

Respecte strictement l'identité graphique existante de l'application.

Les couleurs doivent être organisées par fonction :

- Couleur principale.
- Couleur secondaire.
- Couleur d'accentuation.
- Couleur de fond.
- Couleur de surface.
- Couleur de bordure.
- Couleur du texte principal.
- Couleur du texte secondaire.
- Couleur de succès.
- Couleur d'avertissement.
- Couleur d'erreur.
- Couleur d'information.

Privilégie les Design Tokens sémantiques plutôt que les couleurs codées directement dans les composants.

Ne multiplie pas inutilement les couleurs, les dégradés, les effets de transparence, les ombres ou les effets décoratifs.

Une interface moderne ne doit pas sacrifier sa lisibilité au profit de son esthétique.

La couleur ne doit jamais être le seul moyen de transmettre une information.

## 7. Composants et états interactifs

Tous les composants interactifs doivent posséder des états cohérents et clairement identifiables lorsque ceux-ci sont pertinents :

- Default : état normal.
- Hover : survol.
- Focus : sélection au clavier.
- Active : état actif.
- Pressed : pression.
- Selected : sélection.
- Disabled : désactivation.
- Loading : chargement.
- Success : réussite.
- Warning : avertissement.
- Error : erreur.

Cela concerne notamment les boutons, champs de saisie, menus, onglets, cartes interactives, interrupteurs, listes déroulantes et éléments de navigation.

Les comportements doivent être prévisibles et homogènes dans l'ensemble de l'application.

Un élément non interactif ne doit pas donner l'impression d'être cliquable.

Un élément interactif doit être identifiable sans nécessiter de survol préalable.

## 8. Ergonomie et expérience utilisateur

Respecte systématiquement les dix heuristiques de Jakob Nielsen :

1. Visibilité de l'état du système.
2. Correspondance entre le système et le monde réel.
3. Contrôle et liberté de l'utilisateur.
4. Cohérence et respect des standards.
5. Prévention des erreurs.
6. Reconnaissance plutôt que mémorisation.
7. Flexibilité et efficacité d'utilisation.
8. Esthétique et minimalisme.
9. Identification, compréhension et résolution des erreurs.
10. Aide et documentation.

Applique également les lois fondamentales de l'UX :

- **Loi de Fitts** : les éléments interactifs doivent être suffisamment grands et faciles à atteindre.
- **Loi de Hick** : limiter la complexité des choix proposés simultanément.
- **Loi de Jakob** : respecter les conventions d'interaction connues des utilisateurs.
- **Loi de proximité** : regrouper visuellement les éléments associés.
- **Loi de similarité** : présenter de manière similaire les éléments ayant une fonction similaire.
- **Loi de Tesler** : prendre en charge autant que possible la complexité technique à la place de l'utilisateur.
- **Effet Von Restorff** : différencier visuellement les éléments importants sans multiplier les distractions.

Chaque écran doit répondre à un objectif identifiable.

Les informations et fonctionnalités les plus importantes doivent être prioritaires, tandis que les fonctionnalités avancées peuvent être organisées dans des sections secondaires.

## 9. Navigation et architecture de l'information

La navigation doit être intuitive, stable, prévisible et cohérente.

Respecte les règles suivantes :

- Indiquer clairement la page ou le module actif.
- Maintenir une structure de navigation constante.
- Éviter les niveaux de navigation inutilement profonds.
- Éviter la duplication des menus.
- Utiliser des intitulés explicites.
- Associer les icônes à des libellés lorsque leur signification n'est pas évidente.
- Permettre un retour en arrière lorsque cela est pertinent.
- Préserver le contexte de navigation de l'utilisateur.
- Respecter les fonctionnalités et onglets permanents déjà définis.
- Ne pas modifier arbitrairement l'architecture existante.

La navigation principale, la navigation secondaire et les actions contextuelles doivent être visuellement distinctes.

## 10. Accessibilité numérique

L'accessibilité doit être intégrée dès la conception et non ajoutée à la fin du développement.

L'objectif de référence est le niveau **WCAG 2.2 AA**, transposé au contexte logiciel avec les recommandations WCAG2ICT, ainsi que certains critères AAA lorsque cela est pertinent.

L'application doit respecter les quatre principes fondamentaux de l'accessibilité :

- Perceptible.
- Utilisable.
- Compréhensible.
- Robuste.

### 10.1. Contrastes

Respecte au minimum les ratios applicables suivants :

| Élément | Ratio minimal |
|---|---|
| Texte standard | 4,5:1 |
| Texte de grande taille | 3:1 |
| Composants graphiques fonctionnels concernés | 3:1 |
| Texte standard en objectif AAA | 7:1 |
| Texte de grande taille en objectif AAA | 4,5:1 |

Vérifie les contrastes réels des couleurs, y compris dans les différents états des composants.

Ne considère pas un contraste comme conforme sur la seule base de son apparence visuelle.

### 10.2. Accessibilité visuelle

Prévoir autant que possible :

- Une taille de texte personnalisable.
- Un agrandissement du texte jusqu'à 200 % sans perte d'information ou de fonctionnalité.
- Une mise à l'échelle de l'interface.
- Une compatibilité avec les résolutions et facteurs de mise à l'échelle du système.
- Un mode clair.
- Un mode sombre.
- Un mode à contraste renforcé.
- Une compatibilité avec les outils de grossissement.
- Des icônes facilement identifiables.
- Une distinction des informations indépendante des couleurs.
- Une réduction des effets visuels pouvant gêner la lecture.

Une attention particulière doit être portée aux personnes malvoyantes, dyslexiques, dyspraxiques ou présentant des difficultés de perception visuelle.

### 10.3. Accessibilité motrice

Prévoir :

- Une navigation complète au clavier.
- Un ordre de navigation logique avec la touche Tab.
- Un indicateur de focus clairement visible.
- Des raccourcis clavier cohérents.
- L'absence de pièges au clavier.
- Des alternatives aux interactions par glisser-déposer.
- Des zones interactives suffisamment grandes et espacées.

Pour les cibles interactives, utiliser 24 × 24 pixels CSS comme référence minimale WCAG 2.2 AA lorsque ce critère est applicable, sous réserve de ses exceptions. Privilégier des zones de 44 × 44 pixels logiques lorsque cela est possible et adapté.

### 10.4. Technologies d'assistance

Les composants doivent exposer correctement leurs informations aux technologies d'assistance :

- Nom accessible.
- Rôle.
- Valeur.
- État.
- Description lorsque nécessaire.
- Relations entre les éléments.

Assurer la compatibilité avec les lecteurs d'écran et les API d'accessibilité du système d'exploitation.

Utiliser les composants natifs et les structures sémantiques appropriées lorsque cela est possible.

Ne pas utiliser uniquement des composants visuels personnalisés dépourvus de sémantique accessible.

### 10.5. Accessibilité cognitive

Utiliser un vocabulaire clair et constant.

Éviter :

- Les interfaces surchargées.
- Les instructions ambiguës.
- Les animations excessives.
- Les changements imprévisibles.
- Les informations inutilement complexes.
- Les messages d'erreur exclusivement techniques.
- Les limitations de temps injustifiées.

Les instructions, formulaires et messages doivent être compréhensibles sans expertise technique particulière.

## 11. Adaptabilité et Responsive Design

L'application doit s'adapter correctement aux différentes configurations d'affichage :

- Résolutions HD et Full HD.
- Écrans QHD et 4K.
- Écrans ultrawide.
- Fenêtres redimensionnées.
- Configurations multi-écrans.
- Différents facteurs de mise à l'échelle.
- Différentes tailles de texte.

Évite les dimensions fixes lorsqu'elles risquent d'empêcher l'adaptation de l'interface.

Privilégie des conteneurs flexibles, des dimensions relatives et des contraintes de taille appropriées.

Le redimensionnement ne doit pas entraîner de chevauchements, de débordements, de textes illisibles ou de disparition de fonctionnalités essentielles.

Chaque fenêtre secondaire doit respecter les mêmes règles que la fenêtre principale.

## 12. Animations et transitions

Les animations doivent avoir une fonction ergonomique et ne pas être uniquement décoratives.

Elles peuvent servir à :

- Confirmer une interaction.
- Indiquer un changement d'état.
- Faciliter la compréhension d'une transition.
- Attirer l'attention sur une information pertinente.
- Représenter un chargement.

Évite les animations trop longues, les clignotements, les mouvements agressifs et les effets perturbant la concentration.

Respecte les préférences système relatives à la réduction des animations et propose une alternative lorsque cela est nécessaire.

## 13. Feedback utilisateur et gestion des erreurs

Chaque action importante doit générer un retour utilisateur approprié.

Prévoir des états pour :

- Chargement.
- Progression.
- Réussite.
- Erreur.
- Absence de données.
- Déconnexion.
- Indisponibilité.
- Désactivation.

Les messages d'erreur doivent expliquer :

1. Ce qui s'est produit.
2. Pourquoi, lorsque cette information est connue.
3. Comment résoudre le problème.

Les actions destructives ou irréversibles doivent être clairement identifiées et sécurisées.

Privilégie les mécanismes d'annulation et de récupération lorsque cela est possible.

Ne pas afficher une confirmation de réussite si l'action n'a pas réellement abouti.

## 14. Performance et fluidité

L'interface doit rester fluide, réactive et agréable à utiliser.

Évite notamment :

- Les animations trop coûteuses.
- Les rendus inutiles.
- Les chargements bloquants.
- La duplication des composants.
- Les effets graphiques excessifs.
- Les mises à jour inutiles de l'intégralité d'une page.

Pour les modules de télémétrie, tableaux de bord et HUD, privilégie une actualisation efficace des données sans dégrader la lisibilité ou la réactivité générale.

Une interface esthétique ne doit jamais se faire au détriment des performances.

## 15. Cohérence et préservation de l'existant

Avant toute intervention :

1. Analyse l'architecture existante.
2. Identifie les composants et styles disponibles.
3. Vérifie les conventions de développement.
4. Identifie les Design Tokens existants.
5. Détermine les conséquences de la modification sur les autres modules.
6. Réutilise les éléments existants lorsque cela est possible.

Ne modifie pas sans justification :

- L'identité graphique.
- La navigation principale.
- Les fonctionnalités opérationnelles.
- Les raccourcis existants.
- La structure générale.
- Les comportements déjà validés.
- Les préférences utilisateur.

Ne réalise pas de refonte globale lorsqu'une modification locale suffit.

Ne supprime aucune fonctionnalité sans autorisation explicite.

En cas de conflit entre une nouvelle demande et le Design System existant, explique le conflit et propose la solution la plus cohérente.

## 16. Contrôle qualité obligatoire

Avant de considérer une interface ou une fonctionnalité comme terminée, vérifie systématiquement les critères suivants :

- [ ] Respect du Design System.
- [ ] Cohérence avec les interfaces existantes.
- [ ] Alignement correct des éléments.
- [ ] Respect des espacements.
- [ ] Hiérarchie typographique cohérente.
- [ ] Lisibilité des informations.
- [ ] Contrastes vérifiés.
- [ ] Navigation au clavier fonctionnelle.
- [ ] Indicateurs de focus visibles.
- [ ] Compatibilité avec les technologies d'assistance.
- [ ] États interactifs correctement définis.
- [ ] Gestion des erreurs et des chargements.
- [ ] Adaptation aux différentes dimensions de fenêtre.
- [ ] Compatibilité avec la mise à l'échelle.
- [ ] Absence de chevauchement.
- [ ] Respect des thèmes disponibles.
- [ ] Respect des préférences d'accessibilité.
- [ ] Performances satisfaisantes.
- [ ] Réutilisation des composants.
- [ ] Absence de régression fonctionnelle.

Effectue les vérifications techniques et les tests réellement disponibles.

Ne déclare jamais une interface entièrement conforme aux WCAG ou accessible sans vérifications suffisantes. Signale les critères qui restent à tester.

## 17. Règle permanente de développement

À chaque demande de création, de modification ou d'amélioration de l'application, considère automatiquement l'ensemble de ce référentiel comme applicable.

L'utilisateur ne doit pas avoir à rappeler les règles d'UI/UX, d'accessibilité, de cohérence graphique ou de qualité logicielle à chaque nouvelle demande.

Tu dois adopter une démarche combinant les compétences d'un :

- UI Designer senior.
- UX Designer senior.
- Design System Designer.
- Spécialiste de l'accessibilité numérique.
- Développeur frontend senior.
- Architecte d'interface logicielle.
- Responsable qualité.

L'objectif final est de construire une application professionnelle, maintenable, évolutive, accessible et cohérente sur le long terme, tout en préservant son identité graphique et fonctionnelle.