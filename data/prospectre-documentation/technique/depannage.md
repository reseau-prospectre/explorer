---
id: architecture:depannage
type: architecture
titre: Dépannage
composant: diagnostic
statut: stable
resume: Tableau de diagnostic des erreurs fréquentes de chargement, graphe, Markdown, images, collaboration et export.
relations:
- type: related_to
  target: architecture:deploiement
- type: related_to
  target: architecture:format-pack
- type: related_to
  target: architecture:securite-temps-reel
- type: related_to
  target: reference:frontmatter
---

# Dépannage

## Diagnostic rapide

| Symptôme | Cause probable | Action |
|---|---|---|
| aucun nœud | manifeste ou Markdown inaccessible | vérifier HTTP et `fichiers` |
| fiche ignorée | `id`, `type` ou titre absent | corriger le front matter |
| type invisible | type absent du schéma | ajouter le type ou corriger `type` |
| relation absente | cible inexistante | comparer les identifiants |
| image cassée | chemin relatif ou asset absent | vérifier chemin et manifeste |
| ZIP incomplet | fichier non chargé dans la session | réimporter puis exporter |
| collaboration inactive | configuration Firebase incomplète | vérifier `app.config.js` |
| rôle admin absent | adresse non déclarée | vérifier `adminEmails` |

## YAML invalide

Les erreurs fréquentes :

```yaml
# Mauvaise indentation
relations:
- type: related_to
 target: guide:accueil
```

Version correcte :

```yaml
relations:
  - type: related_to
    target: guide:accueil
```

Mettre entre guillemets une valeur contenant `:` lorsqu’elle n’est pas un
identifiant simple.

## Image non affichée

Vérifier dans l’ordre :

1. l’extension est prise en charge ;
2. le fichier est listé dans le manifeste ;
3. la casse du chemin correspond ;
4. le chemin part du dossier du Markdown ;
5. l’image est présente dans le ZIP.

## Session incohérente

Le navigateur peut restaurer une session correspondant au même identifiant et à
la même version de pack. Pour forcer le projet canonique :

- réinitialiser l’application depuis le profil ;
- changer la version du manifeste ;
- utiliser un profil navigateur vierge.

## Export à contrôler

Après une évolution du schéma, vérifier que les dossiers exportés correspondent
aux propriétés `folder`. Une collision de chemins ajoute automatiquement un
suffixe.

## Informations utiles à collecter

- URL et navigateur ;
- message de la console ;
- version du pack ;
- manifeste ;
- nom du fichier concerné ;
- étapes exactes ;
- archive minimale reproduisant le problème.
