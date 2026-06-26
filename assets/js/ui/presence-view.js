import { escapeHtml } from "../core/utils.js";

export function renderPresenceChips(users, {
  limit = 5,
  currentClientId,
  getNode,
  renderAvatar
} = {}) {
  const chips = users.map((user, index) => {
    const isSelf = user.clientId === currentClientId;
    const node = user.selectedNodeId ? getNode?.(user.selectedNodeId) : null;
    const tip = user.selectedNodeId && !node
      ? `${user.displayName} consulte une fiche absente de votre atlas`
      : node ? `Rejoindre ${user.displayName} · ${node.label}` : `${user.displayName} · disponible`;
    return `<button class="presence-top-chip ps-chip${isSelf ? " self" : ""}${user.selectedNodeId && !node ? " missing-node" : ""}${index >= limit ? " presence-overflow" : ""}" type="button" data-follow="${escapeHtml(user.clientId)}" aria-label="${escapeHtml(tip)}">
      ${renderAvatar?.(user) || ""}
      <span class="tooltip bottom">${escapeHtml(tip)}</span>
    </button>`;
  }).join("");
  return `<span class="presence-avatar-stack ps-avatar-group">${chips}</span>${users.length > limit ? `<button class="presence-more ps-chip" data-expand-presence type="button" aria-label="Afficher les ${users.length - limit} autres coprésences">+${users.length - limit}</button>` : ""}`;
}
