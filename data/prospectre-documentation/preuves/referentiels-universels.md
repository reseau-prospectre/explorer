---
id: "preuve:referentiels-universels"
type: "preuve"
titre: "Référentiels universels"
resume: "Un CSV de compétences peut devenir une carte navigable."
liens:
- "recette:referentiel-moodle-csv"
---
# Référentiels universels

Le cas d’usage est simple : si un référentiel de compétences existe en CSV compatible Moodle, PROSPECTRE peut le transformer en graphe de lecture. Ce n’est pas une métaphore. C’est une opération de conversion : lignes vers fiches, colonnes vers champs, parents vers relations, codes vers métadonnées.

| Étape | Preuve attendue |
| --- | --- |
| Lire le CSV | Colonnes reconnues et ambiguïtés signalées. |
| Créer le modèle | Types adaptés au référentiel réel. |
| Générer les fiches | Titres humains et codes conservés. |
| Relier les objets | Parents, niveaux, domaines et preuves navigables. |
| Auditer | Éléments, liens, liens par élément, isolats, hubs, labels suspects. |

Cette compatibilité rend PROSPECTRE complémentaire d’écosystèmes de référentiels publiés ailleurs, y compris des collections GitHub comme celles d’eldoomcbe lorsque les CSV sont disponibles. GitHub conserve, Moodle exploite, PROSPECTRE fait lire. Trois métiers. Une discussion possible.
