---
id: demo:scenario-atelier
type: demo
titre: Démonstration d’un atelier documentaire
niveau: avancé
statut: prêt à tester
resume: Exemple de projet d’atelier utilisant un modèle générique, des rôles, des décisions, des preuves et un suivi de publication.
relations:
- type: related_to
  target: demo:fiche-complete
- type: related_to
  target: procedure:types-champs
- type: related_to
  target: procedure:cycle-pack
- type: related_to
  target: guide:collaboration
---

# Démonstration d’un atelier documentaire

## Situation

Une équipe prépare un référentiel partagé sur les usages responsables de
l’intelligence artificielle. Elle souhaite relier besoins, principes,
expérimentations, décisions et ressources.

## Modèle possible

| Type | Fonction | Exemple de champ |
|---|---|---|
| Besoin | problème ou objectif | priorité |
| Principe | règle de gouvernance | portée |
| Expérimentation | test documenté | maturité |
| Décision | arbitrage validé | date |
| Ressource | preuve ou méthode | source |

Cette structure peut être créée depuis **Configurer les types et les champs**.

## Déroulé en 90 minutes

### 1. Cadrage — 15 minutes

- rappeler l’objectif ;
- présenter les types et les conventions ;
- répartir les participants.

### 2. Exploration — 20 minutes

Chaque groupe filtre le graphe et identifie :

- une zone dense ;
- une zone sans relation ;
- une contradiction ;
- une information manquante.

### 3. Contribution — 30 minutes

Les groupes rédigent ou complètent les fiches, puis utilisent les échanges pour
justifier les relations proposées.

### 4. Arbitrage — 15 minutes

L’animateur ouvre les fiches concernées et consigne les décisions dans le
Markdown, sans confondre commentaire temporaire et contenu publié.

### 5. Clôture — 10 minutes

- vérifier le rapport de compatibilité ;
- exporter le pack ;
- attribuer une version ;
- archiver la session.

## Livrables

```text
referentiel-ia_v1.1.0.zip
journal-decisions.md
rapport-validation.json
```

## Critères de réussite

- les participants retrouvent une information en moins d’une minute ;
- chaque relation importante peut être justifiée ;
- le pack se réimporte sans perte ;
- le vocabulaire est compris sans dépendre de l’équipe de conception ;
- la publication distingue clairement brouillon, discussion et contenu validé.

> Cette démonstration illustre que PROSPECTRE n’est pas limité à la prospective :
> tout corpus de fiches typées et reliées peut constituer un projet.
