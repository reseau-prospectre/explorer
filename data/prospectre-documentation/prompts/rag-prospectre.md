---
id: "prompt:rag-prospectre"
type: "prompt"
titre: "RAG PROSPECTRE"
resume: "Prompt prêt à copier : rag prospectre."
usage: "RAG PROSPECTRE"
liens:
- "recette:base-rag-minimale"
- "recette:agent-specialise"
---
# RAG PROSPECTRE

Ce prompt est volontairement explicite. Un agent ne doit pas deviner ce qu’est PROSPECTRE en regardant la lune par la fenêtre. On lui donne le format, le rôle du graphe, et les critères de sortie.

```text
Utilise la base de connaissances fournie pour assister la création de packs PROSPECTRE.

Rappel : la base doit contenir au minimum la définition d’un pack, la structure du manifest, le rôle des fiches Markdown, les règles de références entity, les critères de labels humains, les métriques de graphe et les cas d’usage : corpus, prospective, formation, référentiel Moodle CSV, bibliothèque.

Méthode :
1. cite la source interne qui justifie une décision ;
2. sépare extrait du corpus, inférence et proposition ;
3. signale les contradictions entre corpus et modèle ;
4. garde les codes techniques en métadonnées ;
5. propose un audit de navigabilité avant de conclure.

Si la base ne contient pas l’information, dis-le. Un RAG qui improvise est un perroquet avec une carte de bibliothèque.
```

## Quand l’utiliser

Prompt prêt à copier : rag prospectre.

## Contrôle minimal

- Le résultat distingue modèle, fiches et relations.
- Les titres visibles sont humains.
- Les références pointent vers des identifiants existants.
- Le graphe produit peut être expliqué avant d’être admiré.
