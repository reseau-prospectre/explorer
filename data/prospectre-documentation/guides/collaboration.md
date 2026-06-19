---
id: guide:collaboration
type: guide
titre: Collaboration et activité
audience: animateur
statut: validé
resume: Fonctionnement de la coprésence, des commentaires, des réactions et du fil d’activité.
tags:
- collaboration
- commentaires
- firebase
relations:
- type: related_to
  target: architecture:securite-temps-reel
- type: related_to
  target: procedure:permissions
- type: related_to
  target: guide:fiches-edition
---

# Collaboration et activité

La collaboration est optionnelle. Sans Firebase, PROSPECTRE reste une
application locale complète. Avec Firebase, une couche sociale se superpose au
projet sans envoyer les Markdown dans la base distante.

## Activer la coprésence

1. Ouvrir le profil.
2. Activer **Coprésence**.
3. Utiliser une identité anonyme ou se connecter avec Google.
4. Vérifier le point d’état et le nombre de personnes en ligne.

Les avatars indiquent la fiche consultée par chaque personne.

## Commenter

Dans l’onglet **Échanges** d’une fiche :

- rédiger un commentaire ;
- répondre dans un fil ;
- ajouter une réaction ;
- copier le lien d’un échange avec le bouton placé à côté de son horodatage ;
- retrouver l’activité non vue dans le panneau dédié.

Les brouillons sont conservés localement jusqu’à l’envoi.

Le lien copié contient l’identifiant de la fiche, ouvre automatiquement l’onglet
**Échanges** et met en évidence la contribution ciblée. Le destinataire doit
avoir accès au même pack et, pour un échange synchronisé, au même projet
Firebase.

## Animation d’un atelier

| Moment | Usage recommandé |
|---|---|
| ouverture | demander à chacun de choisir une identité reconnaissable |
| exploration | observer les présences sur les nœuds |
| discussion | centraliser les remarques dans la fiche concernée |
| arbitrage | employer réactions et réponses plutôt que multiplier les fils |
| clôture | exporter le pack et les contributions |

## Modération

Un utilisateur peut supprimer ses propres contributions. Un administrateur peut
accéder à la corbeille, restaurer ou supprimer définitivement.

> Les droits applicatifs doivent être complétés par les règles Firebase. Une
> interface masquée ne constitue jamais une protection serveur.

## Données synchronisées

Sont synchronisés : profil public, présence, sélection courante, commentaires,
réponses, réactions et activité.

Ne sont pas synchronisés : fichiers Markdown, images du pack, brouillons
d’édition des fiches et exports.
