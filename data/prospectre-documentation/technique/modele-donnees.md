---
id: architecture:modele-donnees
type: architecture
titre: Modèle de données et relations
composant: graphe
statut: stable
resume: Normalisation des métadonnées, création des nœuds et règles de construction des relations.
relations:
- type: related_to
  target: architecture:application
- type: related_to
  target: reference:frontmatter
- type: related_to
  target: procedure:types-champs
- type: related_to
  target: guide:explorer-graphe
---

# Modèle de données et relations

## Entité

Après parsing, une fiche devient une entité normalisée :

```js
{
  id,
  type,
  label,
  summary,
  status,
  body,
  path,
  relations
}
```

Des alias francophones sont acceptés pour certains champs historiques :
`titre` vers `label`, `resume` vers `summary`, `statut` vers `status`, `axe`
vers `axis`.

## Nœud

Une entité devient un nœud si :

- son type existe dans le schéma actif ;
- son type n’appartient pas aux types techniques masqués ;
- elle possède un identifiant et un libellé.

La couleur, la taille et l’ordre viennent du schéma.

## Relations explicites

```yaml
relations:
  - type: related_to
    target: guide:accueil
    weight: 1
```

Une relation n’est créée que si la source et la cible correspondent à des
nœuds existants.

## Relations déduites

Pour les modèles prospectifs historiques, certaines propriétés spécialisées
produisent des liens :

- `axis` ou `axe` ;
- `defi` ;
- `variables` ;
- `hypotheses` ;
- `levers`.

Les nouveaux modèles génériques doivent privilégier `relations`.

## Identifiants

Convention recommandée :

```text
type:slug-stable
```

Exemples :

```text
guide:premiers-pas
architecture:format-pack
procedure:cycle-pack
```

L’identifiant ne doit pas dépendre d’un titre susceptible d’être renommé.

## Déduplication

Les relations sont dédupliquées sur la combinaison :

```text
source | cible | type
```

Deux liens ayant même source, cible et type ne produisent qu’une arête.

## Évolution

L’ajout d’un type est compatible. Le renommage d’un identifiant ou d’une clé
nécessite une migration de tous les fichiers et de toutes les relations.
