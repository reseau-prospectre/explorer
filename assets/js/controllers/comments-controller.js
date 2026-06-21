export const EMOJI_RECENTS_KEY = "prospectre.ui.v3.emojiRecents";

export const QUICK_REACTIONS = Object.freeze([
  { emoji: "👍", annotation: "Valider", category: "essentiel", terms: "ok accord oui" },
  { emoji: "❤️", annotation: "Aimer", category: "essentiel", terms: "coeur amour" },
  { emoji: "👏", annotation: "Applaudir", category: "essentiel", terms: "bravo" },
  { emoji: "✨", annotation: "Souligner", category: "essentiel", terms: "sparkles important" },
  { emoji: "👀", annotation: "À revoir", category: "analyse", terms: "voir regarder verifier" },
  { emoji: "💡", annotation: "Idée", category: "analyse", terms: "idee suggestion" },
  { emoji: "❓", annotation: "Question", category: "analyse", terms: "interroger doute" },
  { emoji: "⚠️", annotation: "Attention", category: "analyse", terms: "alerte risque" },
  { emoji: "🔥", annotation: "Important", category: "priorite", terms: "feu priorite" },
  { emoji: "🚀", annotation: "Accélérer", category: "priorite", terms: "lancer vite" },
  { emoji: "🧠", annotation: "Réflexion", category: "analyse", terms: "cerveau penser" },
  { emoji: "🧩", annotation: "Connexion", category: "analyse", terms: "puzzle lien" },
  { emoji: "📝", annotation: "Note", category: "travail", terms: "ecrire annotation" },
  { emoji: "✅", annotation: "Fait", category: "travail", terms: "done valide" },
  { emoji: "⏳", annotation: "À suivre", category: "travail", terms: "temps attente" },
  { emoji: "🔗", annotation: "Lien", category: "travail", terms: "link relation" },
  { emoji: "🎯", annotation: "Cible", category: "priorite", terms: "objectif focus" },
  { emoji: "🧪", annotation: "Tester", category: "travail", terms: "test verifier" },
  { emoji: "🛠️", annotation: "À corriger", category: "travail", terms: "outil fix" },
  { emoji: "🌱", annotation: "À développer", category: "priorite", terms: "germe evolution" },
  { emoji: "💬", annotation: "Discussion", category: "essentiel", terms: "chat parler" },
  { emoji: "📌", annotation: "Épingler", category: "priorite", terms: "pin retenir" },
  { emoji: "🤝", annotation: "Accord", category: "essentiel", terms: "main accord" },
  { emoji: "🧭", annotation: "Orientation", category: "analyse", terms: "boussole direction" }
]);

export const EMOJI_CATEGORIES = Object.freeze([
  { id: "all", label: "Tout" },
  { id: "recent", label: "Récents" },
  { id: "essentiel", label: "Essentiel" },
  { id: "analyse", label: "Analyse" },
  { id: "priorite", label: "Priorité" },
  { id: "travail", label: "Travail" }
]);

export function createNativeEmojiPickerController({
  root,
  getState,
  onCommit,
  onClose,
  escapeHtml,
  normalizeSearchText,
  loadJson,
  storage = window.localStorage
}) {
  let state = { category: "all", query: "" };
  let bound = false;

  function mount() {
    if (!root || bound) return;
    bound = true;
    render();
    root.addEventListener("click", handleClick);
    root.addEventListener("input", handleInput);
    root.addEventListener("keydown", handleKeydown);
    root.addEventListener("submit", handleSubmit);
  }

  function destroy() {
    if (!root || !bound) return;
    root.removeEventListener("click", handleClick);
    root.removeEventListener("input", handleInput);
    root.removeEventListener("keydown", handleKeydown);
    root.removeEventListener("submit", handleSubmit);
    bound = false;
  }

  function focusFirst() {
    requestAnimationFrame(() => root?.querySelector("[data-emoji-choice]")?.focus());
  }

  function handleClick(event) {
    const category = event.target.closest("[data-emoji-category]")?.dataset.emojiCategory;
    if (category) {
      state = { ...state, category };
      render();
      return;
    }
    const button = event.target.closest("[data-emoji-choice]");
    if (button) commit(button.dataset.emojiChoice, button.dataset.annotation);
  }

  function handleInput(event) {
    if (event.target.matches("[data-emoji-search]")) {
      state = { ...state, query: event.target.value };
      renderChoices();
      return;
    }
    if (event.target.matches("[data-emoji-custom]")) {
      event.target.value = [...event.target.value].slice(0, 2).join("");
    }
  }

  function handleKeydown(event) {
    const choices = [...root.querySelectorAll("[data-emoji-choice]")];
    const index = choices.indexOf(document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      onClose?.();
      return;
    }
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const columns = 6;
    const nextIndex = event.key === "Home" ? 0
      : event.key === "End" ? choices.length - 1
        : event.key === "ArrowRight" ? index + 1
          : event.key === "ArrowLeft" ? index - 1
            : event.key === "ArrowDown" ? index + columns
              : index - columns;
    choices[Math.max(0, Math.min(choices.length - 1, nextIndex))]?.focus();
  }

  function handleSubmit(event) {
    event.preventDefault();
    const custom = root.querySelector("[data-emoji-custom]")?.value?.trim();
    if (custom) commit(custom, "Réaction personnalisée");
  }

  function render() {
    root.innerHTML = `
      <form class="emoji-native-search">
        <label>
          <i>search</i>
          <input data-emoji-search type="search" placeholder="Filtrer" value="${escapeHtml(state.query || "")}">
        </label>
        <label class="emoji-custom-field">
          <input data-emoji-custom type="text" inputmode="text" autocomplete="off" placeholder="🙂" maxlength="4" aria-label="Emoji personnalisé">
          <button type="submit" aria-label="Ajouter l’emoji personnalisé"><i>keyboard_return</i></button>
        </label>
      </form>
      <div class="emoji-native-tabs" role="tablist">
        ${EMOJI_CATEGORIES.map((category) => `<button type="button" data-emoji-category="${category.id}" class="${category.id === state.category ? "active" : ""}">${escapeHtml(category.label)}</button>`).join("")}
      </div>
      <div class="emoji-native-grid" role="listbox" aria-label="Réactions rapides"></div>
    `;
    renderChoices();
  }

  function renderChoices() {
    const grid = root?.querySelector(".emoji-native-grid");
    if (!grid) return;
    const choices = getFilteredChoices();
    grid.innerHTML = choices.length ? choices.map((reaction) => `
      <button type="button" role="option" data-emoji-choice="${escapeHtml(reaction.emoji)}" data-annotation="${escapeHtml(reaction.annotation)}" aria-label="${escapeHtml(reaction.annotation)}">
        <span>${escapeHtml(reaction.emoji)}</span>
        <small>${escapeHtml(reaction.annotation)}</small>
      </button>
    `).join("") : `<p class="emoji-native-empty">Aucune réaction.</p>`;
  }

  function getFilteredChoices() {
    const query = normalizeSearchText(state.query || "");
    const recents = loadJson(EMOJI_RECENTS_KEY, []);
    const recentChoices = recents.map((emoji) => QUICK_REACTIONS.find((reaction) => reaction.emoji === emoji) || { emoji, annotation: emoji, category: "recent", terms: "" });
    const base = state.category === "recent" ? recentChoices : QUICK_REACTIONS;
    const scoped = state.category && !["all", "recent"].includes(state.category)
      ? base.filter((reaction) => reaction.category === state.category)
      : base;
    if (!query) return scoped;
    return scoped.filter((reaction) => normalizeSearchText(`${reaction.emoji} ${reaction.annotation} ${reaction.terms || ""}`).includes(query));
  }

  function commit(emoji, annotation = emoji) {
    if (!emoji) return;
    const recents = [emoji, ...loadJson(EMOJI_RECENTS_KEY, []).filter((item) => item !== emoji)].slice(0, 12);
    storage.setItem(EMOJI_RECENTS_KEY, JSON.stringify(recents));
    onCommit?.({ emoji, annotation: annotation || emoji, state: getState?.() });
  }

  return { mount, destroy, focusFirst, render, renderChoices };
}

export function createDiscussionRenderer({
  getState,
  escapeHtml,
  avatarMarkup,
  relativeTimeMarkup,
  renderSmartText,
  getCommentReactions,
  reactionEmojiMarkup,
  getDraft,
  renderEntityReactionBlock,
  getEntityReactions,
  renderPresenceChips,
  overviewPrefix
}) {
  function renderPanel(entity) {
    const appState = getState();
    const online = appState.realtimeStatus === "firebase";
    const comments = (appState.comments[entity.id] || []).filter((comment) => !comment.deletedAt && !comment.systemKind);
    const presence = entity.id?.startsWith(`${overviewPrefix}:`)
      ? appState.presence
      : appState.presence.filter((item) => item.selectedNodeId === entity.id);
    const threads = comments
      .filter((comment) => !comment.parentId)
      .sort((a, b) => b.createdAt - a.createdAt);
    const entityReactions = getEntityReactions(entity.id);
    const mainDraft = getDraft(entity.id, null);
    const composer = online ? `
      <div class="comment-box compact-composer">
        <textarea id="comment-input" rows="3" placeholder="Partager une contribution">${escapeHtml(mainDraft)}</textarea>
        <button id="send-comment" class="send-button" type="button" aria-label="Publier"><i>send</i></button>
      </div>
    ` : `
      <article class="sync-card">
        <div>
          <strong>Coprésence inactive</strong>
          <p>Activez la coprésence pour contribuer et voir les échanges partagés.</p>
        </div>
        <label class="switch">
          <input id="discussion-sync-switch" type="checkbox">
          <span></span>
        </label>
      </article>
    `;
    return `
      <div class="discussion-panel">
        <section class="node-reaction-summary discussion-reaction-summary">
          ${renderEntityReactionBlock(entity.id, entityReactions)}
        </section>
        ${presence.length ? `<div class="discussion-presence" aria-label="Coprésences sur cette fiche">${renderPresenceChips(presence, 8)}</div>` : ""}
        ${composer}
        <div class="activity-feed">
          ${threads.length ? threads.map((comment) => renderCommentThread(comment, comments)).join("") : `<p class="empty-state">Aucun échange pour le moment.</p>`}
        </div>
      </div>
    `;
  }

  function renderCommentCard(comment) {
    const appState = getState();
    const canDelete = appState.isAdmin || comment.clientId === appState.profile.clientId || comment.ownerId === appState.authUid;
    const isOwn = comment.clientId === appState.profile.clientId || comment.ownerId === appState.authUid;
    const reactionGroups = getCommentReactions(comment);
    return `<article class="comment-card${comment.parentId ? " reply" : ""}${isOwn ? " own" : ""}${comment.id === appState.highlightedCommentId ? " highlighted" : ""}" data-comment-id="${escapeHtml(comment.id)}">
      <div class="comment-head">
        ${avatarMarkup(comment)}
        <div><strong>${escapeHtml(comment.displayName)}</strong></div>
        <span class="comment-meta">
          ${isOwn ? `<small class="comment-owner">Vous</small>` : ""}
          ${relativeTimeMarkup(comment.createdAt)}
          <button class="comment-permalink" data-copy-comment-link="${escapeHtml(comment.id)}" type="button" aria-label="Copier le lien de cet échange">
            <i>link</i><span class="tooltip top">Copier le lien</span>
          </button>
        </span>
      </div>
      <p class="comment-body">${renderSmartText(comment.text)}</p>
      <div class="comment-actions social-actions">
        <button class="comment-action" data-reply="${escapeHtml(comment.id)}" type="button"><i>reply</i><span>Répondre</span></button>
        <div class="reaction-bar">
          ${reactionGroups.map((reaction) => `<button class="reaction-button${reaction.selected ? " active" : ""}${reaction.isDefault ? " default-reaction" : ""}" data-reaction="${escapeHtml(reaction.emoji)}" data-annotation="${escapeHtml(reaction.annotation || "")}" data-comment-id="${escapeHtml(comment.id)}" type="button" aria-label="Réagir avec ${escapeHtml(reaction.annotation || reaction.emoji)}">${reactionEmojiMarkup(reaction)}${reaction.count ? `<strong>${reaction.count}</strong>` : ""}</button>`).join("")}
          <button class="reaction-picker-toggle" data-reaction-picker="${escapeHtml(comment.id)}" type="button" aria-label="Ajouter une réaction"><i>add_reaction</i><span class="tooltip top">Ajouter une réaction</span></button>
        </div>
        ${canDelete ? `<button class="comment-action danger-action" data-delete-comment="${escapeHtml(comment.id)}" aria-label="Mettre à la corbeille" type="button"><i>delete</i><span class="tooltip top">Mettre à la corbeille</span></button>` : ""}
      </div>
    </article>`;
  }

  function renderCommentThread(comment, allComments) {
    const appState = getState();
    const replies = allComments.filter((item) => item.parentId === comment.id).sort((a, b) => a.createdAt - b.createdAt);
    const highlighted = comment.id === appState.highlightedCommentId;
    return `<section class="thread${highlighted ? " highlighted" : ""}" data-thread="${escapeHtml(comment.id)}">
      ${renderCommentCard(comment)}
      ${replies.length ? `<div class="thread-count">${replies.length} réponse${replies.length > 1 ? "s" : ""}</div>` : ""}
      ${appState.replyTo === comment.id ? renderInlineReplyBox(comment) : ""}
      ${replies.length ? `<div class="reply-list">${replies.map((reply) => `
        ${renderCommentCard(reply)}
        ${appState.replyTo === reply.id ? renderInlineReplyBox(reply) : ""}
      `).join("")}</div>` : ""}
    </section>`;
  }

  function renderInlineReplyBox(comment) {
    const appState = getState();
    const draft = getDraft(appState.currentDiscussionEntityId || appState.selectedId, comment.id);
    return `<div class="reply-composer">
      <div class="reply-context">
        <span><i>subdirectory_arrow_right</i> Réponse à ${escapeHtml(comment.displayName || "Anonyme")}</span>
        <button id="cancel-reply" class="text-action" type="button">Annuler</button>
      </div>
      <div class="comment-box">
        <textarea id="reply-input" rows="2" placeholder="Écrire une réponse">${escapeHtml(draft)}</textarea>
        <button id="send-reply" class="send-button" type="button" aria-label="Répondre"><i>send</i></button>
      </div>
    </div>`;
  }

  return {
    renderPanel,
    renderCommentCard,
    renderCommentThread,
    renderInlineReplyBox
  };
}
