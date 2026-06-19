---
id: architecture:modules-extension
type: architecture
titre: Modules JavaScript et règles d’extension
composant: moteur applicatif
statut: stable
resume: Découpage des modules ES, responsabilités et règles pour étendre PROSPECTRE sans réintroduire de dépendances métier.
relations:
- type: related_to
  target: architecture:application
- type: related_to
  target: architecture:modele-donnees
- type: related_to
  target: reference:specification-pack-v1
---

# Modules JavaScript et règles d’extension

## Découpage

| Dossier | Responsabilité |
|---|---|
| `core/` | configuration, profil et utilitaires transverses |
| `model/` | schéma, parsing des entités et construction du graphe |
| `graph/` | objets Three.js, textures et labels |
| `services/` | fournisseurs local et Firebase |
| `ui/` | rendu Markdown et composants spécialisés |
| `main.js` | composition, état de session et orchestration des vues |

## Injection des dépendances

Les modules avec effets de bord exposent une fonction de création. L’état et
les callbacks nécessaires sont fournis explicitement. Cette règle évite les
dépendances circulaires et permet de remplacer un service.

## Ajouter une fonctionnalité

1. Identifier le domaine propriétaire.
2. Écrire les transformations pures dans `core/` ou `model/`.
3. Injecter les accès au DOM ou au réseau.
4. Ne laisser dans `main.js` que le branchement des modules.
5. Tester avec le pack documentaire et un second vocabulaire métier.

## Interdictions

- aucun identifiant métier dans le moteur ;
- aucune lecture Firebase dans le modèle ;
- aucune génération HTML non assainie ;
- aucune convention de dossier non déclarée dans le manifeste ;
- aucune mutation silencieuse des identifiants techniques.
