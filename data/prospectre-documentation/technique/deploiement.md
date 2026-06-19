---
id: architecture:deploiement
type: architecture
titre: Déploiement
composant: hébergement statique
statut: stable
resume: Procédure de lancement local, publication statique, configuration Firebase et contrôles de mise en production.
relations:
- type: related_to
  target: architecture:application
- type: related_to
  target: architecture:securite-temps-reel
- type: related_to
  target: architecture:depannage
- type: related_to
  target: procedure:cycle-pack
---

# Déploiement

## Lancement local

Depuis la racine :

```powershell
python -m http.server 8080
```

Puis ouvrir :

```text
http://localhost:8080/index.html
```

Un serveur HTTP est nécessaire : l’ouverture directe en `file://` peut bloquer
les chargements de fichiers et modules.

## Hébergement

L’application peut être déposée sur :

- GitHub Pages ;
- GitLab Pages ;
- Firebase Hosting ;
- Netlify ;
- serveur web institutionnel ;
- stockage statique avec diffusion HTTP.

## Prérequis

- HTTPS pour l’authentification et certains navigateurs ;
- accès aux CDN déclarés dans `index.html` ;
- types MIME corrects pour `.js`, `.json`, `.md` et `.svg` ;
- cache invalidé lors d’une mise à jour des assets.

## Projet par défaut

La constante `DEFAULT_PROJECT_MANIFEST_URL` désigne le manifeste chargé au
démarrage. Pour publier un autre projet canonique, modifier cette URL ou
remplacer le contenu du dossier ciblé.

Pour ouvrir ponctuellement un autre pack hébergé sur le même site :

```text
index.html?project=./data/prospectre-documentation/manifest.json
```

Une fiche peut être ouverte directement avec son identifiant :

```text
index.html?project=./data/prospectre-documentation/manifest.json&select=guide:accueil
```

## Firebase

1. créer ou choisir un projet Firebase ;
2. activer Realtime Database ;
3. activer l’authentification anonyme et Google si nécessaire ;
4. renseigner `app.config.js` ;
5. déployer `firebase.database.rules.json` ;
6. ajouter les domaines autorisés ;
7. tester un compte utilisateur et un administrateur.

## Checklist de production

- [ ] La page se charge sans erreur console.
- [ ] Le manifeste répond avec un code HTTP 200.
- [ ] Tous les fichiers listés sont accessibles.
- [ ] Le graphe contient le nombre attendu de nœuds.
- [ ] Une image locale s’affiche.
- [ ] Import et export ZIP fonctionnent.
- [ ] Les règles Firebase refusent une opération interdite.
- [ ] Le responsive est vérifié.
