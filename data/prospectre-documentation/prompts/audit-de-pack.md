---
id: "prompt:audit-de-pack"
type: "prompt"
titre: "Audit de pack"
resume: "Prompt prêt à copier : audit de pack."
usage: "Audit de pack"
liens:
- "recette:audit-de-pack"
- "coulisse:metriques-de-graphe"
---
# Audit de pack

Ce prompt est volontairement explicite. Un agent ne doit pas deviner ce qu’est PROSPECTRE en regardant la lune par la fenêtre. On lui donne le format, le rôle du graphe, et les critères de sortie.

```text
Vérifie ce pack PROSPECTRE avant diffusion.

Contrôle technique : manifest valide, fichiers listés, front matter lisible, références connues, types déclarés, chemins corrects.

Contrôle UX graphe : nombre d’éléments, nombre de liens, liens par élément, types visibles, isolats, couverture du composant principal, hubs, labels contenant des codes internes, densité excessive ou pauvreté relationnelle.

Contrôle éditorial : les fiches expliquent le corpus, pas le chantier ; les exemples sont utiles ; les prompts sont autonomes ; les preuves sont localisables ; les limites sont assumées.

Réponds en trois sections : verdict, problèmes bloquants, améliorations utiles. Si tout est bon, dis précisément pourquoi. Le silence n’est pas une validation.
```

## Quand l’utiliser

Prompt prêt à copier : audit de pack.

## Contrôle minimal

- Le résultat distingue modèle, fiches et relations.
- Les titres visibles sont humains.
- Les références pointent vers des identifiants existants.
- Le graphe produit peut être expliqué avant d’être admiré.
