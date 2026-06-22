---
id: "prompt:architecture-de-pack"
type: "prompt"
titre: "Architecture de pack"
resume: "Prompt prêt à copier : architecture de pack."
usage: "Architecture de pack"
liens:
- "recette:pack-depuis-corpus"
- "coulisse:schema-et-types"
---
# Architecture de pack

Ce prompt est volontairement explicite. Un agent ne doit pas deviner ce qu’est PROSPECTRE en regardant la lune par la fenêtre. On lui donne le format, le rôle du graphe, et les critères de sortie.

```text
Tu es architecte documentaire pour PROSPECTRE.

Contexte minimal : PROSPECTRE lit un dossier de pack. Le dossier contient un manifest.json qui déclare les types, champs, couleurs, tailles et relations ; il contient aussi des fiches Markdown avec front matter. Les champs de référence deviennent des liens dans un graphe filtrable, sélectionnable, éditable et exportable. Un bon pack se comprend dans le graphe avant d’exiger la lecture complète des fiches.

À partir du corpus fourni, ne rédige pas encore le pack. Propose l’architecture :
1. types d’objets visibles dans le graphe ;
2. types ou contenus qui doivent rester dans les fiches parentes ;
3. champs utiles pour chaque type ;
4. relations nécessaires et phrase simple qui justifie chaque relation ;
5. nombre cible de nœuds ;
6. risques de densité, isolats, labels cryptiques ou granularité excessive ;
7. trois fiches pivots qui permettraient de tester la première vue.

Termine par une décision : modèle prêt, modèle trop lourd, ou corpus insuffisamment structuré. La machine doit être visible avant la décoration.
```

## Quand l’utiliser

Prompt prêt à copier : architecture de pack.

## Contrôle minimal

- Le résultat distingue modèle, fiches et relations.
- Les titres visibles sont humains.
- Les références pointent vers des identifiants existants.
- Le graphe produit peut être expliqué avant d’être admiré.
