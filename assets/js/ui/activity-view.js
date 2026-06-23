import { escapeHtml, shortLabel } from "../core/utils.js";

export function renderActivityItem(item, {
  renderAvatar,
  renderRelativeTime,
  renderReaction,
  reactions = []
} = {}) {
  const labels = {
    comment: "a commenté",
    reply: "a répondu"
  };
  return `<button class="activity-item ps-card ps-surface" type="button" data-activity-id="${escapeHtml(item.id)}">
    <span class="activity-timeline-dot" aria-hidden="true"></span>
    ${renderAvatar?.({ actorId: item.actorId, avatar: item.actorAvatar, photoURL: item.actorPhotoURL, color: item.actorColor }) || ""}
    <span class="activity-copy ps-meta-item">
      <span class="activity-title"><strong>${escapeHtml(item.actorName || "Anonyme")} ${escapeHtml(labels[item.type] || "a interagi")}</strong>${renderRelativeTime?.(item.createdAt, "time") || ""}</span>
      <span class="activity-entity">${escapeHtml(item.entityLabel || "Élément")}</span>
      ${item.text ? `<span class="activity-message">${escapeHtml(item.text)}</span>` : ""}
      ${reactions.length ? `<span class="activity-reactions">${reactions.map((reaction) => `<span>${renderReaction?.(reaction) || ""}${reaction.count ? `<strong>${reaction.count}</strong>` : ""}</span>`).join("")}</span>` : ""}
    </span>
  </button>`;
}

export function renderTrashItem(comment, {
  entityLabel,
  renderRelativeTime
} = {}) {
  return `
    <article class="trash-item ps-card ps-surface">
      <div><strong>${escapeHtml(comment.displayName || "Anonyme")}</strong><span>${escapeHtml(entityLabel || comment.entityId)}</span></div>
      <p>${escapeHtml(shortLabel(comment.text || "", 160))}</p>
      <small>Supprimé par ${escapeHtml(comment.deletedByName || "administrateur")} · ${renderRelativeTime?.(comment.deletedAt, "span") || ""}</small>
      <div class="comment-actions ps-action-row">
        <button class="ps-button" type="button" data-restore-comment="${escapeHtml(comment.id)}"><i>restore</i>Restaurer</button>
        <button class="ps-button" type="button" data-purge-comment="${escapeHtml(comment.id)}"><i>delete_forever</i>Supprimer définitivement</button>
      </div>
    </article>
  `;
}
