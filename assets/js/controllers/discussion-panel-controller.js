export function bindDiscussionPanel({
  root,
  entity,
  state,
  addComment,
  saveDraft,
  activateRealtime,
  renderRightPanel,
  followUser,
  startReply,
  copyDeepLink,
  deleteComment,
  reactToComment,
  openEmojiPicker,
  reactToEntity,
  openEntityEmojiPicker,
  cssEscape,
  documentRef = document,
  requestAnimationFrameRef = requestAnimationFrame
}) {
  if (!root || !entity) return;
  root.querySelector("#send-comment")?.addEventListener("click", addComment);
  root.querySelector("#send-reply")?.addEventListener("click", addComment);
  root.querySelector("#comment-input")?.addEventListener("input", (event) => saveDraft(entity.id, null, event.target.value));
  root.querySelector("#reply-input")?.addEventListener("input", (event) => saveDraft(entity.id, state.replyTo, event.target.value));
  root.querySelectorAll("#comment-input, #reply-input").forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault();
        addComment();
      }
    });
  });
  root.querySelector("#discussion-sync-switch")?.addEventListener("change", () => activateRealtime(documentRef.querySelector("#toggle-avatars")));
  root.querySelector("#cancel-reply")?.addEventListener("click", () => {
    state.replyTo = null;
    renderRightPanel();
  });
  root.querySelectorAll("[data-follow]").forEach((button) => {
    button.addEventListener("click", () => followUser(button.dataset.follow));
  });
  root.querySelectorAll("[data-expand-presence]").forEach((button) => {
    button.addEventListener("click", () => button.closest(".discussion-presence")?.classList.toggle("expanded"));
  });
  root.querySelectorAll("[data-reply]").forEach((button) => {
    button.addEventListener("click", () => startReply(button.dataset.reply));
  });
  root.querySelectorAll("[data-copy-comment-link]").forEach((button) => {
    button.addEventListener("click", () => copyDeepLink({ entityId: entity.id, tab: "discussion", commentId: button.dataset.copyCommentLink }));
  });
  root.querySelectorAll("[data-delete-comment]").forEach((button) => {
    button.addEventListener("click", () => deleteComment(entity.id, button.dataset.deleteComment));
  });
  root.querySelectorAll("[data-reaction]").forEach((button) => {
    button.addEventListener("click", () => reactToComment(entity.id, button.dataset.commentId, {
      emoji: button.dataset.reaction,
      annotation: button.dataset.annotation || ""
    }));
  });
  root.querySelectorAll("[data-reaction-picker]").forEach((button) => {
    button.addEventListener("click", () => openEmojiPicker(entity.id, button.dataset.reactionPicker, button));
  });
  root.querySelectorAll("[data-entity-reaction]").forEach((button) => {
    button.addEventListener("click", () => reactToEntity(entity.id, {
      emoji: button.dataset.entityReaction,
      annotation: button.dataset.annotation || ""
    }));
  });
  root.querySelectorAll("[data-entity-reaction-picker]").forEach((button) => {
    button.addEventListener("click", () => openEntityEmojiPicker(button.dataset.entityReactionPicker, button));
  });
  if (state.highlightedCommentId) {
    requestAnimationFrameRef(() => {
      root.querySelector(`[data-comment-id="${cssEscape(state.highlightedCommentId)}"], [data-thread="${cssEscape(state.highlightedCommentId)}"]`)?.scrollIntoView({ block: "center" });
    });
  }
}
