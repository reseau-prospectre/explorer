---
id: "prompt:schema-minimal"
type: "prompt"
titre: "Schéma minimal"
resume: "Prompt prêt à copier : schéma minimal."
usage: "Schéma minimal"
liens:
- "coulisse:schema-et-types"
- "coulisse:modele-et-granularite"
---
# Schéma minimal

Ce prompt est volontairement explicite. Un agent ne doit pas deviner ce qu’est PROSPECTRE en regardant la lune par la fenêtre. On lui donne le format, le rôle du graphe, et les critères de sortie.

```text
Propose un schéma PROSPECTRE minimal pour ce corpus.

Rappel : PROSPECTRE a besoin d’un manifest.json décrivant les types et champs, puis de fiches Markdown reliées. Le but n’est pas de tout modéliser ; le but est de produire un graphe lisible, exportable et discutable.

Réponds avec :
- 3 à 8 types maximum ;
- champs indispensables pour chaque type ;
- relations utiles, chacune formulée en une phrase ;
- types à afficher avec labels dans le graphe ;
- contenus à garder dans les fiches plutôt qu’en nœuds ;
- nombre cible de fiches ;
- deux risques de mauvaise lisibilité.

Ne rédige pas les fiches. Une bonne esquisse vaut mieux qu’une cathédrale JSON inhabitable.
```

## Quand l’utiliser

Prompt prêt à copier : schéma minimal.

## Contrôle minimal

- Le résultat distingue modèle, fiches et relations.
- Les titres visibles sont humains.
- Les références pointent vers des identifiants existants.
- Le graphe produit peut être expliqué avant d’être admiré.
