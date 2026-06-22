---
id: "coulisse:url-preview-eldoom"
type: "coulisse"
titre: "URL de prévisualisation eldoom"
resume: "Chaque CSV public peut être ouvert dans eldoom CBE via le paramètre hash mode=preview."
liens:
- "geste:ouvrir-un-csv"
---
# URL de prévisualisation eldoom

La règle utilisée par ce pack est :

```text
https://eldoomcbe.github.io/cf/#mode=preview&file={URL_CSV_ENCODEE}
```

Exemple :

```text
https://eldoomcbe.github.io/cf/#mode=preview&file=https%3A%2F%2Feldoomcbe.github.io%2F_mcf_APC%2Fmcf_%25F0%259F%25A4%25B9%2520Approche%2520Par%2520Comp%25C3%25A9tence_lite.csv
```

Cette règle permet de garder un seul catalogue PROSPECTRE et d'ouvrir chaque fichier dans l'interface qui lui a donné naissance.
