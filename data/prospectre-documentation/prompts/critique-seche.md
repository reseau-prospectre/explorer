---
id: "prompt:critique-seche"
type: "prompt"
titre: "Critique sèche"
resume: "Prompt prêt à copier : critique sèche."
usage: "Critique sèche"
liens:
- "recette:polish-editorial"
- "objection:la-documentation-se-regarde-le-nombril"
---
# Critique sèche

Ce prompt est volontairement explicite. Un agent ne doit pas deviner ce qu’est PROSPECTRE en regardant la lune par la fenêtre. On lui donne le format, le rôle du graphe, et les critères de sortie.

```text
Relis ce pack avec une exigence turingienne : précision, humour sec, refus du grand discours et respect des preuves.

Contexte : PROSPECTRE aime les graphes, mais le graphe ne sauve pas un mauvais texte. Une documentation self-intégrée doit montrer l’application, expliquer ses opérations et donner des ressources utilisables. Elle ne doit pas réciter une plaquette.

Supprime :
- promesses floues ;
- phrases de chantier ;
- adjectifs décoratifs ;
- métaphores qui remplacent une procédure ;
- nœuds sans effet de navigation.

Conserve ou renforce :
- manipulations vérifiables ;
- exemples ;
- prompts autonomes ;
- cas Moodle CSV ;
- preuves FAIR, transportabilité, gouvernance, sécurité ;
- limites assumées.

Rends un verdict brutal mais utile. Le but n’est pas de vexer le pack. Il n’a pas de sentiments, normalement.
```

## Quand l’utiliser

Prompt prêt à copier : critique sèche.

## Contrôle minimal

- Le résultat distingue modèle, fiches et relations.
- Les titres visibles sont humains.
- Les références pointent vers des identifiants existants.
- Le graphe produit peut être expliqué avant d’être admiré.
