# NEO — Master Ingénierie pédagogique numérique

Ce pack rend explorable dans PROSPECTRE le Master MEEF PIF, parcours
Ingénierie pédagogique numérique NEO.

## Contenu

- 1 formation ;
- 4 semestres ;
- 4 blocs de connaissances et de compétences ;
- 20 apprentissages critiques ;
- 75 niveaux de compétence ;
- 15 unités d’enseignement ;
- 49 modules ;
- 15 situations d’apprentissage et d’évaluation.

Total : **183 fiches**.

## Modèle du graphe

Le graphe articule :

```text
Formation → Semestres → UE → Modules
                     ↘ SAE

Formation → BCC → Apprentissages critiques → Niveaux
                 UE/SAE ↗
```

Les champs de référence du front matter construisent les liens. Le modèle est
entièrement déclaré dans `manifest.json > modele`.

## Fidélité

Les intitulés, BCC, modules, SAE, volumes, ECTS, niveaux et descripteurs
proviennent des documents NEO fournis. Les livrables et modalités proposés dans
les fiches SAE sont explicitement signalés comme propositions.

## Ouvrir dans PROSPECTRE

- ouvrir directement :

```text
index.html?project=./data/neo/manifest.json
```

## Contrat

Pack conforme au format PROSPECTRE. Les identifiants sont stables,
les dossiers d’export sont déclarés dans le modèle et tous les fichiers
indexables sont listés dans le manifeste.
