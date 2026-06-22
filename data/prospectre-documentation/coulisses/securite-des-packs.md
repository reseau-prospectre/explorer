---
id: "coulisse:securite-des-packs"
type: "coulisse"
titre: "Sécurité des packs"
resume: "Un pack partagé ne doit pas transporter des secrets ou chemins privés."
liens:
- "recette:export-sur"
---
# Sécurité des packs

Un pack partagé ne doit pas transporter des secrets ou chemins privés.

Une coulisse explique le mécanisme sans demander au lecteur de devenir mécanicien. Le capot s’ouvre ; il ne tombe pas sur les pieds.

| Point | Réponse |
| --- | --- |
| Mécanisme | Un pack partagé ne doit pas transporter des secrets ou chemins privés. |
| Pourquoi c’est visible | Parce que la portabilité et la gouvernance ne se devinent pas. |
| Limite | Le détail technique devient nuisible quand il remplace l’usage. |

## À vérifier

1. Le mécanisme a-t-il un effet visible dans l’usage ?
2. Peut-il être expliqué sans jargon inutile ?
3. Sa trace survit-elle à l’export du pack ?

## Critère

Une coulisse utile rend l’application plus vérifiable. Une coulisse bavarde rend seulement le développeur plus présent.
