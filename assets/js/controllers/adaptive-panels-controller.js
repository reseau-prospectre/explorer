import { PanelManager } from "../panels/panel-manager.js?v=20260625-panel-rails-3";

export function createAdaptivePanelsController({
  els,
  state,
  syncToolbarActiveStates,
  positionOpenToolbarPopover,
  renderProfileControls,
  renderActivityPanel,
  renderGamificationCard,
  renderAnalysis,
  updateVisibleGraph,
  updateDeepLink,
  scheduleGraphResize,
  windowRef = window
} = {}) {
  function mount() {
    const app = document.querySelector("#app");
    let host = document.querySelector("#panel-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "panel-host";
      app?.append(host);
    }
    els.rightPanel?.classList.add("legacy-panel-source", "hidden");
    els.bottomDrawer?.classList.add("legacy-panel-source");
    els.profileMenu?.classList.add("legacy-panel-source", "hidden");
    els.activityPanel?.classList.add("legacy-panel-source", "hidden");
    state.panelManager = new PanelManager({
      host,
      store: state.appStore,
      windowBridge: state.windowBridge,
      onLayoutChange: syncLayout
    });
    registerPanels();
    if (state.externalWindow?.kind === "panel") {
      state.panelManager.open(state.externalWindow.panelId || "insights");
    } else if (state.externalWindow?.kind !== "graph") {
      state.panelManager.open("insights");
    }
    syncLayout(state.panelManager.getLayout());
    syncToolbarActiveStates?.();
  }

  function registerPanels() {
    state.panelManager.register({
      id: "context",
      title: "Aucun élément sélectionné",
      icon: "details",
      defaultPrefs: { mode: "dock", edge: "right", size: 430, width: 430, x: 96, y: 92, height: 620 },
      render: renderContextPanelBody,
      canExternalize: true,
      onClose: closeContextState
    });
    state.panelManager.register({
      id: "insights",
      title: "Repères",
      headerSlot: "insights",
      icon: "analytics",
      defaultPrefs: { mode: "dock", edge: "bottom", size: 300, width: 720, x: 120, y: 120, height: 420, collapsed: false },
      className: "adaptive-panel--insights",
      collapsible: true,
      render: renderInsightsPanelBody,
      canExternalize: true,
      onClose: syncToolbarActiveStates
    });
    state.panelManager.register({
      id: "profile",
      title: "Profil",
      icon: "profile",
      defaultPrefs: { mode: "dock", edge: "right", size: 390, width: 390, x: 116, y: 104, height: 650 },
      className: "adaptive-panel--profile",
      render: renderProfilePanelBody,
      canExternalize: true,
      onClose: () => state.profileController?.closeState?.()
    });
    state.panelManager.register({
      id: "activity",
      title: "Fil d’activité",
      icon: "activity",
      defaultPrefs: { mode: "dock", edge: "right", size: 460, width: 460, x: 136, y: 118, height: 650 },
      className: "adaptive-panel--activity",
      render: renderActivityPanelBody,
      canExternalize: true,
      onClose: () => state.activityController?.closeState?.()
    });
    state.panelManager.register({
      id: "gamification",
      title: "Coprésence",
      icon: "favorite",
      defaultPrefs: { mode: "float", edge: "right", size: 380, width: 380, x: 140, y: 110, height: 640 },
      className: "adaptive-panel--gamification",
      render: renderGamificationPanelBody,
      canExternalize: true
    });
  }

  function renderContextPanelBody() {
    if (!state.contextPanelBody) {
      state.contextPanelBody = document.createElement("div");
      state.contextPanelBody.className = "adaptive-panel__context";
      document.querySelector("#panel-tabs")?.removeAttribute("hidden");
      [document.querySelector("#panel-tabs"), els.panelContent].filter(Boolean).forEach((element) => state.contextPanelBody.append(element));
    }
    return state.contextPanelBody;
  }

  function renderInsightsPanelBody(_context, { panel } = {}) {
    if (!state.insightBreadcrumb) state.insightBreadcrumb = document.querySelector("#insight-breadcrumb");
    const breadcrumb = state.insightBreadcrumb;
    const titleSlot = panel?.querySelector("[data-panel-title-slot='insights']");
    if (breadcrumb && titleSlot && breadcrumb.parentElement !== titleSlot) {
      titleSlot.append(breadcrumb);
    }
    if (!state.insightsPanelBody) {
      state.insightsPanelBody = document.createElement("div");
      state.insightsPanelBody.className = "adaptive-panel__insights ps-page";
      const drawerBody = document.createElement("div");
      drawerBody.className = "drawer-body ps-page-grid ps-page-grid--dense";
      [els.timeline, els.kpiGrid, els.entityTable, els.presenceSummary].filter(Boolean).forEach((element) => drawerBody.append(element));
      state.insightsPanelBody.append(drawerBody);
    }
    return state.insightsPanelBody;
  }

  function renderProfilePanelBody() {
    if (!state.profilePanelBody) {
      state.profilePanelBody = document.createElement("div");
      state.profilePanelBody.className = "adaptive-panel__profile";
      const content = els.profileMenu?.querySelector(".panel-content");
      if (content) state.profilePanelBody.append(content);
    }
    state.profileController?.renderLoadingShell?.();
    deferPanelHydration(() => {
      renderProfileControls?.();
      if (els.realtimeSwitch) els.realtimeSwitch.checked = state.realtimeStatus === "firebase";
    }, "profile");
    return state.profilePanelBody;
  }

  function renderActivityPanelBody() {
    if (!state.activityPanelBody) {
      state.activityPanelBody = document.createElement("div");
      state.activityPanelBody.className = "adaptive-panel__activity";
      [document.querySelector("#activity-tabs"), els.activityContent].filter(Boolean).forEach((element) => state.activityPanelBody.append(element));
    }
    renderActivityPanel?.();
    return state.activityPanelBody;
  }

  function renderGamificationPanelBody() {
    if (!state.gamificationPanelBody) {
      state.gamificationPanelBody = document.createElement("div");
      state.gamificationPanelBody.className = "adaptive-panel__gamification";
      if (els.gamificationCard) state.gamificationPanelBody.append(els.gamificationCard);
    }
    state.gamificationController?.renderLoadingShell?.();
    deferPanelHydration(() => renderGamificationCard?.(), "gamification");
    return state.gamificationPanelBody;
  }

  function deferPanelHydration(callback, key) {
    const tokenKey = `${key}PanelHydrationToken`;
    const token = Date.now() + Math.random();
    state[tokenKey] = token;
    const run = () => {
      if (state[tokenKey] !== token) return;
      callback();
    };
    if (typeof windowRef.requestAnimationFrame === "function") {
      windowRef.requestAnimationFrame(() => windowRef.setTimeout(run, 45));
      return;
    }
    windowRef.setTimeout(run, 45);
  }

  function syncLayout(layout = state.panelManager?.getLayout?.() || {}) {
    const app = document.querySelector("#app");
    if (!app) return;
    app.style.setProperty("--graph-left", "0px");
    app.style.setProperty("--graph-top-offset", "0px");
    app.style.setProperty("--graph-right", "0px");
    app.style.setProperty("--graph-bottom", "0px");
    app.classList.toggle("has-adaptive-panels", Object.values(layout).some((panel) => panel?.open));
    app.classList.remove("right-open", "drawer-open", "drawer-collapsed");
    syncToolbarActiveStates?.(layout);
    positionOpenToolbarPopover?.();
  }

  function toggleInsights() {
    const open = Boolean(state.panelManager?.getLayout?.().insights?.open);
    if (open) state.panelManager?.close("insights");
    else state.panelManager?.open("insights");
    syncToolbarActiveStates?.();
  }

  function openContext() {
    state.panelManager?.open("context");
  }

  function closeContextState() {
    document.querySelector("#app")?.classList.remove("right-open");
    state.selectedId = null;
    state.highlightedCommentId = null;
    state.provider?.updatePresence({ selectedNodeId: null });
    renderAnalysis?.();
    updateVisibleGraph?.();
    updateDeepLink?.(null);
    scheduleGraphResize?.();
  }

  function hideRightPanel() {
    if (state.panelManager?.getLayout?.().context?.open) {
      state.panelManager.close("context");
      return;
    }
    closeContextState();
  }

  function toggleDrawer() {
    state.panelManager?.toggleCollapsed("insights");
    const icon = document.querySelector("#toggle-drawer i");
    const collapsed = Boolean(state.panelManager?.getPreferences?.("insights")?.collapsed);
    if (icon) icon.textContent = collapsed ? "expand_less" : "expand_more";
    scheduleGraphResize?.();
  }

  return {
    mount,
    renderContextPanelBody,
    renderInsightsPanelBody,
    renderProfilePanelBody,
    renderActivityPanelBody,
    renderGamificationPanelBody,
    syncLayout,
    toggleInsights,
    openContext,
    closeContextState,
    hideRightPanel,
    toggleDrawer
  };
}
