import { loadJson, normalizeSearchText } from "../core/utils.js";
import {
  createNativeEmojiPickerController
} from "./comments-controller.js";
import {
  emojiToId,
  getCommentReactions as getCommentReactionsView,
  getEntityReactions as getEntityReactionsView
} from "../ui/reactions-view.js";

export function createCommentInteractionsController({
  els,
  state,
  heartPoints,
  overviewContextPrefix,
  overlays,
  escapeHtml,
  recordHeartEvent,
  persistEntityReactions,
  renderAnalysis,
  renderDiscussion,
  renderRightPanel,
  getOverviewDiscussionEntity,
  isComposerActive,
  showToast,
  clearDraft,
  findComment,
  cryptoRef = crypto
}) {
  function getEntityReactions(entityId) {
    return getEntityReactionsView(entityId, {
      commentsByEntity: state.comments,
      entityReactions: state.entityReactions,
      authUid: state.authUid
    });
  }

  async function reactToComment(entityId, commentId, reaction) {
    if (state.realtimeStatus !== "firebase") return;
    try {
      await state.provider?.toggleReaction(entityId, commentId, reaction);
      recordHeartEvent("reaction", heartPoints.reaction);
    } catch {
      showToast("Réaction impossible avec les permissions actuelles");
    }
  }

  async function reactToEntity(entityId, reaction) {
    if (!entityId || !reaction?.emoji) return;
    if (state.realtimeStatus !== "firebase") {
      toggleLocalEntityReaction(entityId, reaction);
      return;
    }
    try {
      if (state.isAdmin) await state.provider?.toggleDefaultEntityReaction(entityId, reaction);
      else {
        await state.provider?.toggleEntityReaction(entityId, reaction);
        recordHeartEvent("reaction", heartPoints.reaction);
      }
    } catch {
      if (state.isAdmin) {
        try {
          await state.provider?.toggleEntityReaction(entityId, reaction);
          recordHeartEvent("reaction", heartPoints.reaction);
          return;
        } catch {
          // Fall through to the user-facing error.
        }
      }
      showToast("Réaction impossible avec les permissions actuelles");
    }
  }

  function toggleLocalEntityReaction(entityId, reaction) {
    const reactionId = emojiToId(reaction.emoji);
    const userId = state.authUid || state.profile.clientId || "local";
    state.entityReactions[entityId] ||= { reactions: {}, defaultReactions: {} };
    state.entityReactions[entityId].reactions ||= {};
    state.entityReactions[entityId].reactions[reactionId] ||= {};
    if (state.entityReactions[entityId].reactions[reactionId][userId]) {
      delete state.entityReactions[entityId].reactions[reactionId][userId];
    } else {
      state.entityReactions[entityId].reactions[reactionId][userId] = {
        emoji: reaction.emoji,
        annotation: reaction.annotation || "",
        displayName: state.profile.displayName,
        isAdmin: false,
        createdAt: Date.now()
      };
    }
    persistEntityReactions();
    renderAnalysis();
    if (state.currentDiscussionEntityId === entityId && state.activeTab === "discussion" && !isComposerActive()) {
      if (entityId.startsWith(`${overviewContextPrefix}:`)) renderDiscussion(getOverviewDiscussionEntity());
      else renderRightPanel();
    }
  }

  function openEmojiPicker(entityId, commentId, anchor) {
    if (state.realtimeStatus !== "firebase") return;
    state.emojiPickerTarget = { entityId, commentId };
    showEmojiPicker(anchor);
  }

  function openEntityEmojiPicker(entityId, anchor) {
    state.emojiPickerTarget = { entityId, entityReaction: true };
    showEmojiPicker(anchor);
  }

  function showEmojiPicker(anchor) {
    els.emojiPickerPopover?.classList.remove("hidden");
    const card = els.emojiPickerPopover?.querySelector(".emoji-picker-card");
    state.emojiPickerPositionCleanup?.();
    state.emojiPickerPositionCleanup = anchor && card ? overlays.position(anchor, card, { placement: "auto", distance: 8 }) : null;
    state.emojiPickerController?.focusFirst();
  }

  function closeEmojiPicker() {
    els.emojiPickerPopover?.classList.add("hidden");
    state.emojiPickerPositionCleanup?.();
    state.emojiPickerPositionCleanup = null;
    state.emojiPickerTarget = null;
  }

  function setupNativeEmojiPicker() {
    if (!els.emojiPicker) return;
    state.emojiPickerController = createNativeEmojiPickerController({
      root: els.emojiPicker,
      getState: () => state.emojiPickerTarget,
      onCommit: (reaction) => selectEmojiReaction(reaction),
      onClose: closeEmojiPicker,
      escapeHtml,
      normalizeSearchText,
      loadJson
    });
    state.emojiPickerController.mount();
  }

  function selectEmojiReaction(reaction) {
    if (!state.emojiPickerTarget) return;
    const { entityId, commentId, entityReaction } = state.emojiPickerTarget;
    if (entityReaction) reactToEntity(entityId, reaction);
    else if (state.isAdmin) state.provider?.toggleDefaultReaction(entityId, commentId, reaction);
    else reactToComment(entityId, commentId, reaction);
    closeEmojiPicker();
  }

  function getCommentReactions(comment) {
    return getCommentReactionsView(comment, { authUid: state.authUid });
  }

  async function addComment() {
    if (state.realtimeStatus !== "firebase") {
      showToast("Activez la coprésence pour contribuer");
      return;
    }
    const entityId = state.currentDiscussionEntityId || state.selectedId;
    const input = state.replyTo
      ? els.panelContent.querySelector("#reply-input")
      : els.panelContent.querySelector("#comment-input");
    if (!entityId || !input?.value.trim()) return;
    const comment = {
      id: cryptoRef.randomUUID(),
      clientId: state.profile.clientId,
      displayName: state.profile.displayName,
      avatar: state.profile.avatar,
      photoURL: state.profile.photoURL || null,
      color: state.profile.color,
      text: input.value.trim(),
      parentId: state.replyTo ? getThreadRootId(state.replyTo) : null,
      createdAt: Date.now()
    };
    try {
      await state.provider?.addComment(entityId, comment);
      recordHeartEvent(comment.parentId ? "reply" : "comment", comment.parentId ? heartPoints.reply : heartPoints.comment);
      const replyTarget = state.replyTo;
      state.replyTo = null;
      state.highlightedCommentId = comment.parentId || comment.id;
      clearDraft(entityId, replyTarget);
      input.value = "";
      if (entityId.startsWith(`${overviewContextPrefix}:`)) renderDiscussion(getOverviewDiscussionEntity());
      else renderRightPanel();
    } catch {
      showToast("Publication impossible, votre brouillon est conservé");
    }
  }

  function startReply(commentId) {
    state.replyTo = commentId;
    renderRightPanel();
    const nextInput = els.panelContent.querySelector("#reply-input");
    if (nextInput) nextInput.focus();
  }

  function getThreadRootId(commentId) {
    const comment = findComment(commentId);
    return comment?.parentId || commentId;
  }

  function deleteComment(entityId, commentId) {
    if (state.realtimeStatus !== "firebase") return;
    state.provider?.trashComment(entityId, commentId);
  }

  return {
    getEntityReactions,
    reactToComment,
    reactToEntity,
    toggleLocalEntityReaction,
    openEmojiPicker,
    openEntityEmojiPicker,
    closeEmojiPicker,
    setupNativeEmojiPicker,
    selectEmojiReaction,
    getCommentReactions,
    addComment,
    startReply,
    getThreadRootId,
    deleteComment
  };
}
