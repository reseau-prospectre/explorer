---
id: guide:fiches-edition
type: guide
titre: Lire et modifier les fiches
audience: utilisateur
statut: validé
resume: Guide de lecture, d’édition locale et de structuration des fiches Markdown.
tags:
- fiche
- édition
- markdown
relations:
- type: related_to
  target: guide:explorer-graphe
- type: related_to
  target: reference:markdown
- type: related_to
  target: reference:frontmatter
- type: related_to
  target: demo:fiche-complete
---

# Lire et modifier les fiches

Une fiche associe des **métadonnées YAML** et un **corps Markdown**. Le YAML
construit le graphe ; le Markdown construit la lecture.

## Mode lecture

Le panneau affiche :

- un résumé court issu des métadonnées ;
- le contenu Markdown rendu ;
- les éléments liés ;
- puis, en pied de fiche, le chemin du fichier et les actions de partage et de
  modification.

Le bouton **Copier le lien** produit une URL profonde vers la fiche courante.
Cette URL peut être partagée : après chargement du même pack, elle ouvre
directement la fiche concernée.

## Liens vers d’autres fiches

Un lien explicite utilise l’identifiant stable de la cible :

```markdown
[Explorer le graphe](entity:guide:explorer-graphe)
```

Dans l’application, ce lien devient un bouton de navigation interne. Employer
ce format pour les parcours, sommaires et renvois dont la destination doit
rester non ambiguë.

## Mode modification

Activez **Modifier localement**. Les changements portent sur le navigateur
courant et sont intégrés au prochain export.

Une alerte sous le commutateur rappelle que l’enregistrement ne synchronise pas
les autres navigateurs : il faut exporter puis partager un nouveau pack.

L’éditeur de contenu propose deux modes sur une même source :

- **WYSIWYG** pour composer visuellement titres, tableaux, listes, tâches,
  images, liens et blocs de code ;
- **Markdown** pour contrôler directement la syntaxe portable.

Le contenu enregistré reste du Markdown, quel que soit le mode utilisé.
Les images locales sont résolues dans l’éditeur, mais leur chemin relatif est
restauré à l’enregistrement afin de préserver la portabilité du pack.

Bonnes pratiques :

1. conserver un titre explicite ;
2. rédiger un résumé autonome ;
3. utiliser des titres de niveau cohérent ;
4. préférer les tableaux pour les données comparables ;
5. réserver les blocs de code aux exemples copiables ;
6. vérifier les images et les relations avant export.

## Images locales

Placez l’image dans le pack et utilisez un chemin relatif au fichier Markdown :

```markdown
![Description accessible](../assets/illustrations/mon-schema.svg)
```

Formats pris en charge : PNG, JPEG, GIF, WebP et SVG. Les fichiers sont chargés
avec le projet et réintégrés dans l’export ZIP.

La première image du contenu est également utilisée comme texture du nœud dans
le graphe. La supprimer ou la remplacer dans l’éditeur met à jour cette texture.
Une URL distante est acceptée si son serveur autorise son chargement par une
application tierce.

## Contenu riche

Pour une démonstration exhaustive, ouvrir **Cheat sheet Markdown** et **Fiche
Markdown complète**.

## Contrôle avant publication

- [ ] Le front matter commence et se termine par `---`.
- [ ] `id`, `type` et `titre` sont présents.
- [ ] L’identifiant est unique.
- [ ] Les relations ciblent des identifiants existants.
- [ ] Les images ont un texte alternatif.
- [ ] Les tableaux restent lisibles dans un panneau étroit.
- [ ] L’export individuel produit un Markdown valide.
