# PROSPECTRE 1.0 — Documentation officielle et laboratoire

Ce dossier est à la fois :

- la documentation complète de l’application ;
- un starter pack importable dans PROSPECTRE ;
- une démonstration d’un modèle métier entièrement personnalisé ;
- un laboratoire des possibilités Markdown et YAML.

Il documente le périmètre stabilisé de la v1, le contrat des packs, la
migration des corpus et l’architecture modulaire du moteur.

## Parcours recommandé

1. Importer le dossier compressé ou son archive ZIP dans PROSPECTRE.
2. Ouvrir la fiche **Bienvenue dans PROSPECTRE**.
3. Parcourir les guides bleus pour apprendre l’usage courant.
4. Parcourir les procédures jaunes pour administrer un projet.
5. Parcourir les fiches vertes pour comprendre l’architecture.
6. Ouvrir **Cheat sheet Markdown** puis **Fiche Markdown complète**.
7. Consulter **PROSPECTRE 1.0 — Capacités et périmètre** et la
   **Spécification d’un pack PROSPECTRE 1.0**.

## Structure

```text
guides/          documentation utilisateur et animation
administration/  administration du modèle et gouvernance
technique/       architecture, sécurité, déploiement et dépannage
references/      spécifications YAML et aide-mémoire Markdown
demos/           contenus conçus pour tester le rendu
assets/          illustrations locales embarquées dans le pack
manifest.json    index, modèle documentaire et liste des fichiers
```

## Principe

Les fichiers Markdown sont la source documentaire. Le front matter YAML décrit
les métadonnées et les relations du graphe. Les illustrations utilisent des
chemins relatifs et restent incluses lors d’un export ZIP.

## Version

Pack documentaire 1.0.0, généré le 11 juin 2026.
