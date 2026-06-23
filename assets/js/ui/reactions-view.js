import { escapeHtml } from "../core/utils.js";

export function getEntityReactions(entityId, { commentsByEntity, entityReactions, authUid }) {
  const anchor = (commentsByEntity[entityId] || []).find((comment) => comment.systemKind === "entity-reactions");
  if (anchor) return getReactionGroups(anchor, { authUid });
  return getReactionGroups(entityReactions?.[entityId] || {}, { authUid });
}

export function getCommentReactions(comment, { authUid }) {
  return getReactionGroups(comment, { authUid });
}

export function getReactionGroups(source = {}, { authUid } = {}) {
  const groups = new Map();
  const add = (reaction, entries, isDefault = false) => {
    if (!reaction?.emoji) return;
    const values = Object.entries(entries || {});
    const count = values.filter(([, value]) => !value?.isAdmin).length;
    const selected = Boolean(authUid && entries?.[authUid]);
    const current = groups.get(reaction.emoji) || {
      emoji: reaction.emoji,
      annotation: reaction.annotation || "",
      count: 0,
      selected: false,
      isDefault: false
    };
    current.count = Math.max(current.count, count);
    current.selected ||= selected;
    current.isDefault ||= isDefault;
    groups.set(reaction.emoji, current);
  };
  if (source.likes && Object.keys(source.likes).length) add({ emoji: "👍", annotation: "pouce levé" }, source.likes);
  Object.values(source.defaultReactions || {}).forEach((reaction) => add(reaction, null, true));
  Object.values(source.reactions || {}).forEach((entries) => {
    const reaction = Object.values(entries || {})[0];
    if (reaction?.emoji) add(reaction, entries);
  });
  return [...groups.values()];
}

export function emojiToId(emoji) {
  return [...emoji].map((char) => char.codePointAt(0).toString(16)).join("-");
}

export function reactionEmojiMarkup(reaction) {
  return `<span class="reaction-emoji">${escapeHtml(reaction?.emoji || "")}</span>`;
}

export function renderEntityReactionBlock(entityId, reactions) {
  return `
    <div class="entity-reaction-head">
      <span>Réactions</span>
      <button class="entity-reaction-add" data-entity-reaction-picker="${escapeHtml(entityId)}" type="button" aria-label="Ajouter une réaction">
        <i>add_reaction</i><span>Ajouter</span>
      </button>
    </div>
    <div class="reaction-bar compact-reactions${reactions.length ? "" : " empty"}">
      ${reactions.length
        ? reactions.map((reaction) => entityReactionButtonMarkup(entityId, reaction)).join("")
        : `<small>Aucune réaction pour le moment.</small>`}
    </div>
  `;
}

function entityReactionButtonMarkup(entityId, reaction) {
  return `<button class="reaction-button${reaction.selected ? " active" : ""}${reaction.isDefault ? " default-reaction" : ""}" data-entity-reaction="${escapeHtml(reaction.emoji)}" data-annotation="${escapeHtml(reaction.annotation || "")}" data-entity-id="${escapeHtml(entityId)}" type="button" aria-label="Réagir avec ${escapeHtml(reaction.annotation || reaction.emoji)}">${reactionEmojiMarkup(reaction)}${reaction.count ? `<strong>${reaction.count}</strong>` : ""}</button>`;
}
