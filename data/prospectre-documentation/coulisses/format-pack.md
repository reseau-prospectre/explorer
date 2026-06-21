---
id: "coulisse:format-pack"
type: "coulisse"
titre: "Format d’un pack"
resume: "Manifeste, fichiers Markdown, assets et identifiants stables, en version utile."
liens:
- "recette:fabriquer-pack"
- "prompt:agent"
- "coulisse:modele"
---
# Format d’un pack

Un pack est un dossier portable.

```text
manifest.json
fiches/*.md
assets/*
```

Le manifeste déclare le modèle, la liste des fichiers et quelques métadonnées. Les Markdown portent les contenus. Les assets suivent avec des chemins relatifs.

## Minimum vital

- un `manifest.json` ;
- un modèle avec des types ;
- des fiches avec `id`, `type`, `titre` ;
- des références qui pointent vers des identifiants existants.

Le reste est confort, puissance ou complication. Parfois les trois.
