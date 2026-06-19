---
id: procedure:migrer-pack-v1
type: procedure
titre: Migrer un pack vers le format PROSPECTRE 1.0
audience: responsable de pack
statut: validé
resume: Procédure pour supprimer les conventions implicites et rendre un ancien corpus entièrement piloté par son manifeste.
relations:
- type: related_to
  target: procedure:administrer-modele
- type: related_to
  target: architecture:format-pack
- type: related_to
  target: reference:specification-pack-v1
---

# Migrer un pack vers le format 1.0

## 1. Inventorier les types

Pour chaque valeur de `type`, définir dans `manifest.json` :

- un identifiant stable ;
- les libellés singulier et pluriel ;
- un dossier ;
- une couleur, une taille et un ordre ;
- la visibilité du label ;
- la liste complète des champs.

## 2. Déclarer les références

Toute relation structurelle doit être représentée par un champ
`kind: reference`. Préciser `target`, `multiple` et `required`.

Le champ `relations` reste réservé aux liens libres qui ne correspondent pas
à une propriété stable du type.

## 3. Normaliser les fiches

- conserver `id` et `type` ;
- fournir le champ de titre déclaré par le modèle ;
- remplacer les alias historiques ;
- transformer les objets difficiles à éditer en listes ou références ;
- vérifier que chaque cible existe.

## 4. Isoler les documents techniques

Les modèles, notes de génération et matrices non destinés au graphe peuvent
utiliser les types techniques `template`, `note` ou `relation_set`. Ils ne
doivent pas être ajoutés au modèle visible.

## 5. Tester

1. Charger le pack.
2. Contrôler les filtres et le nombre de nœuds.
3. Ouvrir une fiche de chaque type.
4. Activer le mode édition.
5. Vérifier les relations et les liens profonds.
6. Exporter puis réimporter l’archive.

## 6. Publier

Mettre à jour `format_version`, `version`, `date_generation`, les compteurs et
la liste `fichiers`, puis distribuer l’archive validée.
