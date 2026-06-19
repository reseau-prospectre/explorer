---
id: procedure:permissions
type: procedure
titre: Permissions et gouvernance
audience: administrateur
statut: validé
resume: Modèle de rôles, configuration des administrateurs et règles de gouvernance éditoriale.
relations:
- type: related_to
  target: guide:collaboration
- type: related_to
  target: architecture:securite-temps-reel
- type: related_to
  target: procedure:cycle-pack
---

# Permissions et gouvernance

PROSPECTRE distingue les capacités locales, les capacités collaboratives et les
droits administrateur.

## Rôles pratiques

| Rôle | Capacités recommandées |
|---|---|
| lecteur | explorer, filtrer, rechercher et exporter une fiche |
| contributeur | commenter, répondre et réagir |
| éditeur | modifier localement les Markdown et préparer un export |
| responsable de pack | valider le contenu et publier les archives |
| administrateur | modifier le schéma et modérer les contributions |

Ces rôles sont une convention de gouvernance. L’application implémente surtout
la distinction administrateur / non-administrateur pour les fonctions sensibles.

## Déclarer les administrateurs

Dans `app.config.js` :

```js
window.APP_CONFIG = {
  realtime: {
    adminEmails: [
      "administrateur@example.org"
    ]
  }
};
```

Comparer les adresses en minuscules et retirer rapidement les comptes qui ne
doivent plus disposer du rôle.

## Gouvernance éditoriale

Séparer trois responsabilités :

1. **modèle** : types, champs, relations et conventions ;
2. **contenu** : rédaction et validation des fiches ;
3. **publication** : version, archive, test et diffusion.

Une même personne peut cumuler les rôles dans un petit projet, mais les étapes
doivent rester distinctes.

## Règles Firebase

Les règles de Realtime Database doivent contrôler :

- qui peut écrire une présence ;
- qui peut créer ou modifier une contribution ;
- qui peut restaurer ou supprimer définitivement ;
- quelles propriétés sont acceptées.

> Les contrôles dans l’interface améliorent l’expérience ; les règles Firebase
> garantissent la sécurité.

## Journal de décision

Pour chaque évolution importante du modèle, conserver :

- date et auteur ;
- objectif ;
- types et champs concernés ;
- stratégie de migration ;
- résultat des tests ;
- version publiée.
