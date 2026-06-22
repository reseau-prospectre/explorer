---
id: "prompt:bibliotheque-de-packs"
type: "prompt"
titre: "Bibliothèque de packs"
resume: "Prompt prêt à copier : bibliothèque de packs."
usage: "Bibliothèque de packs"
liens:
- "recette:bibliotheque-prospectre"
- "preuve:bibliotheque-vivante"
---
# Bibliothèque de packs

Ce prompt est volontairement explicite. Un agent ne doit pas deviner ce qu’est PROSPECTRE en regardant la lune par la fenêtre. On lui donne le format, le rôle du graphe, et les critères de sortie.

```text
Conçois une bibliothèque PROSPECTRE.

Contexte : une bibliothèque rassemble des packs transportables : démonstrations, formations, référentiels, prospectives, archives, expérimentations. Elle doit aider à choisir un pack, connaître son état, son origine, sa qualité de graphe et son usage.

Propose :
- catégories de packs ;
- métadonnées minimales ;
- critères de qualité ;
- règles de version ;
- politique d’archivage ;
- procédure de mise à jour ;
- place des exports ZIP et des dossiers source ;
- exemple d’entrée de catalogue.

Inclure les référentiels CSV Moodle comme famille à part entière : ils peuvent venir de Moodle, d’un dépôt GitHub, d’une institution ou d’une bibliothèque comme eldoomcbe, puis être lus dans PROSPECTRE.
```

## Quand l’utiliser

Prompt prêt à copier : bibliothèque de packs.

## Contrôle minimal

- Le résultat distingue modèle, fiches et relations.
- Les titres visibles sont humains.
- Les références pointent vers des identifiants existants.
- Le graphe produit peut être expliqué avant d’être admiré.
