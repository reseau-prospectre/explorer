import {
  renderActivityItem as renderActivityItemView,
  renderTrashItem
} from "../ui/activity-view.js";

export function createActivityController({
  els,
  state,
  visibleActivityTypes,
  closeProfile,
  renderRightPanel,
  renderAnalysis,
  openContextPanel,
  updateVisibleGraph,
  persistActivityRead,
  getAllComments,
  findComment,
  getCommentReactions,
  avatarMarkup,
  relativeTimeMarkup,
  reactionEmojiMarkup,
  documentRef = document
}) {
  function openPanel() {
    closeProfile();
    const open = Boolean(state.panelManager?.getLayout?.().activity?.open);
    if (open) closePanel();
    else state.panelManager?.open("activity");
  }

  function closePanel() {
    state.panelManager?.close("activity");
    closeState();
  }

  function closeState() {
    els.activityPanel?.classList.add("hidden");
    documentRef.querySelector("#app")?.classList.remove("activity-open");
  }

  function renderButton() {
    if (!els.activityButton) return;
    const online = state.realtimeStatus === "firebase";
    els.activitySlot?.classList.toggle("is-visible", online);
    els.activitySlot?.setAttribute("aria-hidden", String(!online));
    els.activityButton.tabIndex = online ? 0 : -1;
    const unread = state.activity.filter((item) => visibleActivityTypes.has(item.type) && item.actorId !== state.authUid && !state.activityRead.has(item.id)).length;
    els.activityBadge.textContent = unread > 99 ? "99+" : String(unread);
    els.activityBadge.classList.toggle("hidden", unread === 0);
    const label = unread ? `${unread} activité${unread > 1 ? "s" : ""} non vue${unread > 1 ? "s" : ""}` : "Fil d’activité";
    els.activityButton.setAttribute("aria-label", label);
    const tooltip = els.activityButton.querySelector(".tooltip");
    if (tooltip) tooltip.textContent = label;
  }

  function renderPanel() {
    if (!els.activityContent) return;
    documentRef.querySelectorAll(".admin-only").forEach((item) => item.classList.toggle("hidden", !state.isAdmin));
    documentRef.querySelector("#activity-tabs")?.classList.toggle("admin-mode", state.isAdmin);
    if (state.activityTab === "trash" && !state.isAdmin) state.activityTab = "unread";
    documentRef.querySelectorAll("[data-activity-tab]").forEach((item) => {
      item.classList.toggle("active", item.dataset.activityTab === state.activityTab);
    });
    if (state.activityTab === "trash") {
      renderTrash();
      return;
    }
    const wantsRead = state.activityTab === "read";
    const items = state.activity.filter((item) => visibleActivityTypes.has(item.type) && state.activityRead.has(item.id) === wantsRead);
    els.activityContent.innerHTML = items.length
      ? `<div class="activity-list ps-meta-list">${items.map(renderItem).join("")}</div>`
      : `<p class="empty-state">${wantsRead ? "Aucune activité consultée." : "Aucune nouvelle activité."}</p>`;
    els.activityContent.querySelectorAll("[data-activity-id]").forEach((button) => {
      button.addEventListener("click", () => openItem(button.dataset.activityId));
    });
  }

  function renderItem(item) {
    const comment = findComment(item.commentId);
    const reactions = comment ? getCommentReactions(comment) : [];
    return renderActivityItemView(item, {
      renderAvatar: avatarMarkup,
      renderRelativeTime: relativeTimeMarkup,
      renderReaction: reactionEmojiMarkup,
      reactions
    });
  }

  function openItem(activityId) {
    const item = state.activity.find((entry) => entry.id === activityId);
    if (!item) return;
    state.activityRead.add(activityId);
    persistActivityRead();
    renderButton();
    if (item.entityId && state.entities.has(item.entityId)) {
      state.selectedId = item.entityId;
      state.activeTab = "discussion";
      state.highlightedCommentId = item.parentId || item.commentId;
      documentRef.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === "discussion"));
      renderRightPanel();
      renderAnalysis();
      openContextPanel();
      updateVisibleGraph();
    }
    closePanel();
  }

  function renderTrash() {
    const deleted = getAllComments().filter((comment) => comment.deletedAt).sort((a, b) => b.deletedAt - a.deletedAt);
    els.activityContent.innerHTML = deleted.length
      ? `<div class="trash-list ps-meta-list">${deleted.map((comment) => renderTrashItem(comment, {
        entityLabel: state.entities.get(comment.entityId)?.label,
        renderRelativeTime: relativeTimeMarkup
      })).join("")}</div>`
      : `<p class="empty-state">La corbeille est vide.</p>`;
    els.activityContent.querySelectorAll("[data-restore-comment]").forEach((button) => {
      button.addEventListener("click", () => {
        const comment = findComment(button.dataset.restoreComment);
        state.provider?.restoreComment(comment?.entityId, comment?.id);
      });
    });
    els.activityContent.querySelectorAll("[data-purge-comment]").forEach((button) => {
      button.addEventListener("click", () => {
        const comment = findComment(button.dataset.purgeComment);
        state.provider?.permanentlyDeleteComment(comment?.entityId, comment?.id);
      });
    });
  }

  return {
    openPanel,
    closePanel,
    closeState,
    renderButton,
    renderPanel,
    renderItem,
    openItem,
    renderTrash
  };
}
