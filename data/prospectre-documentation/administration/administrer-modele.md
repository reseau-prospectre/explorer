---
id: procedure:administrer-modele
type: procedure
titre: Administrer le modèle
audience: administrateur
statut: validé
resume: Vue d’ensemble de l’espace d’administration et méthode de publication d’une évolution du schéma.
relations:
- type: related_to
  target: procedure:types-champs
- type: related_to
  target: procedure:permissions
- type: related_to
  target: procedure:cycle-pack
- type: related_to
  target: reference:frontmatter
---

# Administrer le modèle

L’administration rend le vocabulaire et la structure du projet modifiables sans
changer le code de l’application.

## Accès

Ouvrir **Importer / exporter**, puis **Administrer le modèle**.

Les types peuvent être réordonnés en faisant glisser leur poignée. Cet ordre
pilote celui des filtres, des légendes et des exports de schéma.

## Enregistrer ou publier

**Enregistrer** applique le modèle dans le navigateur courant et l’intègre aux
prochains exports. Cette action ne peut pas, à elle seule, modifier les sessions
déjà ouvertes sur d’autres appareils.

Une publication collective nécessite un support partagé :

1. déposer le pack ou son manifeste versionné sur un serveur, un dépôt ou une
   API disposant de droits d’écriture ;
2. faire vérifier cette version par les clients, par polling ou lors du
   chargement ;
3. utiliser Firebase, WebSocket ou un autre canal partagé pour afficher
   immédiatement une notification de mise à jour ;
4. demander confirmation avant de remplacer les modifications locales non
   exportées.

Sans serveur, base ou dépôt partagé, l’administrateur peut distribuer un nouvel
export, mais ne peut ni écraser à distance les contenus des autres navigateurs
ni leur pousser une notification.

- en mode local, l’administration est disponible ;
- avec un compte Google, l’adresse doit être déclarée dans `adminEmails` ;
- un compte Google non administrateur peut consulter le projet mais ne peut pas
  ouvrir l’espace d’administration.

## Sections

| Section | Responsabilité |
|---|---|
| Types d’éléments | libellés, couleurs, dossiers, création et suppression |
| Champs | structure YAML, obligation, listes de valeurs et références |
| Import / export | portabilité du schéma et contrôle de compatibilité |

## Distinction fondamentale

**Libellé métier**
: texte visible dans les filtres et panneaux. Il peut évoluer.

**Identifiant technique**
: valeur de `type` stockée dans les Markdown. Il reste stable.

**Clé YAML**
: nom technique d’un champ. Elle reste stable sauf migration explicite.

> Renommer « Scénarios » en « Futurs possibles » ne doit pas transformer
> automatiquement `type: scenario`.

## Workflow recommandé

1. Exporter une sauvegarde du projet.
2. Ouvrir l’administration.
3. Effectuer les changements dans le brouillon.
4. Examiner l’aperçu et le rapport de compatibilité.
5. Enregistrer le schéma.
6. Vérifier filtres, couleurs et fiches.
7. Exporter une nouvelle version du pack.

## Version du schéma

Chaque enregistrement incrémente le numéro correctif du schéma. Une évolution
plus importante doit également être documentée dans la version du pack.

## Changements à faible risque

- modifier un libellé ;
- modifier une couleur ;
- ajouter un champ facultatif ;
- ajouter une valeur à une liste ;
- ajouter un type encore inutilisé.

## Changements à fort risque

- supprimer un type employé ;
- rendre obligatoire un champ absent ;
- retirer une valeur déjà utilisée ;
- modifier un dossier sans tester l’export ;
- changer une clé YAML dans les fichiers.

La procédure **Types et champs** détaille les contrôles.
