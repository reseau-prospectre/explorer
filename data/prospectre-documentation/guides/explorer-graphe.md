---
id: guide:explorer-graphe
type: guide
titre: Explorer le graphe
audience: utilisateur
statut: validé
resume: Bonnes pratiques pour filtrer, rechercher, recadrer et interpréter les relations d’un projet complexe.
tags:
- graphe
- filtres
- recherche
relations:
- type: related_to
  target: guide:premiers-pas
- type: related_to
  target: guide:fiches-edition
- type: related_to
  target: architecture:modele-donnees
---

# Explorer le graphe

Le graphe ne remplace pas la lecture : il sert à **se repérer, détecter des
connexions et choisir la prochaine fiche à ouvrir**.

## Gestes de navigation

- faire glisser pour tourner autour du graphe ;
- utiliser la molette ou les boutons pour zoomer ;
- cliquer sur **Recadrer** pour recentrer les éléments visibles ;
- cliquer sur **Réinitialiser** pour restaurer vue, recherche et filtres ;
- sélectionner un nœud pour afficher son voisinage et sa fiche.

## Stratégie de filtrage

1. Commencer avec tous les types visibles.
2. Masquer les catégories secondaires.
3. Rechercher un terme, un acteur ou un concept.
4. Sélectionner le nœud le plus pertinent.
5. Réafficher progressivement les types liés.

Cette méthode évite de confondre une absence de relation avec un simple filtre
désactivé.

## Interpréter une relation

Une relation comporte :

| Élément | Rôle |
|---|---|
| source | fiche qui déclare ou porte la relation |
| cible | identifiant de la fiche reliée |
| type | sémantique du lien, par exemple `related_to` |
| poids | importance facultative utilisée par certains rendus |

Exemple :

```yaml
relations:
  - type: related_to
    target: guide:fiches-edition
```

## Recherche

La recherche est utile pour :

- retrouver un titre exact ;
- faire émerger un thème transversal ;
- vérifier qu’un vocabulaire est employé de façon homogène ;
- réduire temporairement la densité du graphe.

Les mots importants doivent apparaître dans le titre, le résumé, les
métadonnées utiles ou le corps Markdown.

## Limites d’interprétation

> Un graphe très connecté n’est pas nécessairement plus juste. La qualité
> dépend de la sémantique des relations et de la discipline éditoriale.

Évitez :

- les liens ajoutés uniquement pour embellir le graphe ;
- les relations réciproques dupliquées sans nécessité ;
- les identifiants de cible inexistants ;
- les types de relation employés avec plusieurs sens.
