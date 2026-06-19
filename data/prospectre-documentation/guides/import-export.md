---
id: guide:import-export
type: guide
titre: Importer et exporter
audience: utilisateur
statut: validé
resume: Choisir entre import de fichiers, archive ZIP, export d’une fiche et export complet du projet.
tags:
- import
- export
- zip
relations:
- type: related_to
  target: guide:premiers-pas
- type: related_to
  target: procedure:cycle-pack
- type: related_to
  target: architecture:format-pack
---

# Importer et exporter

PROSPECTRE travaille avec deux unités : la **fiche Markdown** et le **pack de
projet**.

## Importer

| Source | Usage |
|---|---|
| fichier `.md` | ajouter ou remplacer une fiche |
| image locale | ajouter un asset utilisé par un Markdown |
| archive `.zip` | charger un projet complet avec manifeste et arborescence |

Lorsqu’un manifeste importé porte un autre identifiant de projet, l’application
propose de remplacer le projet courant.

En cas de chemin identique, une confirmation est demandée avant remplacement.

## Exporter une fiche

L’export individuel télécharge le Markdown de la fiche sélectionnée. Il convient
pour :

- relire ou versionner une fiche ;
- partager une unité éditoriale ;
- comparer deux variantes ;
- réintégrer la fiche dans un autre outil.

Les images ne sont pas incluses dans cet export individuel.

## Exporter le projet

L’export complet génère un ZIP contenant :

- tous les Markdown ;
- les images locales ;
- le manifeste mis à jour ;
- le schéma administré ;
- les commentaires et l’activité dans `contributions/`.

Les dossiers configurés dans l’administration du modèle sont appliqués à
l’export.

## Convention de sauvegarde

Nom conseillé :

```text
nom-projet_YYYY-MM-DD_vMAJEURE.MINEURE.CORRECTIF.zip
```

Exemple :

```text
prospective-campus_2026-06-11_v1.3.0.zip
```

## Contrôle après export

1. Décompresser l’archive dans un dossier temporaire.
2. Vérifier la présence de `manifest.json`.
3. Comparer la liste `fichiers` avec le contenu réel.
4. Vérifier une image et un Markdown.
5. Réimporter le ZIP dans une session de test.
