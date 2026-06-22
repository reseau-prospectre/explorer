---
id: "recette:base-rag-minimale"
type: "recette"
titre: "Base RAG minimale"
resume: "Donner à un agent les connaissances essentielles sans lui faire avaler toute l’application."
liens:
- "prompt:rag-prospectre"
- "coulisse:format-d-un-pack"
---
# Base RAG minimale

Un agent qui fabrique des packs PROSPECTRE doit connaître peu de choses, mais les connaître exactement.

| Connaissance | Pourquoi elle compte |
| --- | --- |
| Un pack est un dossier | Le résultat doit être transportable. |
| Le manifeste déclare le modèle | Sans modèle, le graphe n’a pas de grammaire. |
| Les fiches sont en Markdown | Le contenu reste lisible hors application. |
| Les références deviennent des liens | Un identifiant faux casse la carte. |
| Les titres visibles sont humains | Le graphe se lit avant de s’expliquer. |
| La granularité est une décision | Tout extraire produit rarement un bon graphe. |

Un prompt qui oublie ces six points demande à l’agent de deviner l’application. Il le fera. Avec assurance. C’est le problème.
