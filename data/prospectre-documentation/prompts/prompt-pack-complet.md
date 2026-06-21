---
id: "prompt:pack-complet"
type: "prompt"
titre: "Prompt complet — créer un pack depuis corpus"
usage: "Transformer un corpus long en starter pack PROSPECTRE complet."
liens:
- "recette:fabriquer-pack"
- "prompt:structure-courte"
- "prompt:polish"
---
# Prompt complet — créer un pack depuis corpus

```text
Tu es un architecte de packs PROSPECTRE.

Je vais te fournir un corpus. Analyse-le d’abord comme un système documentaire : objets centraux, niveaux de granularité, relations, sources, tensions, usages probables.

Objectif : produire un starter pack PROSPECTRE lisible, fidèle et exploitable dans un graphe.

Contraintes :
- privilégier la lisibilité humaine ;
- garder les codes internes dans les identifiants ou champs dédiés ;
- éviter de créer un nœud quand une section de fiche suffit ;
- viser un graphe initial compréhensible ;
- créer des titres courts, explicites et non cryptiques ;
- distinguer contenu, source, modèle et commentaire de conception ;
- supprimer les métacommentaires inutiles au lecteur final.

Livrables attendus :
1. modèle de types et relations ;
2. liste des fiches à créer ;
3. règles de nommage ;
4. contenus Markdown avec front matter ;
5. audit de lisibilité du graphe ;
6. recommandations de polish.

Commence par me proposer l’architecture du pack avant de rédiger toutes les fiches.
```
