import { TYPE_CONFIG } from "../core/config.js";
import { escapeHtml, getId } from "../core/utils.js";
import { looksLikeHtml } from "./content-format.js";

export function getEntityRenderFormat(entity) {
  return entity?.content_format === "html" && looksLikeHtml(entity?.body) ? "html" : "markdown";
}

export function getVisibleEntitySummary(entity, { isMoodleHtmlEntity } = {}) {
  if (!entity?.summary) return "";
  if (entity.summary_enabled === false) return "";
  if (isMoodleHtmlEntity?.(entity) && entity.summary_enabled !== true) return "";
  return entity.summary;
}

export function renderEntityReadView({
  entity,
  summaryHtml = "",
  contentHtml = "",
  relatedHtml = ""
}) {
  return `
    <article class="readable-card entity-read-card ps-card ps-surface">
      <button class="card-hover-action ps-icon-button" type="button" data-entity-edit-action aria-label="Modifier cette fiche">
        <i>edit</i>
      </button>
      ${summaryHtml}
      <div class="rendered-content ps-card__body">${contentHtml}</div>
    </article>
    ${relatedHtml ? `<section class="meta-section relation-section ps-card ps-surface"><h3>Éléments liés</h3>${relatedHtml}</section>` : ""}
    <footer class="reading-actions reading-footer">
      <span class="quiet">${escapeHtml(entity.path || "")}</span>
      <div class="reading-footer-actions ps-action-row">
        <div class="edit-toggle">
          <i>edit</i>
          <span>Modifier</span>
          <label class="ps-switch" aria-label="Modifier cette fiche sur cet appareil">
            <input id="edit-toggle" type="checkbox">
            <span class="ps-switch__track" aria-hidden="true"><span class="ps-switch__thumb"></span></span>
          </label>
          <span class="tooltip top">Modifier cette fiche sur cet appareil</span>
        </div>
        <button class="comment-permalink fiche-permalink ps-icon-button" data-copy-entity-link="${escapeHtml(entity.id)}" type="button" aria-label="Copier le lien de cette fiche">
          <i>link</i>
          <span class="tooltip top">Copier le lien</span>
        </button>
      </div>
    </footer>
  `;
}

export function renderInlineRelations(entity, {
  links = [],
  entities
} = {}) {
  const items = [];
  for (const link of links) {
    const otherId = getId(link.source) === entity.id ? getId(link.target) : getId(link.source);
    const other = entities?.get(otherId);
    if (!other || items.some((item) => item.id === other.id)) continue;
    items.push(other);
  }
  if (!items.length) return "";
  return `<div class="relation-chips ps-action-row">${items.slice(0, 24).map(inlineEntityButton).join("")}</div>`;
}

function inlineEntityButton(entity) {
  const color = TYPE_CONFIG[entity.type]?.color || "#9aa6ad";
  return `<button class="inline-entity ps-chip" data-node="${escapeHtml(entity.id)}" type="button">
    <span class="dot" style="background:${color}"></span>${escapeHtml(entity.label)}
  </button>`;
}
