---
id: architecture:securite-temps-reel
type: architecture
titre: Sécurité et temps réel
composant: Firebase
statut: stable
resume: Périmètre des données distantes, authentification, droits administrateur et règles de sécurité.
relations:
- type: related_to
  target: architecture:application
- type: related_to
  target: guide:collaboration
- type: related_to
  target: procedure:permissions
- type: related_to
  target: architecture:depannage
---

# Sécurité et temps réel

## Modes

**Local**
: aucune dépendance Firebase. Les données restent dans le navigateur.

**Anonyme Firebase**
: présence et contributions synchronisées avec une identité locale.

**Google**
: profil authentifié et détection éventuelle du rôle administrateur.

## Données distantes

| Donnée | Firebase |
|---|---:|
| Markdown et images | non |
| schéma du pack | non |
| profil public | oui |
| présence et sélection | oui |
| commentaires et réponses | oui |
| réactions | oui |
| activité sociale | oui |

## Configuration

Les paramètres publics du client Firebase se trouvent dans `app.config.js`.
Ils ne sont pas des secrets. La sécurité repose sur l’authentification et les
règles de base de données.

## Administration

Le rôle administrateur est déterminé à partir de l’adresse Google et de
`adminEmails`. Les opérations sensibles doivent aussi être interdites par les
règles Firebase.

## Menaces à considérer

- écriture directe dans la base sans passer par l’interface ;
- usurpation de champs non validés ;
- volumétrie excessive de commentaires ;
- contenu Markdown malveillant ;
- import d’archives très volumineuses ;
- liens externes trompeurs.

## Mesures

- assainir le HTML Markdown ;
- limiter les propriétés autorisées dans Firebase ;
- limiter taille et fréquence des écritures ;
- valider les types de données ;
- conserver des sauvegardes ;
- révoquer rapidement les administrateurs obsolètes.

## Confidentialité

Ne placez pas de données sensibles dans les commentaires. Les contenus du pack
peuvent être exportés et partagés ; ils doivent suivre la politique documentaire
du projet.
