---
id: demo:fiche-complete
type: demo
titre: Fiche Markdown complète
niveau: intermédiaire
statut: prêt à tester
resume: Démonstration visuelle des titres, tableaux, images, citations, listes, checklists, liens et blocs de code.
relations:
- type: related_to
  target: reference:markdown
- type: related_to
  target: guide:fiches-edition
- type: related_to
  target: demo:scenario-atelier
---

# Fiche Markdown complète

Cette fiche est conçue pour tester visuellement le rendu Markdown de
PROSPECTRE. Elle peut être dupliquée comme modèle.

![Capacités Markdown de PROSPECTRE](../assets/illustrations/markdown-capacites.svg)

## Résumé exécutif

> Un bon contenu combine une structure lisible, des données comparables, des
> exemples copiables et des relations explicites.

Le rendu accepte **l’emphase**, *l’italique*, le `code en ligne`, les
~~informations retirées~~ et les [liens externes](https://spec.commonmark.org/).

## Indicateurs

| Indicateur | Valeur | État | Commentaire |
|---|---:|:---:|---|
| Fiches documentaires | 20 | OK | corpus complet |
| Types personnalisés | 5 | OK | modèle autonome |
| Illustrations locales | 4 | OK | SVG embarqués |
| Export portable | oui | OK | Markdown, YAML et assets |

## Plan d’action

1. cadrer le besoin ;
2. créer le schéma ;
3. produire un échantillon ;
4. valider les relations ;
5. publier une version.

### Checklist

- [x] titre explicite ;
- [x] résumé autonome ;
- [x] image avec texte alternatif ;
- [x] tableau lisible ;
- [ ] validation par le responsable de publication.

## Exemple YAML

```yaml
---
id: demo:exemple
type: demo
titre: Exemple de démonstration
niveau: débutant
statut: prêt à tester
relations:
  - type: related_to
    target: reference:markdown
---
```

## Exemple JavaScript

```js
const entity = state.entities.get("demo:exemple");
console.log(entity.label);
```

## Deux colonnes simulées par un tableau

| À faire | À éviter |
|---|---|
| sections courtes | mur de texte |
| liens explicites | URL non contextualisée |
| tableau comparatif | prose longue dans chaque cellule |
| image locale versionnée | dépendance à une image temporaire |

---

## Conclusion

Cette fiche doit rester lisible dans un panneau étroit et dans les thèmes sombre
et clair. La **Cheat sheet Markdown** fournit les syntaxes copiables.
