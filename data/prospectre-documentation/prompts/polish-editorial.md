---
id: "prompt:polish-editorial"
type: "prompt"
titre: "Polish éditorial"
resume: "Prompt prêt à copier : polish éditorial."
usage: "Polish éditorial"
liens:
- "recette:polish-editorial"
- "exemple:labels-humains"
---
# Polish éditorial

Ce prompt est volontairement explicite. Un agent ne doit pas deviner ce qu’est PROSPECTRE en regardant la lune par la fenêtre. On lui donne le format, le rôle du graphe, et les critères de sortie.

```text
Audite ce pack PROSPECTRE comme un lecteur pressé, compétent, et légèrement hostile au brouillard.

Contexte : un pack PROSPECTRE doit se lire dans le graphe, puis se vérifier dans les fiches. Les codes internes peuvent exister ; ils ne doivent pas servir de titres visibles. Les liens doivent guider une exploration. Les détails trop fins doivent parfois quitter le graphe pour rejoindre un tableau ou une section parent.

Cherche :
- titres cryptiques ;
- nœuds qui devraient être des sections ;
- liens décoratifs ;
- types trop nombreux ;
- commentaires de chantier ;
- preuves mal placées ;
- hubs qui écrasent la lecture ;
- isolats ou éléments presque isolés.

Fournis un tableau : problème, fiche concernée, correction proposée, effet attendu sur le graphe. Termine par trois changements prioritaires.
```

## Quand l’utiliser

Prompt prêt à copier : polish éditorial.

## Contrôle minimal

- Le résultat distingue modèle, fiches et relations.
- Les titres visibles sont humains.
- Les références pointent vers des identifiants existants.
- Le graphe produit peut être expliqué avant d’être admiré.
