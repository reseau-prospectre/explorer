---
id: "prompt:relations-utiles"
type: "prompt"
titre: "Relations utiles"
resume: "Prompt prêt à copier : relations utiles."
usage: "Relations utiles"
liens:
- "geste:questionner-les-relations"
- "exemple:bonne-relation"
---
# Relations utiles

Ce prompt est volontairement explicite. Un agent ne doit pas deviner ce qu’est PROSPECTRE en regardant la lune par la fenêtre. On lui donne le format, le rôle du graphe, et les critères de sortie.

```text
Audite les relations d’un pack PROSPECTRE.

Contexte : une relation devient un lien dans le graphe. Un lien utile crée un chemin d’exploration ; un lien décoratif ajoute seulement une ligne au bilan. Les relations doivent pouvoir être formulées en langue naturelle.

Pour chaque relation suspecte, indique : source, cible, type, phrase de justification, raison du doute, action proposée. Classe ensuite les relations en garder, renommer, supprimer, inverser, fusionner.

Ajoute un diagnostic final : liens totaux, liens par élément, isolats attendus, hubs excessifs. Une relation utile doit pouvoir se dire en moins de dix mots. Sinon, elle est peut-être une réunion.
```

## Quand l’utiliser

Prompt prêt à copier : relations utiles.

## Contrôle minimal

- Le résultat distingue modèle, fiches et relations.
- Les titres visibles sont humains.
- Les références pointent vers des identifiants existants.
- Le graphe produit peut être expliqué avant d’être admiré.
