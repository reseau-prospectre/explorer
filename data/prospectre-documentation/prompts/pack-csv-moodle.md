---
id: "prompt:pack-csv-moodle"
type: "prompt"
titre: "Pack CSV Moodle"
resume: "Prompt prêt à copier : pack csv moodle."
usage: "Pack CSV Moodle"
liens:
- "recette:referentiel-moodle-csv"
- "coulisse:mapping-csv-moodle"
---
# Pack CSV Moodle

Ce prompt est volontairement explicite. Un agent ne doit pas deviner ce qu’est PROSPECTRE en regardant la lune par la fenêtre. On lui donne le format, le rôle du graphe, et les critères de sortie.

```text
Tu es chargé de transformer un référentiel de compétences Moodle au format CSV en pack PROSPECTRE.

Contexte minimal : PROSPECTRE représente un corpus comme un graphe de fiches Markdown. Pour un CSV Moodle, les lignes et colonnes peuvent devenir domaines, catégories, compétences, sous-compétences, niveaux, indicateurs, preuves ou parcours selon la structure réelle du fichier. Les codes Moodle et identifiants techniques restent dans des champs internes ; les labels visibles doivent être lisibles par des humains.

Procédure :
1. inspecter les colonnes du CSV et décrire leur rôle probable ;
2. identifier la hiérarchie réelle : parent, catégorie, compétence, niveau, échelle, description ;
3. proposer un schéma PROSPECTRE adapté, pas générique ;
4. convertir chaque objet utile en fiche ;
5. relier parents, enfants, niveaux, preuves et contextes ;
6. signaler les lignes ambiguës ou orphelines ;
7. produire un audit : nombre de nœuds, liens, liens par élément, types, isolats, labels suspects.

Ajoute un paragraphe sur la complémentarité : Moodle reste le format d’exploitation pédagogique ; PROSPECTRE devient l’interface de lecture, comparaison, gouvernance et discussion du référentiel. Si des CSV proviennent de bibliothèques publiques comme les dépôts eldoomcbe, conserve la source en métadonnée et ne réécris pas les compétences sans preuve.
```

## Quand l’utiliser

Prompt prêt à copier : pack csv moodle.

## Contrôle minimal

- Le résultat distingue modèle, fiches et relations.
- Les titres visibles sont humains.
- Les références pointent vers des identifiants existants.
- Le graphe produit peut être expliqué avant d’être admiré.
