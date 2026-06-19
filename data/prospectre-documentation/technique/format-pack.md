---
id: architecture:format-pack
type: architecture
titre: Format d’un pack
composant: import et export
statut: stable
resume: Spécification de l’arborescence, du manifeste, des Markdown et des assets d’un projet portable.
relations:
- type: related_to
  target: architecture:application
- type: related_to
  target: reference:frontmatter
- type: related_to
  target: procedure:cycle-pack
- type: related_to
  target: guide:import-export
---

# Format d’un pack

## Arborescence minimale

```text
mon-projet/
├── manifest.json
├── README.md
└── fiches/
    └── exemple.md
```

Un pack enrichi peut ajouter des dossiers par type, des relations, des modèles
et des assets.

## Manifeste

Champs principaux :

| Champ | Requis | Description |
|---|---:|---|
| `id` | oui | identifiant stable du projet |
| `titre` | oui | nom affiché |
| `version` | recommandé | version du pack |
| `description` | recommandé | résumé |
| `modele` | recommandé | schéma administrable |
| `fichiers` | oui | liste exhaustive des Markdown et assets |

Exemple :

```json
{
  "id": "pack:exemple",
  "titre": "Projet exemple",
  "version": "1.0.0",
  "fichiers": [
    "README.md",
    "fiches/exemple.md",
    "assets/schema.svg",
    "manifest.json"
  ]
}
```

## Fichiers Markdown

Chaque fiche indexable doit avoir :

```yaml
---
id: exemple:premiere-fiche
type: exemple
titre: Première fiche
relations: []
---
```

Les Markdown sans `id`, `type` ou titre exploitable restent des fichiers du
pack, mais ne deviennent pas des nœuds.

## Assets

Extensions d’image prises en charge :

```text
.png .jpg .jpeg .gif .webp .svg
```

Les chemins relatifs sont résolus depuis le dossier de la fiche :

```markdown
![Schéma](../assets/schema.svg)
```

## ZIP

Le ZIP peut contenir un dossier racine unique. Celui-ci est retiré lors de
l’import afin de retrouver les chemins du manifeste.

## Contraintes

- utiliser `/` dans les chemins du manifeste ;
- éviter accents et espaces dans les noms de fichiers ;
- ne pas réutiliser le même `id` ;
- ne pas référencer un fichier absent ;
- garder `manifest.json` à la racine logique.
