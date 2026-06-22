---
id: "prompt:extraction-fidele"
type: "prompt"
titre: "Extraction fidèle"
resume: "Prompt prêt à copier : extraction fidèle."
usage: "Extraction fidèle"
liens:
- "recette:pack-depuis-corpus"
- "exemple:bon-n-ud"
---
# Extraction fidèle

Ce prompt est volontairement explicite. Un agent ne doit pas deviner ce qu’est PROSPECTRE en regardant la lune par la fenêtre. On lui donne le format, le rôle du graphe, et les critères de sortie.

```text
Extrais du corpus les objets candidats à un pack PROSPECTRE.

Contexte : chaque objet extrait peut devenir un nœud visible, une fiche de preuve, une section dans une fiche parent, une relation, ou être ignoré. Le choix dépend de l’effet sur la navigation.

Produis un tableau :
- extrait source ;
- type candidat ;
- statut recommandé : nœud visible, preuve, contenu parent, relation, ignoré ;
- justification ;
- risque si on le transforme en nœud ;
- relation probable.

Ne résume pas trop vite. L’extraction fidèle n’est pas l’extraction maximale. Les machines aiment tout prendre ; le lecteur, moins.
```

## Quand l’utiliser

Prompt prêt à copier : extraction fidèle.

## Contrôle minimal

- Le résultat distingue modèle, fiches et relations.
- Les titres visibles sont humains.
- Les références pointent vers des identifiants existants.
- Le graphe produit peut être expliqué avant d’être admiré.
