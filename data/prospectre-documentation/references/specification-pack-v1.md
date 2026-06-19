---
id: reference:specification-pack-v1
type: reference
titre: Spécification d’un pack PROSPECTRE 1.0
format: spécification
statut: validé
resume: Contrat normatif du manifeste, du modèle, des fiches Markdown, des références et des assets d’un pack v1.
relations:
- type: related_to
  target: reference:frontmatter
- type: related_to
  target: architecture:format-pack
- type: related_to
  target: procedure:migrer-pack-v1
---

# Spécification d’un pack PROSPECTRE 1.0

## Manifeste minimal

```json
{
  "id": "pack:exemple",
  "titre": "Exemple",
  "version": "1.0.0",
  "format_version": "1.0.0",
  "date_generation": "2026-06-11",
  "description": "Description du corpus.",
  "modele": {
    "version": "1.0.0",
    "types": []
  },
  "fichiers": ["elements/exemple.md", "manifest.json"]
}
```

## Type

Un type accepte :

| Propriété | Rôle |
|---|---|
| `id` | identifiant technique stable |
| `label` | libellé pluriel |
| `singular` | libellé singulier |
| `folder` | dossier d’export |
| `color` | couleur hexadécimale |
| `size` | taille du nœud, de 6 à 30 |
| `order` | ordre des filtres |
| `showLabel` | visibilité naturelle du label |
| `fields` | définition des champs éditables |

## Champ

Les valeurs de `kind` sont `text`, `textarea`, `number`, `boolean`, `select`
et `reference`.

Un champ de référence précise :

```json
{
  "key": "parent",
  "label": "Parent",
  "kind": "reference",
  "target": "*",
  "multiple": false,
  "required": false
}
```

## Relations nommées

Le manifeste peut définir les libellés des relations libres :

```json
{
  "relations": {
    "supports": { "label": "Documente" },
    "derived_from": { "label": "Prolonge" }
  }
}
```

## Fiche

Une fiche doit commencer par un front matter YAML et fournir au minimum `id`,
`type` et le champ de titre requis par son type.

```markdown
---
id: item:exemple
type: item
titre: Exemple
relations: []
---

# Exemple
```

Les identifiants ne sont jamais renommés automatiquement. Les chemins d’images
peuvent être relatifs au fichier Markdown ou utiliser une URL distante.
