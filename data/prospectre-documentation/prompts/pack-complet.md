---
id: "prompt:pack-complet"
type: "prompt"
titre: "Pack complet"
resume: "Prompt prêt à copier : pack complet."
usage: "Pack complet"
liens:
- "recette:pack-depuis-corpus"
- "recette:audit-de-pack"
---
# Pack complet

Ce prompt est volontairement explicite. Un agent ne doit pas deviner ce qu’est PROSPECTRE en regardant la lune par la fenêtre. On lui donne le format, le rôle du graphe, et les critères de sortie.

```text
Tu vas créer un pack PROSPECTRE complet à partir du corpus fourni.

Contexte minimal : un pack PROSPECTRE est un dossier transportable. Le manifest.json décrit le modèle ; les fiches Markdown portent le contenu ; les identifiants stables servent aux relations ; les titres visibles doivent être humains ; les références entre fiches deviennent un graphe. Le graphe doit être lisible avant d’être exhaustif. Les détails fins peuvent devenir tableaux, sections ou preuves, pas forcément nœuds.

Travail demandé :
1. analyser le corpus et distinguer citation, inférence et décision éditoriale ;
2. proposer le schéma du pack ;
3. produire les fiches Markdown avec front matter ;
4. relier les fiches par des références valides ;
5. vérifier que chaque nœud visible apporte une navigation réelle ;
6. auditer le graphe : éléments, liens, types, liens par élément, isolats, hubs, labels suspects ;
7. fournir une liste de corrections avant export.

Contraintes : pas de métacommentaires de conception dans les fiches finales ; pas de codes cryptiques comme titres ; pas de liens décoratifs ; pas de promesse sans preuve ; pas de contenu inventé pour boucher les trous. Si le corpus ne permet pas une fiche, signale le manque.
```

## Quand l’utiliser

Prompt prêt à copier : pack complet.

## Contrôle minimal

- Le résultat distingue modèle, fiches et relations.
- Les titres visibles sont humains.
- Les références pointent vers des identifiants existants.
- Le graphe produit peut être expliqué avant d’être admiré.
