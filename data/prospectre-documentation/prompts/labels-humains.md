---
id: "prompt:labels-humains"
type: "prompt"
titre: "Labels humains"
resume: "Prompt prêt à copier : labels humains."
usage: "Labels humains"
liens:
- "exemple:labels-humains"
- "coulisse:modele-et-granularite"
---
# Labels humains

Ce prompt est volontairement explicite. Un agent ne doit pas deviner ce qu’est PROSPECTRE en regardant la lune par la fenêtre. On lui donne le format, le rôle du graphe, et les critères de sortie.

```text
Réécris les titres visibles d’un pack PROSPECTRE.

Contexte : les identifiants, codes Moodle, codes de maquette ou références internes restent utiles pour les relations et la traçabilité. Mais dans le graphe, le lecteur doit voir des titres courts, humains, prononçables et discriminants.

Fournis un tableau : identifiant, ancien label, nouveau label, code conservé, justification, risque résiduel.

Règles : ne supprime pas les codes ; déplace-les en champ interne. Évite les titres trop longs. Ne remplace pas un code opaque par une périphrase molle. Un bon titre permet de choisir un nœud sans ouvrir la fiche.
```

## Quand l’utiliser

Prompt prêt à copier : labels humains.

## Contrôle minimal

- Le résultat distingue modèle, fiches et relations.
- Les titres visibles sont humains.
- Les références pointent vers des identifiants existants.
- Le graphe produit peut être expliqué avant d’être admiré.
