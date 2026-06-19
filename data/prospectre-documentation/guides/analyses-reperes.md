---
id: guide:analyses-reperes
type: guide
titre: Analyses et repères
audience: utilisateur
statut: validé
resume: Utiliser le tiroir inférieur, les indicateurs, les tableaux et les chemins contextuels pour interpréter un projet.
tags:
- analyses
- indicateurs
- tableau
relations:
- type: related_to
  target: guide:explorer-graphe
- type: related_to
  target: architecture:modele-donnees
- type: related_to
  target: guide:profil-preferences
---

# Analyses et repères

Le tiroir inférieur complète le graphe par une vue structurée. Il change selon
la sélection et peut être réduit pour agrandir la zone d’exploration.

## Vue d’ensemble

Sans sélection, le tiroir présente :

- le titre et la description du projet ;
- les métadonnées du manifeste ;
- le nombre de fichiers chargés ;
- la distribution des éléments par type.

Ces informations permettent de vérifier rapidement que le bon pack est chargé.

## Avec une sélection

Le fil d’Ariane contextuel indique la position de la fiche. Les cartes
présentent notamment :

- le nombre d’éléments liés ;
- le nombre de liens directs ;
- la répartition des types voisins ;
- les éléments associés sous forme de tableau.

Lorsqu’une fiche est sélectionnée, la carte **Métadonnées** est construite à
partir de son type et de ses champs : type, identifiant, fichier, valeurs métier
disponibles, nombre d’éléments liés, relations directes et échanges. Elle ne
dépend donc pas d’un vocabulaire prospectif particulier.

## Utiliser les indicateurs

Les indicateurs sont des aides à l’exploration, pas des preuves autonomes.

| Signal | Question à poser |
|---|---|
| beaucoup de liens | la fiche est-elle réellement structurante ? |
| aucun lien | oubli éditorial ou élément autonome ? |
| un seul type voisin | filtre actif ou modèle trop homogène ? |
| déséquilibre des types | choix intentionnel ou corpus incomplet ? |

## Tableau des éléments

Le tableau offre une lecture plus précise que le graphe lorsque les titres sont
longs ou les éléments nombreux. Utilisez-le pour comparer, parcourir et ouvrir
des fiches liées.

## Redimensionnement

La poignée supérieure permet d’ajuster la hauteur. Le bouton de réduction
conserve une barre minimale et rend davantage d’espace au graphe.

## Bon usage en atelier

1. explorer visuellement ;
2. sélectionner une fiche ;
3. lire les indicateurs ;
4. ouvrir les voisins dans le tableau ;
5. revenir au graphe pour reformuler l’hypothèse de navigation.
