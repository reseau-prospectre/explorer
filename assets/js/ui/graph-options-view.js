import { escapeHtml } from "../core/utils.js";

const LABEL_MODES = [
  ["auto", "Labels utiles", "label_important"],
  ["all", "Tous les labels", "subtitles"],
  ["none", "Sans labels", "label_off"]
];

export function renderGraphOptionsView({
  entries,
  activeTypes,
  enabledCount,
  graphPrefs,
  focusDepth,
  focusSummary,
  focusDepthDisabled
}) {
  return `
    <header class="graph-options-head graph-popover-head">
      <span class="graph-popover-icon"><i>tune</i></span>
      <div>
        <strong>Affichage du graphe</strong>
        <small>${enabledCount}/${entries.length} types visibles · labels, relations et contexte</small>
      </div>
    </header>
    <section class="graph-options-section">
      <div class="graph-options-section-head">
        <p class="graph-options-kicker"><i>category</i>Types d’éléments</p>
        <button class="graph-options-mini" type="button" data-filter-action="all">
          <i>visibility</i>
          <span>Tout afficher</span>
        </button>
      </div>
      <div class="graph-type-grid">
        ${entries.map(([type, config]) => renderTypeToggle(type, config, activeTypes)).join("")}
      </div>
    </section>
    <section class="graph-options-section graph-options-reading">
      <p class="graph-options-kicker"><i>visibility</i>Lecture</p>
      <div class="graph-reading-block">
        <div class="graph-reading-copy">
          <i>subtitles</i>
          <span>
            <strong>Labels</strong>
            <small>Choisit la densité de libellés visibles.</small>
          </span>
        </div>
        <div class="graph-label-mode" role="group" aria-label="Mode d’affichage des labels">
          ${LABEL_MODES.map(([value, label, icon]) => renderLabelModeButton(value, label, icon, graphPrefs.labelMode)).join("")}
        </div>
      </div>
      <div class="graph-option-switches">
        ${renderGraphOptionSwitch("showLinks", "Liens visibles", "Affiche ou masque les relations", "polyline", graphPrefs)}
        ${renderGraphOptionSwitch("showMotion", "Animations", "Active les particules de direction", "auto_awesome_motion", graphPrefs)}
        ${renderGraphOptionSwitch("focusMode", "Mode focus", "Atténue les éléments hors contexte", "center_focus_strong", graphPrefs)}
      </div>
      <label class="graph-depth-control">
        <i class="graph-depth-icon">share</i>
        <span>
          <strong>Voisinage</strong>
          <small data-focus-depth-label>${focusDepthDisabled ? "Sélectionnez un nœud ou un lien pour l’appliquer" : `${focusDepth} niveau${focusDepth > 1 ? "x" : ""} · ${escapeHtml(focusSummary)}`}</small>
        </span>
        <input type="range" min="1" max="5" step="1" value="${focusDepth}" data-focus-depth ${focusDepthDisabled ? "disabled" : ""}>
      </label>
    </section>
    <section class="graph-options-section graph-options-actions">
      <p class="graph-options-kicker"><i>restart_alt</i>Actions</p>
      <span>
        <strong>Réinitialiser la vue</strong>
        <small>Réactive les types, vide la recherche, ferme la fiche et efface les positions libres.</small>
      </span>
      <button class="graph-reset-inline" type="button" data-reset-arm>
        <i>restart_alt</i>
        <span>Réinitialiser</span>
      </button>
    </section>
  `;
}

export function renderQuickTypeFiltersView(entries, activeTypes) {
  return entries.map(([type, config]) => `
    <button class="quick-type-filter${activeTypes.has(type) ? "" : " muted"}" type="button" data-quick-type-filter="${escapeHtml(type)}" aria-pressed="${activeTypes.has(type)}">
      <span class="dot" style="background:${config.color}"></span>
      <span>${escapeHtml(config.label)}</span>
    </button>
  `).join("");
}

function renderTypeToggle(type, config, activeTypes) {
  return `
    <button class="graph-type-toggle${activeTypes.has(type) ? " active" : ""}" type="button" data-type-filter="${escapeHtml(type)}" aria-pressed="${activeTypes.has(type)}">
      <span class="dot" style="background:${config.color}"></span>
      <span>${escapeHtml(config.label)}</span>
    </button>
  `;
}

function renderLabelModeButton(value, label, icon, activeMode) {
  return `
    <button class="${activeMode === value ? "active" : ""}" type="button" data-label-mode="${value}" aria-pressed="${activeMode === value}">
      <i>${icon}</i>
      <span>${label}</span>
    </button>
  `;
}

function renderGraphOptionSwitch(key, label, hint, icon, graphPrefs) {
  return `
    <div class="graph-option-switch">
      <i class="graph-option-icon">${escapeHtml(icon)}</i>
      <span>
        <strong>${escapeHtml(label)}</strong>
        <small>${escapeHtml(hint)}</small>
      </span>
      <label class="switch">
        <input type="checkbox" data-graph-pref="${key}" ${graphPrefs[key] ? "checked" : ""}>
        <span></span>
      </label>
    </div>
  `;
}
