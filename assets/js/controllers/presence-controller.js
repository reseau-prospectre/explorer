import { escapeHtml, groupBy } from "../core/utils.js";
import { renderPresenceChips as renderPresenceChipsView } from "../ui/presence-view.js";

export function createPresenceController({
  els,
  state,
  avatarMarkup,
  selectNode,
  showToast,
  windowRef = window,
  documentRef = document
}) {
  function renderPresence() {
    els.presenceLayer.innerHTML = "";
    if (!state.avatarsVisible) return;
    const visibleNodeIds = new Set(state.visibleGraph.nodes.map((node) => node.id));
    const presence = state.presence.filter((item) => item.selectedNodeId && visibleNodeIds.has(item.selectedNodeId));
    const grouped = groupBy(presence, "selectedNodeId");
    for (const [nodeId, users] of Object.entries(grouped)) {
      const node = state.visibleGraph.nodes.find((item) => item.id === nodeId);
      if (!node || node.x == null) continue;
      const point = state.graphView.graph2ScreenCoords(node.x, node.y, node.z);
      const marker = documentRef.createElement("div");
      marker.className = users.length > 3 ? "presence-marker cluster" : "presence-marker";
      marker.style.transform = `translate(${Math.round(point.x)}px, ${Math.round(point.y)}px) translate(-50%, -130%)`;
      const visibleUsers = users.slice(0, 3);
      marker.innerHTML = visibleUsers.map((user) => `
        <button class="presence-marker-user" type="button" data-follow="${escapeHtml(user.clientId)}" aria-label="Rejoindre ${escapeHtml(user.displayName || "cette présence")}">
          ${avatarMarkup(user, "width:24px;height:24px;")}
        </button>
      `).join("") + (users.length > 3 ? `<button class="presence-marker-more" type="button" data-presence-node="${escapeHtml(nodeId)}">+${users.length - 3}</button>` : "");
      marker.addEventListener("dragstart", (event) => event.preventDefault());
      marker.querySelectorAll("[data-follow]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          followUser(button.dataset.follow);
        });
      });
      marker.querySelector("[data-presence-node]")?.addEventListener("click", () => selectNode(nodeId, true));
      els.presenceLayer.append(marker);
    }
  }

  function renderPresenceStrip() {
    if (!els.presenceStrip) return;
    const online = state.realtimeStatus === "firebase";
    els.presenceStrip.classList.toggle("is-visible", online);
    if (!online) {
      els.presenceStrip.innerHTML = "";
      return;
    }
    const now = Date.now();
    const users = state.presence
      .filter((item) => now - item.lastSeen < 45000)
      .sort((a, b) => (a.clientId === state.profile.clientId ? -1 : b.clientId === state.profile.clientId ? 1 : 0));
    const visibleLimit = windowRef.innerWidth < 1100 ? 2 : windowRef.innerWidth < 1450 ? 3 : 4;
    els.presenceStrip.innerHTML = renderPresenceChips(users, visibleLimit);
    els.presenceStrip.querySelectorAll("[data-follow]").forEach((button) => {
      button.addEventListener("click", () => followUser(button.dataset.follow));
    });
    els.presenceStrip.querySelector("[data-expand-presence]")?.addEventListener("click", () => {
      els.presenceStrip.classList.toggle("expanded");
    });
  }

  function renderPresenceChips(users, limit = 5) {
    return renderPresenceChipsView(users, {
      limit,
      currentClientId: state.profile.clientId,
      getNode: (id) => state.entities.get(id),
      renderAvatar: avatarMarkup
    });
  }

  function followUser(clientId) {
    const user = state.presence.find((item) => item.clientId === clientId);
    if (!user?.selectedNodeId) {
      showToast(`${user?.displayName || "Cette présence"} n'est pas sur une fiche`);
      return;
    }
    if (!state.entities.has(user.selectedNodeId)) {
      showToast(`${user.displayName} consulte une fiche absente de vos contenus`);
      return;
    }
    selectNode(user.selectedNodeId, true);
  }

  return {
    renderPresence,
    renderPresenceStrip,
    renderPresenceChips,
    followUser
  };
}
