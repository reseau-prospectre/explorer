import { escapeHtml } from "../core/utils.js";

export function renderSchemaTypesView({
  schema,
  entityCounts = new Map(),
  entityCount = 0
}) {
  const sortedTypes = [...schema.types].sort((a, b) => a.order - b.order);
  const rows = sortedTypes.map((type) => {
    const count = entityCounts.get(type.id) || 0;
    return `
      <div class="schema-type-row" data-type-row="${escapeHtml(type.id)}">
        <button class="schema-drag" type="button" aria-label="Déplacer ${escapeHtml(type.label)}" title="Glisser pour réordonner"><i>drag_indicator</i></button>
        <label><span>Nom affiché</span><input data-schema-type="${escapeHtml(type.id)}" data-schema-prop="label" value="${escapeHtml(type.label)}"></label>
        <label><span>Singulier</span><input data-schema-type="${escapeHtml(type.id)}" data-schema-prop="singular" value="${escapeHtml(type.singular)}"></label>
        <label><span>Identifiant technique</span><input value="${escapeHtml(type.id)}" disabled></label>
        <label><span>Dossier</span><input data-schema-type="${escapeHtml(type.id)}" data-schema-prop="folder" value="${escapeHtml(type.folder)}"></label>
        <label class="schema-color-control"><span>Couleur</span><input type="color" data-schema-type="${escapeHtml(type.id)}" data-schema-prop="color" value="${escapeHtml(type.color)}"></label>
        <label class="schema-label-control"><span>Label</span><input type="checkbox" data-schema-type="${escapeHtml(type.id)}" data-schema-prop="showLabel"${type.showLabel ? " checked" : ""} aria-label="Afficher les labels de ce type"></label>
        <span class="schema-count">${count} élément${count > 1 ? "s" : ""}</span>
        <button class="schema-icon-action" data-delete-type="${escapeHtml(type.id)}" type="button" aria-label="Supprimer ce type"><i>delete</i></button>
      </div>
    `;
  }).join("");
  const preview = sortedTypes.map((type) => `
    <span class="schema-filter-preview" data-schema-preview="${escapeHtml(type.id)}" style="--schema-color:${escapeHtml(type.color)}"><span></span>${escapeHtml(type.label)}</span>
  `).join("");
  return `
    <section class="schema-section-head">
      <div><p class="kicker">Vocabulaire métier</p><h2>Types d’éléments</h2><p>Les libellés modifient l’interface. Les identifiants restent stables pour préserver les fichiers.</p></div>
      <button class="primary-button compact-action" data-add-type type="button"><i>add</i>Nouveau type</button>
    </section>
    <div class="schema-dashboard">
      <article class="ps-card ps-surface"><strong>${schema.types.length}</strong><span>types actifs</span></article>
      <article class="ps-card ps-surface"><strong>${schema.types.reduce((sum, type) => sum + type.fields.length, 0)}</strong><span>champs configurés</span></article>
      <article class="ps-card ps-surface"><strong>${entityCount}</strong><span>éléments chargés</span></article>
    </div>
    <div class="schema-types-layout">
      <section class="schema-card schema-type-list ps-card ps-surface">
        <div class="schema-type-columns"><span></span><span>Nom affiché</span><span>Singulier</span><span>Identifiant</span><span>Dossier</span><span>Couleur</span><span>Label</span><span>Contenu</span><span></span></div>
        ${rows || `<p class="empty-state">Aucun type configuré.</p>`}
      </section>
      <aside class="schema-card schema-preview-card ps-card ps-surface">
        <p class="kicker">Aperçu</p>
        <h3>Filtres de l’application</h3>
        <p>Les changements sont visibles après enregistrement.</p>
        <div class="schema-filter-list">${preview}</div>
        <div class="schema-notice"><i>lock</i><span>Les identifiants techniques ne sont pas renommés automatiquement.</span></div>
      </aside>
    </div>
  `;
}

export function renderSchemaFieldsView({
  schema,
  selectedType,
  selectedField,
  fieldKindLabel
}) {
  if (!selectedType) return `<p class="empty-state">Créez d’abord un type d’élément.</p>`;
  const options = schema.types.map((type) => `<option value="${escapeHtml(type.id)}"${type.id === selectedType.id ? " selected" : ""}>${escapeHtml(type.label)}</option>`).join("");
  const fieldRows = selectedType.fields.map((field) => `
    <button class="schema-field-row${field.key === selectedField?.key ? " active" : ""}" data-select-field="${escapeHtml(field.key)}" type="button">
      <i>${field.kind === "reference" ? "link" : field.kind === "select" ? "list" : field.kind === "number" ? "tag" : "text_fields"}</i>
      <span><strong>${escapeHtml(field.label)}</strong><small>${escapeHtml(field.key)}</small></span>
      <em>${escapeHtml(fieldKindLabel(field.kind))}</em>
      <b>${field.required ? "Requis" : "Optionnel"}</b>
    </button>
  `).join("");
  return `
    <section class="schema-section-head">
      <div><p class="kicker">Structure des contenus</p><h2>Champs</h2><p>Configurez le front matter YAML et les formulaires associés.</p></div>
      <label class="schema-type-select"><span>Type édité</span><select data-schema-selected-type>${options}</select></label>
    </section>
    <div class="schema-fields-layout">
      <section class="schema-card schema-fields-list ps-card ps-surface">
        <header><div><h3>${escapeHtml(selectedType.singular)}</h3><p>${selectedType.fields.length} champ${selectedType.fields.length > 1 ? "s" : ""}</p></div><button class="secondary-button compact-action" data-add-field type="button"><i>add</i>Ajouter un champ</button></header>
        <div>${fieldRows || `<p class="empty-state">Aucun champ configuré.</p>`}</div>
      </section>
      ${selectedField ? renderFieldInspector({ schema, field: selectedField, fieldKindLabel }) : `<aside class="schema-card ps-card ps-surface"><p class="empty-state">Sélectionnez ou ajoutez un champ.</p></aside>`}
    </div>
  `;
}

function renderFieldInspector({ schema, field, fieldKindLabel }) {
  const kindOptions = ["text", "textarea", "number", "boolean", "select", "reference"]
    .map((kind) => `<option value="${kind}"${kind === field.kind ? " selected" : ""}>${fieldKindLabel(kind)}</option>`).join("");
  const targetOptions = [`<option value="*"${field.target === "*" ? " selected" : ""}>Tous les types</option>`]
    .concat(schema.types.map((item) => `<option value="${escapeHtml(item.id)}"${field.target === item.id ? " selected" : ""}>${escapeHtml(item.label)}</option>`)).join("");
  const yamlValue = field.kind === "select" ? field.values?.[0] || "valeur"
    : field.kind === "reference" ? `${field.target === "*" ? "type" : field.target}:identifiant`
      : field.kind === "number" ? "2040" : field.kind === "boolean" ? "true" : `"Exemple"`;
  return `
    <aside class="schema-card schema-field-inspector ps-card ps-surface">
      <header><div><p class="kicker">Propriétés du champ</p><h3>${escapeHtml(field.label)}</h3></div><button class="schema-icon-action" data-delete-field="${escapeHtml(field.key)}" type="button"><i>delete</i></button></header>
      <label><span>Libellé</span><input data-field-prop="label" value="${escapeHtml(field.label)}"></label>
      <label><span>Clé YAML</span><input value="${escapeHtml(field.key)}" disabled></label>
      <div class="schema-warning"><i>warning</i>Renommer le libellé ne modifie pas la clé YAML.</div>
      <label><span>Type de champ</span><select data-field-prop="kind">${kindOptions}</select></label>
      <label class="schema-check"><input type="checkbox" data-field-prop="required"${field.required ? " checked" : ""}><span>Champ obligatoire</span></label>
      ${field.kind === "reference" ? `
        <label><span>Type ciblé</span><select data-field-prop="target">${targetOptions}</select></label>
        <label class="schema-check"><input type="checkbox" data-field-prop="multiple"${field.multiple ? " checked" : ""}><span>Autoriser plusieurs références</span></label>
      ` : ""}
      ${field.kind === "select" ? `
        <label><span>Valeurs autorisées <small>une par ligne</small></span><textarea data-field-values>${escapeHtml((field.values || []).join("\n"))}</textarea></label>
      ` : ""}
      <div class="schema-yaml-preview"><span>Aperçu YAML</span><code>${escapeHtml(field.key)}: ${escapeHtml(yamlValue)}</code></div>
    </aside>
  `;
}

export function renderSchemaTransferView(report) {
  return `
    <section class="schema-section-head">
      <div><p class="kicker">Portabilité</p><h2>Import / export du schéma</h2><p>Le schéma est embarqué dans le manifeste des prochains exports de pack.</p></div>
    </section>
    <div class="schema-transfer-grid">
      <section class="schema-card schema-compatibility ps-card ps-surface">
        <p class="kicker">Contrôle de compatibilité</p>
        <div class="schema-score"><strong>${report.score}%</strong><span>compatible avec le projet courant</span></div>
        <div class="schema-dashboard">
          <article><strong>${report.valid}</strong><span>fichiers valides</span></article>
          <article><strong>${report.warnings.length}</strong><span>avertissements</span></article>
          <article><strong>${report.errors.length}</strong><span>erreurs</span></article>
        </div>
        <div class="schema-report-list">
          ${[...report.errors, ...report.warnings].map((item) => `<p class="${item.level}"><i>${item.level === "error" ? "error" : "warning"}</i>${escapeHtml(item.message)}</p>`).join("") || `<p class="success"><i>check_circle</i>Aucune incompatibilité détectée.</p>`}
        </div>
      </section>
      <section class="schema-card schema-transfer-actions">
        <article class="ps-card ps-surface"><i>download</i><div><h3>Exporter le schéma</h3><p>Télécharge un JSON réutilisable dans un autre projet.</p><button class="primary-button compact-action" data-export-schema type="button">Télécharger</button></div></article>
        <article class="ps-card ps-surface"><i>upload</i><div><h3>Importer un schéma</h3><p>Charge une configuration et contrôle sa compatibilité avant enregistrement.</p><button class="secondary-button compact-action" data-import-schema type="button">Choisir un fichier</button></div></article>
        <article class="ps-card ps-surface"><i>inventory_2</i><div><h3>Exporter le pack complet</h3><p>Le manifeste contiendra la version actuellement enregistrée du schéma.</p><button class="secondary-button compact-action" data-export-pack type="button">Exporter le projet</button></div></article>
      </section>
    </div>
  `;
}
