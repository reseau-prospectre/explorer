---
id: guide:nouveautes-v1
type: guide
titre: PROSPECTRE 1.0 — Capacités et périmètre
audience: tous
statut: validé
tags:
- version 1.0
- MVP
- fonctionnalités
resume: Synthèse du périmètre fonctionnel stabilisé et des garanties de la première version de PROSPECTRE.
relations:
- type: related_to
  target: guide:accueil
- type: related_to
  target: architecture:application
- type: related_to
  target: reference:specification-pack-v1
---

# PROSPECTRE 1.0

La version 1.0 stabilise PROSPECTRE comme application statique générique
d’exploration, d’édition et de partage de corpus Markdown reliés.

## Capacités livrées

- import et export de packs ZIP ;
- modèle métier administrable depuis l’interface ;
- filtres, couleurs, tailles, labels et dossiers pilotés par le manifeste ;
- graphe 3D, recherche, navigation contextuelle et liens profonds ;
- fiches Markdown enrichies, tableaux, images et listes de tâches ;
- éditeur visuel et source Markdown ;
- utilisation de la première image comme texture de nœud ;
- commentaires, réactions, activité et coprésence avec Firebase ;
- profil local ou Google ;
- analyses contextuelles et distribution des types ;
- fonctionnement local sans serveur applicatif.

## Garantie principale

Le moteur ne contient aucun vocabulaire métier prédéfini. Les mots
« Guides », « Variables », « Scénarios » ou tout autre type proviennent du
pack actif.

## Limites assumées

- les modifications éditoriales restent locales jusqu’à l’export du pack ;
- Firebase synchronise les échanges, pas les fichiers Markdown ;
- la publication d’un nouveau corpus commun relève du déploiement ou de la
  distribution d’un nouveau pack ;
- l’application dépend de bibliothèques chargées par CDN.

## Contrat v1

Un pack conforme contient un `manifest.json`, un modèle, une liste de fichiers
et des fiches Markdown identifiées. La spécification complète est disponible
dans **Spécification d’un pack PROSPECTRE 1.0**.
