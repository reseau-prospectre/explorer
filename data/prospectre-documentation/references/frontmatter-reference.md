---
id: reference:frontmatter
type: reference
titre: Référence du front matter YAML
format: spécification
statut: validé
resume: Spécification des métadonnées minimales, champs déclarés, références et règles de stabilité.
relations:
- type: related_to
  target: reference:markdown
- type: related_to
  target: architecture:format-pack
- type: related_to
  target: architecture:modele-donnees
- type: related_to
  target: procedure:types-champs
- type: related_to
  target: reference:specification-pack-v1
---

# Référence du front matter YAML

## Structure minimale

```yaml
---
id: guide:exemple
type: guide
titre: Fiche exemple
relations: []
---
```

| Clé | Rôle | Contrainte |
|---|---|---|
| `id` | identité globale | unique et stable |
| `type` | catégorie du nœud | doit exister dans le schéma |
| `titre` | libellé visible | non vide |
| `relations` | liens explicites | liste, éventuellement vide |

## Champs déclarés

Les clés métier sont définies par `manifest.json > modele.types[].fields`.
Le moteur ne connaît pas de vocabulaire propre à un domaine.

`titre`, `resume` et `statut` sont les conventions françaises utilisées par
les packs livrés. Un autre pack peut déclarer ses propres champs. Les champs de
référence produisent les relations du graphe.

## Valeurs scalaires

```yaml
statut: validé
horizon: 2040
actif: true
titre: "Valeur avec : deux-points"
```

## Listes

```yaml
tags:
  - documentation
  - markdown
  - exemple
```

## Objets

```yaml
responsable:
  nom: Équipe projet
  contact: contact@example.org
```

Les objets arbitraires sont conservés, mais seuls les champs compris par
l’interface produisent un comportement particulier.

## Relations

```yaml
relations:
  - type: related_to
    target: guide:accueil
  - type: supports
    target: reference:markdown
    weight: 2
```

Clés d’une relation :

| Clé | Requis | Description |
|---|---:|---|
| `type` | recommandé | sémantique de l’arête |
| `target` | oui | identifiant cible |
| `weight` | non | poids numérique |
| `source` | non | source explicite pour un fichier de relations |

## Identifiants

Utiliser :

```text
type:slug-en-minuscules
```

Éviter les identifiants fondés sur un numéro de ligne, une date temporaire ou un
titre complet.

## Stabilité

Un changement reste stable lorsqu’il ne modifie ni `id`, ni `type`, ni les clés
déjà utilisées. Le renommage d’un libellé dans le schéma ne modifie pas les
fichiers.

## Validation manuelle

- [ ] séparateurs `---` présents ;
- [ ] indentation de deux espaces ;
- [ ] aucun tabulateur ;
- [ ] chaînes ambiguës entre guillemets ;
- [ ] identifiant unique ;
- [ ] type déclaré ;
- [ ] cibles existantes ;
- [ ] valeurs contrôlées conformes au schéma.
