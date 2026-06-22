import { escapeHtml } from "../core/utils.js";

export function normalizeSummaryStyle(style) {
  return ["focus", "note", "typing"].includes(style) ? style : "focus";
}

export function summaryStyleLabel(style) {
  return {
    focus: "Signal",
    note: "Note",
    typing: "Typing"
  }[normalizeSummaryStyle(style)];
}

export function renderSummaryCallout(entity, summary) {
  const style = normalizeSummaryStyle(entity?.summary_style);
  const length = Math.max(24, Math.min(220, summary.length));
  return `
    <aside class="entity-summary-card entity-summary-card--${style}" style="--summary-characters:${length}" aria-label="Résumé">
      <div class="entity-summary-card__head">
        <i>${style === "typing" ? "auto_awesome" : "notes"}</i>
        <span>Résumé</span>
      </div>
      <p>${escapeHtml(summary)}</p>
    </aside>
  `;
}

export function renderSummaryStyleChoice(style, activeStyle) {
  const active = normalizeSummaryStyle(activeStyle) === style;
  const icon = style === "typing" ? "auto_awesome" : style === "note" ? "sticky_note_2" : "format_quote";
  return `
    <button type="button" class="summary-style-preview ${active ? "active" : ""}" data-summary-style="${style}" aria-checked="${active}">
      <span class="summary-style-preview__label"><i>${icon}</i>${escapeHtml(summaryStyleLabel(style))}</span>
      <span class="summary-style-preview__card entity-summary-card entity-summary-card--${style}" aria-hidden="true">
        <span class="entity-summary-card__head"><i>${icon}</i><span>Résumé</span></span>
        <span class="summary-style-preview__line">Idée clé de la fiche, prête à être parcourue.</span>
      </span>
    </button>
  `;
}

export function renderEditorModeButton(mode, activeMode, icon, label) {
  const active = mode === activeMode;
  const classes = ["ps-tab", active ? "active is-active" : ""].filter(Boolean).join(" ");
  return `
    <button type="button" class="${classes}" data-editor-mode="${mode}" aria-pressed="${active}" aria-label="${escapeHtml(label)}">
      <i>${icon}</i><span>${escapeHtml(label)}</span>
    </button>
  `;
}
