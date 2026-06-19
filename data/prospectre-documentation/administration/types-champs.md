---
id: procedure:types-champs
type: procedure
titre: Configurer les types et les champs
audience: administrateur
statut: validé
resume: Référence opératoire pour concevoir un vocabulaire métier, des champs YAML et des relations robustes.
relations:
- type: related_to
  target: procedure:administrer-modele
- type: related_to
  target: architecture:modele-donnees
- type: related_to
  target: reference:frontmatter
- type: related_to
  target: demo:scenario-atelier
---

# Configurer les types et les champs

## Concevoir un type

Un type doit représenter une famille stable de fiches ayant un rôle comparable.

| Propriété | Conseil |
|---|---|
| nom affiché | pluriel court, compréhensible sans documentation |
| singulier | utilisé dans les panneaux et messages |
| identifiant | ASCII, stable, sans espace |
| dossier | nom simple, compatible avec tous les systèmes |
| couleur | suffisamment distincte des autres types |
| taille | refléter la fonction, pas l’importance politique |
| label | afficher en permanence les titres des nœuds structurants |

N’ajoutez pas un type uniquement pour une variation de statut. Préférez un champ
contrôlé.

## Affichage des labels dans le graphe

L’option **Label** d’un type pilote l’affichage permanent du titre de ses nœuds.
Elle est enregistrée dans `manifest.json` avec la propriété `showLabel` :

```json
{
  "id": "guide",
  "label": "Guides",
  "showLabel": true
}
```

Utiliser `true` pour les types structurants qui servent de points d’entrée dans
le graphe, et `false` pour les types nombreux ou secondaires. Les labels sont
rendus au-dessus de leur nœud afin de rester lisibles même dans une zone dense.

## Types de champ

| Type | Usage |
|---|---|
| Texte court | titre secondaire, responsable, code |
| Texte long | description structurée courte |
| Nombre | année, score, ordre |
| Oui / non | état binaire |
| Liste de valeurs | statut, famille, niveau |
| Référence | lien vers une ou plusieurs fiches |

## Champs obligatoires

Un champ obligatoire doit être :

- nécessaire à toutes les fiches du type ;
- disponible au moment de leur création ;
- contrôlable automatiquement ;
- suffisamment stable pour ne pas bloquer les imports futurs.

Évitez de rendre obligatoire un champ éditorial long. Le statut de complétude
peut être géré séparément.

## Listes de valeurs

Les valeurs doivent être :

1. mutuellement compréhensibles ;
2. documentées ;
3. stables dans leur orthographe ;
4. assez peu nombreuses pour rester utilisables.

Exemple :

```yaml
statut: validé
```

Une valeur retirée du schéma reste présente dans les anciens fichiers tant
qu’une migration n’est pas réalisée.

## Références

Une référence unique convient à une relation d’appartenance forte. Une référence
multiple convient à un ensemble ouvert de liens.

Pour les relations riches, utilisez plutôt :

```yaml
relations:
  - type: supports
    target: reference:markdown
    weight: 2
```

## Suppression

L’application bloque la suppression d’un type déjà utilisé. La suppression d’un
champ ne supprime pas les données existantes : elle les retire seulement du
schéma actif.
