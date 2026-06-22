---
id: "coulisse:conversion-csv-graphe"
type: "coulisse"
titre: "Conversion CSV vers graphe"
resume: "Passer d'un référentiel Moodle CSV à des fiches PROSPECTRE reliées."
liens:
- "geste:importer-dans-prospectre"
- "preuve:formats-ouverts"
---
# Conversion CSV vers graphe

Un CSV Moodle donne une structure de transport. PROSPECTRE en fait une structure de lecture.

| CSV | PROSPECTRE |
| --- | --- |
| Code | Identifiant conservé |
| Nom court | Titre candidat |
| Description | Corps de fiche |
| Parent | Relation |
| Chemin | Contexte |
| Échelle | Niveau ou métadonnée |

Le convertisseur doit rester humble : il expose la structure et signale les ambiguïtés. Il ne décide pas seul de la valeur pédagogique.
