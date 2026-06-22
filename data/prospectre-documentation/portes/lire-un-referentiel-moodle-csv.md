---
id: "porte:lire-un-referentiel-moodle-csv"
type: "porte"
titre: "Lire un référentiel Moodle CSV"
resume: "Le cas d’usage compétence : importer, typer et cartographier un référentiel compatible Moodle."
liens:
- "recette:referentiel-moodle-csv"
- "coulisse:mapping-csv-moodle"
- "prompt:pack-csv-moodle"
- "porte:ce-que-prospectre-sait-faire"
---
# Lire un référentiel Moodle CSV

Un référentiel de compétences Moodle au format CSV transporte une hiérarchie et des libellés. PROSPECTRE peut en faire une carte : domaines, compétences, niveaux, indicateurs, parents, preuves et dépendances deviennent des fiches reliées.

Le CSV reste excellent pour l’échange machine. Le graphe devient meilleur pour la lecture humaine. Il n’y a pas de contradiction. Les machines aussi ont droit à des formats sobres.

| Élément CSV probable | Traduction PROSPECTRE |
| --- | --- |
| Identifiant ou code | Champ interne stable, jamais titre principal s’il est cryptique. |
| Parent | Relation hiérarchique vers domaine, compétence ou niveau. |
| Nom court | Candidat au titre visible, à réécrire si nécessaire. |
| Description | Corps de fiche ou résumé selon longueur. |
| Échelle / niveau | Type dédié si l’échelle structure la navigation. |
| Chemin de catégorie | Relation de contexte ou fiche parent. |

## Procédure de conversion

1. Lire les colonnes réelles, pas le souvenir d’un autre CSV.
2. Déterminer la hiérarchie : domaine, compétence, sous-compétence, niveau.
3. Garder les codes comme preuves internes.
4. Produire des labels visibles que des humains peuvent prononcer.
5. Relier chaque élément à au moins un parent ou contexte.
6. Auditer : éléments, liens, types, isolats, labels suspects.

## Cas d’usage

Avec un connecteur adapté, PROSPECTRE devient un lecteur universel de référentiels de compétences : il ne remplace pas Moodle, il rend visible ce que le tableur ne sait montrer qu’en lignes.
