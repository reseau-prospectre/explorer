---
id: guide:profil-preferences
type: guide
titre: Profil, préférences et données locales
audience: utilisateur
statut: validé
resume: Configurer son identité, son avatar, le thème, la coprésence et comprendre la réinitialisation locale.
tags:
- profil
- thème
- stockage local
relations:
- type: related_to
  target: guide:collaboration
- type: related_to
  target: guide:analyses-reperes
- type: related_to
  target: architecture:securite-temps-reel
---

# Profil, préférences et données locales

Le bouton d’avatar ouvre les préférences de l’utilisateur courant.

## Identité

Il est possible de modifier :

- le nom affiché ;
- les initiales ;
- la couleur ;
- l’utilisation de la photo Google lorsqu’un compte est connecté.

En mode local ou anonyme, ces choix sont enregistrés dans le navigateur.

## Thème

Trois options sont disponibles :

| Option | Comportement |
|---|---|
| Système | suit le réglage clair ou sombre du système |
| Clair | impose le thème clair |
| Sombre | impose le thème sombre |

Tester les fiches riches dans les deux thèmes, particulièrement les images,
tableaux et blocs de code.

## Connexion

Le panneau distingue :

- **Local** : aucune synchronisation distante ;
- **Coprésence** : connexion Firebase anonyme ;
- **Google** : identité authentifiée ;
- **Google · admin** : compte présent dans `adminEmails`.

## Données conservées localement

- pack et modifications de la session ;
- profil et thème ;
- brouillons de commentaires ;
- activité lue ;
- activation de la coprésence.

La capacité dépend du navigateur. Les images volumineuses peuvent augmenter
fortement l’espace utilisé.

## Réinitialiser

Le bouton de réinitialisation supprime les données locales de PROSPECTRE et
recharge l’application.

Avant de l’utiliser :

- [ ] exporter le projet ;
- [ ] vérifier que les modifications sont dans le ZIP ;
- [ ] conserver les contributions nécessaires ;
- [ ] noter la configuration de profil utile.

> La réinitialisation locale ne supprime pas les données déjà enregistrées dans
> Firebase par d’autres utilisateurs.
