import {
  CONTRIBUTION_FILTER,
  DEFAULT_PROJECT_MANIFEST_URL,
  FALLBACK_MODEL_SCHEMA as DEFAULT_MODEL_SCHEMA,
  HIDDEN_NODE_TYPES,
  KNOWN_PROJECT_MANIFESTS,
  MODEL_SCHEMA_VERSION,
  PACK_ASSET_EXTENSIONS,
  PACK_ASSET_MIME_TYPES,
  STORAGE_KEYS,
  TECHNICAL_TYPE_LABELS as TYPE_LABELS,
  TYPE_CONFIG,
  VISIBLE_ACTIVITY_TYPES
} from "./core/config.js";
import {
  cssEscape,
  escapeHtml,
  getId,
  getRelativePackPath,
  groupBy,
  humanStatus,
  loadJson,
  makeDatasetId,
  normalizeSearchText,
  parseJson,
  safeFileName,
  shortLabel
} from "./core/utils.js";
import { createProfileStore } from "./core/profile.js";
import { createProjectModel } from "./model/project.js";
import {
  normalizeModelSchema,
  normalizeSchemaField
} from "./model/schema.js";
import { createNodeRenderer } from "./graph/node-renderer.js";
import { createRealtimeProviders } from "./services/realtime.js";
import { createMarkdownRenderer } from "./ui/markdown.js";

const {
  session: SESSION_KEY,
  profile: PROFILE_KEY,
  anonymousProfile: ANONYMOUS_PROFILE_KEY,
  googleProfile: GOOGLE_PROFILE_KEY,
  comments: COMMENTS_KEY,
  entityReactions: ENTITY_REACTIONS_KEY,
  gamification: GAMIFICATION_KEY,
  activityRead: ACTIVITY_READ_KEY,
  drafts: DRAFTS_KEY,
  graphLayout: GRAPH_LAYOUT_KEY,
  graphPrefs: GRAPH_PREFS_KEY,
  projectSessions: PROJECT_SESSIONS_KEY,
  recentProjects: RECENT_PROJECTS_KEY,
  theme: THEME_KEY,
  realtime: REALTIME_KEY
} = STORAGE_KEYS;

const FIT_PADDING = 18;
const RESET_FIT_PADDING = 24;
const FOCUS_FIT_PADDING = 14;
const INITIAL_FIT_DELAY = 900;
const SEARCH_RESULT_LIMIT = 30;
const LINK_FOCUS_MAX_LINKS = 96;
const OVERVIEW_CONTEXT_PREFIX = "__overview__";
const HEART_CYCLE_SECONDS = 180;
const HEART_IDLE_LIMIT = 60000;
const HEART_CLICK_CAP = 60;
const HEART_POINTS = Object.freeze({
  second: 1,
  click: 1,
  reaction: 2,
  reply: 3,
  comment: 4,
  linkPreview: 1,
  linkOpen: 2,
  linkCopy: 2,
  linkEmbed: 2
});
const DEFAULT_GRAPH_PREFS = Object.freeze({
  labelMode: "auto",
  showLinks: true,
  showMotion: true,
  focusMode: true,
  focusDepth: 1
});

const {
  getAnonymousProfile,
  getGoogleProfile,
  getInitials,
  getProfile,
  persistProfile
} = createProfileStore({
  profileKey: PROFILE_KEY,
  anonymousProfileKey: ANONYMOUS_PROFILE_KEY,
  googleProfileKey: GOOGLE_PROFILE_KEY
});

const els = {
  graphStage: document.querySelector("#graph-stage"),
  presenceLayer: document.querySelector("#presence-layer"),
  presenceStrip: document.querySelector("#presence-strip"),
  activitySlot: document.querySelector("#activity-slot"),
  activityButton: document.querySelector("#activity-button"),
  activityBadge: document.querySelector("#activity-badge"),
  activityPanel: document.querySelector("#activity-panel"),
  activityContent: document.querySelector("#activity-content"),
  search: document.querySelector("#search-input"),
  clearSearch: document.querySelector("#clear-search"),
  graphSearchToggle: document.querySelector("#graph-search-toggle"),
  graphSearchPopover: document.querySelector("#graph-search-popover"),
  graphSearchResults: document.querySelector("#graph-search-results"),
  graphSearchStatus: document.querySelector("#graph-search-status"),
  resetViewButton: document.querySelector("#reset-view"),
  resetViewPopover: document.querySelector("#reset-view-popover"),
  confirmResetView: document.querySelector("#confirm-reset-view"),
  cancelResetView: document.querySelector("#cancel-reset-view"),
  graphHelpToggle: document.querySelector("#graph-help-toggle"),
  graphHelpPopover: document.querySelector("#graph-help-popover"),
  projectSwitcherToggle: document.querySelector("#project-switcher-toggle"),
  projectSwitcherMenu: document.querySelector("#project-switcher-menu"),
  activeProjectName: document.querySelector("#active-project-name"),
  activeProjectVersion: document.querySelector("#active-project-version"),
  quickTypeFilters: document.querySelector("#quick-type-filters"),
  typeFilters: document.querySelector("#type-filters"),
  filterMenuToggle: document.querySelector("#filter-menu-toggle"),
  topbar: document.querySelector(".topbar"),
  mobileMenu: document.querySelector("#mobile-menu"),
  mobileMenuToggle: document.querySelector("#mobile-menu-toggle"),
  transferMenu: document.querySelector("#transfer-menu"),
  transferMenuToggle: document.querySelector("#transfer-menu-toggle"),
  rightPanel: document.querySelector("#right-panel"),
  panelKicker: document.querySelector("#panel-kicker"),
  panelTitle: document.querySelector("#panel-title"),
  panelContent: document.querySelector("#panel-content"),
  bottomDrawer: document.querySelector("#bottom-drawer"),
  timeline: document.querySelector("#timeline"),
  kpiGrid: document.querySelector("#kpi-grid"),
  entityTable: document.querySelector("#entity-table"),
  presenceSummary: document.querySelector("#presence-summary"),
  dropOverlay: document.querySelector("#drop-overlay"),
  packInput: document.querySelector("#pack-input"),
  profileMenu: document.querySelector("#profile-menu"),
  gamificationCard: document.querySelector("#gamification-card"),
  profileSettingsToggle: document.querySelector("#profile-settings-toggle"),
  profileSettingsPanel: document.querySelector("#profile-settings-panel"),
  profileAvatar: document.querySelector("#profile-avatar"),
  profileIdentity: document.querySelector("#profile-identity"),
  profileName: document.querySelector("#profile-name"),
  profileInitial: document.querySelector("#profile-initial"),
  profileColor: document.querySelector("#profile-color"),
  profileColorPreview: document.querySelector("#profile-color-preview"),
  googleLogin: document.querySelector("#google-login"),
  realtimeSwitch: document.querySelector("#realtime-switch"),
  realtimeMode: document.querySelector("#realtime-mode"),
  authMode: document.querySelector("#auth-mode"),
  presenceCount: document.querySelector("#presence-count"),
  emojiPickerPopover: document.querySelector("#emoji-picker-popover"),
  emojiPicker: document.querySelector("#emoji-picker"),
  schemaAdmin: document.querySelector("#schema-admin"),
  schemaAdminContent: document.querySelector("#schema-admin-content"),
  schemaFileInput: document.querySelector("#schema-file-input"),
  linkPreviewPopover: document.querySelector("#link-preview-popover"),
  linkEmbedModal: document.querySelector("#link-embed-modal"),
  linkEmbedFrame: document.querySelector("#link-embed-frame"),
  linkEmbedTitle: document.querySelector("#link-embed-title"),
  toast: document.querySelector("#toast")
};

const state = {
  files: new Map(),
  projectManifest: null,
  projectBaseUrl: "",
  projectManifestUrl: "",
  entities: new Map(),
  graph: { nodes: [], links: [] },
  visibleGraph: { nodes: [], links: [] },
  graphView: null,
  activeTypes: new Set(Object.keys(TYPE_CONFIG)),
  graphPrefs: { ...DEFAULT_GRAPH_PREFS, ...loadJson(GRAPH_PREFS_KEY, {}) },
  searchQuery: "",
  searchTerm: "",
  searchIndex: null,
  searchResults: [],
  searchActiveIndex: -1,
  searchMatchedIds: new Set(),
  selectedId: null,
  selectedLinkKey: null,
  hoveredLinkKey: null,
  selectedLinkPathIds: new Set(),
  selectedLinkPathLinkKeys: new Set(),
  selectedPathIds: new Set(),
  selectedPathLinkKeys: new Set(),
  focusSuppressed: false,
  activeTab: "overview",
  editMode: false,
  replyTo: null,
  highlightedCommentId: null,
  profile: getProfile(),
  comments: loadJson(COMMENTS_KEY, {}),
  entityReactions: loadJson(ENTITY_REACTIONS_KEY, {}),
  gamification: {
    scores: loadJson(GAMIFICATION_KEY, { global: null, project: null }),
    cycle: createEmptyHeartCycle(),
    lastInteractionAt: Date.now(),
    tickTimer: null,
    view: null,
    committing: false,
    shownTotals: { totalHearts: 0, projectHearts: 0 },
    lastRenderSignature: ""
  },
  linkPreview: {
    url: "",
    title: "",
    anchor: null
  },
  activity: [],
  activityRead: new Set(loadJson(ACTIVITY_READ_KEY, [])),
  activityTab: "unread",
  drafts: loadJson(DRAFTS_KEY, {}),
  presence: [],
  avatarsVisible: true,
  provider: null,
  providerVersion: 0,
  datasetId: "local",
  realtimeStatus: "local",
  authUid: null,
  authEmail: null,
  authProvider: "local",
  isAdmin: false,
  modelSchema: structuredClone(DEFAULT_MODEL_SCHEMA),
  schemaDraft: null,
  schemaView: "types",
  schemaSelectedType: DEFAULT_MODEL_SCHEMA.types[0].id,
  schemaSelectedField: DEFAULT_MODEL_SCHEMA.types[0].fields[0].key,
  contributionFilterInitialized: false,
  resize: null,
  charts: {}
};
state.contentEditor = null;
state.contentEditorAssetMap = new Map();
state.schemaDraggedType = null;
state.schemaDragArmedType = null;
state.emojiPickerTarget = null;

window.__prospectreState = state;
window.__prospectreSelectNode = (id, moveCamera = false) => selectNode(id, moveCamera);

const { LocalRealtimeProvider, FirebaseRealtimeProvider } = createRealtimeProviders({
  state,
  minimalPresence,
  getAnonymousProfile,
  getGoogleProfile,
  renderProfileButton,
  renderProfileControls,
  renderConnectionStatus,
  showToast,
  emojiToId,
  findComment,
  getAllComments
});

const {
  getFirstMarkdownImage,
  renderMarkdownWithEntityLinks,
  resolveEditorMarkdownAssets,
  resolvePackAssetUrl
} = createMarkdownRenderer({ state });

const { makeNodeObject } = createNodeRenderer({
  state,
  resolveAvatarAssetURL
});

const {
  applyModelSchema,
  buildGraph,
  contributionNodeId,
  parseEntities,
  parseMarkdownFile
} = createProjectModel({
  state,
  getFirstMarkdownImage,
  resolveAvatarProfile,
  getScoreBoost
});

init();

async function init() {
  if (!window.ForceGraph3D || !window.JSZip || !window.jsyaml || !window.marked || !window.DOMPurify) {
    showToast("Chargement incomplet. Vérifiez la connexion.");
    return;
  }
  applyTheme(loadJson(THEME_KEY, "system"));
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    if (loadJson(THEME_KEY, "system") === "system") applyTheme("system");
  });
  setupControls();
  setupGamification();
  setupGlobalTooltips();
  setupRelativeTimes();
  setupGraph();
  await loadDefaultProject();
  applyInitialDeepLink();
  await setupPresence();
  const adminView = new URLSearchParams(window.location.search).get("admin");
  if (["modele", "champs", "transfert"].includes(adminView)) {
    openSchemaAdmin(adminView === "champs" ? "fields" : adminView === "transfert" ? "transfer" : "types");
  }
}

function setupGlobalTooltips() {
  const show = (target) => {
    const source = target?.querySelector?.(":scope > .tooltip");
    if (!source?.textContent.trim()) return;
    hideGlobalTooltip();
    const tooltip = document.createElement("div");
    tooltip.className = "global-tooltip";
    tooltip.textContent = source.textContent.trim();
    document.body.append(tooltip);
    const rect = target.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();
    const prefersLeft = source.classList.contains("left");
    const prefersTop = source.classList.contains("top");
    let left = prefersLeft ? rect.left - tipRect.width - 8 : rect.left + (rect.width - tipRect.width) / 2;
    let top = prefersTop ? rect.top - tipRect.height - 8 : rect.bottom + 8;
    if (source.classList.contains("bottom")) top = rect.bottom + 8;
    left = Math.max(8, Math.min(window.innerWidth - tipRect.width - 8, left));
    top = Math.max(8, Math.min(window.innerHeight - tipRect.height - 8, top));
    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
    state.globalTooltip = tooltip;
  };
  document.addEventListener("pointerover", (event) => {
    const target = event.target.closest("button, .edit-toggle, .presence-top-chip");
    if (target && !target.contains(event.relatedTarget)) show(target);
  });
  document.addEventListener("pointerout", (event) => {
    const target = event.target.closest("button, .edit-toggle, .presence-top-chip");
    if (target && !target.contains(event.relatedTarget)) hideGlobalTooltip();
  });
  document.addEventListener("focusin", (event) => show(event.target.closest("button, .edit-toggle, .presence-top-chip")));
  document.addEventListener("focusout", hideGlobalTooltip);
}

function hideGlobalTooltip() {
  state.globalTooltip?.remove();
  state.globalTooltip = null;
}

function setupControls() {
  document.querySelector("#app").classList.add("drawer-open");
  els.mobileMenuToggle?.addEventListener("click", toggleMobileMenu);
  els.filterMenuToggle?.addEventListener("click", toggleFilterMenu);
  els.transferMenuToggle?.addEventListener("click", toggleTransferMenu);
  els.mobileMenu?.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button && button !== els.transferMenuToggle && !button.hasAttribute("data-expand-presence")) closeMobileMenu();
  });
  document.addEventListener("pointerdown", (event) => {
    if (els.topbar?.classList.contains("menu-open") && !els.topbar.contains(event.target)) closeMobileMenu();
    if (els.transferMenu && !event.target.closest(".transfer-menu-wrap")) closeTransferMenu();
    if (els.projectSwitcherMenu && !event.target.closest(".project-switcher-wrap")) closeProjectMenu();
    if (els.graphSearchPopover && !event.target.closest("#graph-search-popover") && !event.target.closest("#graph-search-toggle")) closeGraphSearch();
    if (els.typeFilters && !event.target.closest("#type-filters") && !event.target.closest("#filter-menu-toggle")) closeFilterMenu();
    if (els.resetViewPopover && !event.target.closest("#reset-view-popover") && !event.target.closest("#reset-view")) closeResetConfirm();
    if (els.graphHelpPopover && !event.target.closest("#graph-help-popover") && !event.target.closest("#graph-help-toggle")) closeGraphHelp();
    if (!event.target.closest("#emoji-picker-popover") && !event.target.closest("[data-reaction-picker]")) closeEmojiPicker();
    if (!event.target.closest("#link-preview-popover") && !event.target.closest("[data-smart-link]")) closeLinkPreview();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
      closeTransferMenu();
      closeProjectMenu();
      closeGraphSearch();
      closeFilterMenu();
      closeResetConfirm();
      closeGraphHelp();
      closeEmojiPicker();
      closeSchemaAdmin();
      closeLinkPreview();
      closeLinkEmbed();
      return;
    }
    if ((event.key === "/" && !isTextInputActive()) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
      event.preventDefault();
      openGraphSearch();
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeMobileMenu();
    renderPresenceStrip();
    closeEmojiPicker();
    positionOpenToolbarPopover();
  });
  els.resetViewButton?.addEventListener("click", toggleResetConfirm);
  els.confirmResetView?.addEventListener("click", () => {
    closeResetConfirm();
    resetView();
  });
  els.cancelResetView?.addEventListener("click", closeResetConfirm);
  els.graphHelpToggle?.addEventListener("click", toggleGraphHelp);
  document.querySelector("#fit-view").addEventListener("click", () => fitVisibleGraph());
  document.querySelector("#zoom-in").addEventListener("click", () => zoomCamera(0.78));
  document.querySelector("#zoom-out").addEventListener("click", () => zoomCamera(1.22));
  document.querySelector("#close-right-panel").addEventListener("click", () => hideRightPanel());
  els.graphSearchToggle?.addEventListener("click", () => toggleGraphSearch());
  els.projectSwitcherToggle?.addEventListener("click", toggleProjectMenu);
  document.querySelector("#open-import").addEventListener("click", showDropOverlay);
  document.querySelector("#export-all").addEventListener("click", exportAll);
  document.querySelector("#export-current").addEventListener("click", exportSelected);
  document.querySelector("#open-schema-admin")?.addEventListener("click", () => openSchemaAdmin());
  document.querySelector("#close-schema-admin")?.addEventListener("click", closeSchemaAdmin);
  document.querySelector("#save-schema")?.addEventListener("click", saveSchemaDraft);
  document.querySelector("#reset-schema")?.addEventListener("click", resetSchemaDraft);
  document.querySelectorAll("[data-schema-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.schemaView = button.dataset.schemaView;
      renderSchemaAdmin();
    });
  });
  els.schemaAdminContent?.addEventListener("input", handleSchemaAdminInput);
  els.schemaAdminContent?.addEventListener("change", handleSchemaAdminInput);
  els.schemaAdminContent?.addEventListener("click", handleSchemaAdminClick);
  els.schemaAdminContent?.addEventListener("pointerdown", prepareSchemaTypeDrag);
  els.schemaAdminContent?.addEventListener("pointermove", moveSchemaPointerDrag);
  els.schemaAdminContent?.addEventListener("pointerup", finishSchemaPointerDrag);
  els.schemaAdminContent?.addEventListener("pointercancel", finishSchemaPointerDrag);
  els.schemaAdminContent?.addEventListener("dragstart", startSchemaTypeDrag);
  els.schemaAdminContent?.addEventListener("dragover", moveSchemaTypeDrag);
  els.schemaAdminContent?.addEventListener("drop", dropSchemaTypeDrag);
  els.schemaAdminContent?.addEventListener("dragend", endSchemaTypeDrag);
  els.schemaFileInput?.addEventListener("change", importSchemaFile);
  document.querySelector("#toggle-avatars").addEventListener("click", toggleAvatars);
  document.querySelector("#toggle-drawer").addEventListener("click", toggleDrawer);
  document.querySelector("#profile-button").addEventListener("click", openProfile);
  els.activityButton?.addEventListener("click", openActivityPanel);
  document.querySelector("#close-activity")?.addEventListener("click", closeActivityPanel);
  document.querySelector("#close-profile").addEventListener("click", closeProfile);
  els.profileSettingsToggle?.addEventListener("click", toggleProfileSettings);
  document.querySelector("#clear-local").addEventListener("click", clearLocalData);
  els.googleLogin?.addEventListener("click", toggleGoogleAccount);
  els.realtimeSwitch?.addEventListener("change", (event) => toggleRealtimeMode(event.target.checked));
  els.profileName?.addEventListener("input", scheduleProfileSave);
  els.profileInitial?.addEventListener("input", scheduleProfileSave);
  els.profileColor?.addEventListener("input", (event) => {
    state.profile.color = event.target.value;
    applyAvatarElement(els.profileColorPreview, state.profile);
  });
  els.profileColor?.addEventListener("change", saveProfile);
  document.querySelector("#close-emoji-picker")?.addEventListener("click", closeEmojiPicker);
  els.emojiPicker?.addEventListener("emoji-click", handleEmojiSelection);
  document.querySelectorAll("[name='avatar-mode']").forEach((input) => {
    input.addEventListener("change", saveProfile);
  });
  document.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.setItem(THEME_KEY, JSON.stringify(button.dataset.themeChoice));
      applyTheme(button.dataset.themeChoice);
      renderThemeChoice();
    });
  });
  document.querySelector("#right-resize").addEventListener("pointerdown", startRightResize);
  document.querySelector("#bottom-resize").addEventListener("pointerdown", startBottomResize);
  document.addEventListener("pointermove", resizePanels);
  document.addEventListener("pointerup", stopResize);

  els.packInput.addEventListener("change", (event) => importUserFiles([...event.target.files]));
  els.search.addEventListener("input", (event) => {
    runGraphSearch(event.target.value);
  });
  els.search.addEventListener("keydown", handleGraphSearchKeydown);
  els.clearSearch?.addEventListener("click", clearSearch);
  document.addEventListener("click", handleSmartLinkClick);
  document.addEventListener("pointerover", handleSmartLinkHover);
  document.addEventListener("focusin", handleSmartLinkFocus);
  document.querySelector("#close-link-embed")?.addEventListener("click", closeLinkEmbed);

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activeTab = tab.dataset.tab;
      state.replyTo = null;
      document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
      if (!state.selectedId && state.currentDiscussionEntityId?.startsWith(`${OVERVIEW_CONTEXT_PREFIX}:`)) {
        if (state.activeTab === "overview") renderOverviewMetaDetails();
        else renderDiscussion(getOverviewDiscussionEntity());
      } else {
        renderRightPanel();
      }
      updateDeepLink();
    });
  });
  document.querySelectorAll("[data-activity-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activityTab = tab.dataset.activityTab;
      document.querySelectorAll("[data-activity-tab]").forEach((item) => item.classList.toggle("active", item === tab));
      renderActivityPanel();
    });
  });

  document.addEventListener("dragenter", (event) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    showDropOverlay();
  });
  document.addEventListener("dragover", (event) => {
    if (isFileDrag(event)) event.preventDefault();
  });
  document.addEventListener("drop", async (event) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    const files = [...event.dataTransfer.files];
    els.dropOverlay.classList.add("hidden");
    await importUserFiles(files);
  });
  els.dropOverlay.addEventListener("click", (event) => {
    if (event.target === els.dropOverlay) els.dropOverlay.classList.add("hidden");
  });

  renderTypeFilters();
  renderProfileButton();
  renderConnectionStatus();
}

function setupGamification() {
  const markActivity = () => {
    state.gamification.lastInteractionAt = Date.now();
  };
  document.addEventListener("pointerdown", (event) => {
    markActivity();
    if (event.target.closest("#app")) recordHeartEvent("click", HEART_POINTS.click);
  }, { capture: true });
  document.addEventListener("keydown", markActivity, { capture: true });
  document.addEventListener("wheel", markActivity, { capture: true, passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseGamificationVisual();
    else renderGamificationCard();
  });
  state.gamification.tickTimer = window.setInterval(tickGamificationCycle, 1000);
}

function createEmptyHeartCycle() {
  return {
    id: crypto.randomUUID(),
    startedAt: Date.now(),
    activeSeconds: 0,
    points: 0,
    breakdown: {
      second: 0,
      click: 0,
      reaction: 0,
      reply: 0,
      comment: 0,
      linkPreview: 0,
      linkOpen: 0,
      linkCopy: 0,
      linkEmbed: 0
    }
  };
}

function isGamificationActive() {
  return state.realtimeStatus === "firebase"
    && !document.hidden
    && Date.now() - state.gamification.lastInteractionAt <= HEART_IDLE_LIMIT;
}

function tickGamificationCycle() {
  if (!isGamificationActive()) {
    renderGamificationCard();
    return;
  }
  recordHeartEvent("second", HEART_POINTS.second, { skipRender: true });
  state.gamification.cycle.activeSeconds += 1;
  if (state.gamification.cycle.activeSeconds >= HEART_CYCLE_SECONDS) {
    commitHeartCycle();
  } else {
    renderGamificationCard();
  }
}

function recordHeartEvent(type, points = 0, options = {}) {
  if (state.realtimeStatus !== "firebase" || !points) return;
  if (type === "click" && state.gamification.cycle.breakdown.click >= HEART_CLICK_CAP) return;
  state.gamification.cycle.points += points;
  state.gamification.cycle.breakdown[type] = (state.gamification.cycle.breakdown[type] || 0) + points;
  if (!options.skipRender) renderGamificationCard();
}

async function commitHeartCycle() {
  if (state.gamification.committing) return;
  const cycle = state.gamification.cycle;
  if (!cycle.points) {
    state.gamification.cycle = createEmptyHeartCycle();
    renderGamificationCard();
    return;
  }
  state.gamification.committing = true;
  const payload = {
    id: cycle.id,
    points: cycle.points,
    activeSeconds: cycle.activeSeconds,
    breakdown: { ...cycle.breakdown },
    startedAt: cycle.startedAt,
    endedAt: Date.now(),
    projectId: state.projectManifest?.id || state.datasetId,
    projectVersion: state.projectManifest?.version || null
  };
  try {
    await state.provider?.commitHeartCycle?.(payload);
    showToast(`Merci pour ${HEART_CYCLE_SECONDS} secondes d’attention · +${payload.points} ❤️`);
    state.gamification.cycle = createEmptyHeartCycle();
  } catch (error) {
    if (error?.partial) {
      showToast("💓 partiellement synchronisés · correction au prochain cycle");
    } else {
      showToast("💓 non synchronisés · vérifiez la synchronisation de la Coprésence");
    }
    state.gamification.cycle = createEmptyHeartCycle();
  } finally {
    state.gamification.committing = false;
    renderGamificationCard();
  }
}

function resetGamificationCycle() {
  state.gamification.cycle = createEmptyHeartCycle();
  state.gamification.lastInteractionAt = Date.now();
  state.gamification.committing = false;
  renderGamificationCard();
}

function toggleMobileMenu() {
  const open = !els.topbar.classList.contains("menu-open");
  els.topbar.classList.toggle("menu-open", open);
  els.mobileMenuToggle.setAttribute("aria-expanded", String(open));
  els.mobileMenuToggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  els.mobileMenuToggle.querySelector("i").textContent = open ? "close" : "menu";
}

function toggleFilterMenu() {
  const open = els.typeFilters?.classList.contains("hidden");
  if (open) {
    closeProjectMenu();
    closeGraphSearch();
    closeResetConfirm();
    closeGraphHelp();
  }
  els.typeFilters?.classList.toggle("hidden", !open);
  els.filterMenuToggle?.setAttribute("aria-expanded", String(open));
  if (open) requestAnimationFrame(() => positionToolbarPopover(els.typeFilters, els.filterMenuToggle));
}

function closeFilterMenu() {
  els.typeFilters?.classList.add("hidden");
  els.filterMenuToggle?.setAttribute("aria-expanded", "false");
}

function toggleTransferMenu() {
  const open = els.transferMenu.classList.contains("hidden");
  els.transferMenu.classList.toggle("hidden", !open);
  els.transferMenuToggle.setAttribute("aria-expanded", String(open));
}

function closeTransferMenu() {
  els.transferMenu?.classList.add("hidden");
  els.transferMenuToggle?.setAttribute("aria-expanded", "false");
}

function closeMobileMenu() {
  if (!els.topbar?.classList.contains("menu-open")) return;
  els.topbar.classList.remove("menu-open");
  els.mobileMenuToggle?.setAttribute("aria-expanded", "false");
  els.mobileMenuToggle?.setAttribute("aria-label", "Ouvrir le menu");
  const icon = els.mobileMenuToggle?.querySelector("i");
  if (icon) icon.textContent = "menu";
}

function toggleProjectMenu() {
  const open = els.projectSwitcherMenu.classList.contains("hidden");
  if (open) {
    closeFilterMenu();
    closeGraphSearch();
    closeResetConfirm();
    closeGraphHelp();
  }
  renderProjectSwitcher();
  els.projectSwitcherMenu.classList.toggle("hidden", !open);
  els.projectSwitcherToggle.setAttribute("aria-expanded", String(open));
}

function closeProjectMenu() {
  els.projectSwitcherMenu?.classList.add("hidden");
  els.projectSwitcherToggle?.setAttribute("aria-expanded", "false");
}

function renderProjectSwitcher() {
  const manifest = state.projectManifest || {};
  if (els.activeProjectName) els.activeProjectName.textContent = manifest.titre || manifest.id || "Projet local";
  if (els.activeProjectVersion) els.activeProjectVersion.textContent = manifest.version ? `v${manifest.version}` : "";
  if (!els.projectSwitcherMenu) return;
  const recent = loadJson(RECENT_PROJECTS_KEY, []);
  const projects = [
    ...KNOWN_PROJECT_MANIFESTS,
    ...recent.filter((item) => !KNOWN_PROJECT_MANIFESTS.some((known) => known.id === item.id))
  ];
  const grouped = projects.reduce((groups, item) => {
    const group = item.group || "Imports récents";
    groups[group] ||= [];
    groups[group].push(item);
    return groups;
  }, {});
  els.projectSwitcherMenu.innerHTML = Object.entries(grouped).map(([group, entries]) => `
    <section class="project-menu-group">
      <p>${escapeHtml(group)}</p>
      ${entries.map((entry) => {
        const active = entry.url && sameProjectUrl(entry.url, state.projectManifestUrl);
        const unavailable = !entry.url;
        return `
          <button type="button" role="menuitem" data-project-url="${escapeHtml(entry.url || "")}" ${unavailable ? "disabled" : ""} class="${active ? "active" : ""}">
            <span>
              <strong>${escapeHtml(entry.title || entry.titre || entry.id || "Projet")}</strong>
              <small>${escapeHtml([entry.version ? `v${entry.version}` : "", entry.id || ""].filter(Boolean).join(" · "))}</small>
            </span>
            ${active ? "<i>check</i>" : ""}
          </button>
        `;
      }).join("")}
    </section>
  `).join("");
  els.projectSwitcherMenu.querySelectorAll("[data-project-url]").forEach((button) => {
    button.addEventListener("click", async () => {
      const url = button.dataset.projectUrl;
      if (!url || sameProjectUrl(url, state.projectManifestUrl)) {
        closeProjectMenu();
        return;
      }
      try {
        await loadProject(url, { updateUrl: true });
        if (state.realtimeStatus === "firebase") await reconnectRealtimeForDataset();
      } catch (error) {
        console.error(error);
        showToast("Projet indisponible");
      }
    });
  });
}

function sameProjectUrl(a, b) {
  if (!a || !b) return false;
  return new URL(a, window.location.href).href === new URL(b, window.location.href).href;
}

function updateProjectUrl(manifestUrl) {
  const url = new URL(window.location.href);
  if (sameProjectUrl(manifestUrl, DEFAULT_PROJECT_MANIFEST_URL)) url.searchParams.delete("project");
  else url.searchParams.set("project", manifestUrl);
  url.searchParams.delete("select");
  url.searchParams.delete("tab");
  url.searchParams.delete("comment");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function registerRecentProject(manifest) {
  const recent = loadJson(RECENT_PROJECTS_KEY, []);
  const entry = {
    id: manifest.id,
    title: manifest.titre || manifest.id,
    version: manifest.version || "",
    group: "Imports récents"
  };
  localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify([
    entry,
    ...recent.filter((item) => item.id !== manifest.id)
  ].slice(0, 8)));
}

function setupGraph() {
  state.graphView = ForceGraph3D()(els.graphStage)
    .backgroundColor("rgba(0,0,0,0)")
    .showNavInfo(false)
    .cooldownTicks(42)
    .warmupTicks(0)
    .nodeId("id")
    .nodeLabel((node) => graphHoverLabel(node))
    .nodeThreeObject(makeNodeObject)
    .nodeThreeObjectExtend(false)
    .linkColor(getGraphLinkColor)
    .linkWidth(getGraphLinkWidth)
    .linkDirectionalParticles(getGraphLinkParticles)
    .linkDirectionalParticleWidth(1.05)
    .linkDirectionalParticleColor((link) => getLinkTargetColor(link))
    .linkDirectionalParticleSpeed(0.0032)
    .onNodeClick((node) => {
      state.selectedLinkKey = null;
      state.selectedLinkPathIds = new Set();
      state.selectedLinkPathLinkKeys = new Set();
      if (node.type === "contribution") selectContributionNode(node, true);
      else selectNode(node.id, true);
    })
    .onLinkClick((link) => selectLink(link))
    .onBackgroundClick(() => exitGraphFocus())
    .onLinkHover((link) => {
      state.hoveredLinkKey = link ? getLinkKey(link) : null;
      els.graphStage.style.cursor = link ? "pointer" : "default";
      refreshGraphLinkStyles();
    })
    .onNodeDrag((node) => {
      node.fx = node.x;
      node.fy = node.y;
      node.fz = node.z;
      applyNodePosition(node);
    })
    .onNodeDragEnd((node) => {
      node.fx = node.x;
      node.fy = node.y;
      node.fz = node.z;
      applyNodePosition(node);
      persistNodePosition(node);
    })
    .onNodeHover((node) => {
      els.graphStage.style.cursor = node || state.hoveredLinkKey ? "pointer" : "default";
    })
    .onEngineTick(() => {
      state.tick = (state.tick || 0) + 1;
      if (state.tick % 3 === 0) renderPresence();
    });
  state.graphView.d3Force("charge").strength(-105);
  state.graphView.d3Force("link").distance((link) => getLinkDistance(link));
  state.graphView.d3AlphaDecay?.(0.055);
  state.graphView.d3VelocityDecay?.(0.46);
  window.addEventListener("resize", resizeGraph);
  resizeGraph();
}

function graphHoverLabel(node) {
  if (!node?.label) return "";
  const light = document.documentElement.dataset.theme === "light";
  const background = light ? "rgba(255,255,255,0.96)" : "rgba(7,16,21,0.92)";
  const color = light ? "#10242c" : "#f1f8f7";
  const border = light ? "rgba(22,54,64,0.24)" : "rgba(216,239,238,0.28)";
  return `<div style="max-width:240px;padding:6px 9px;border:1px solid ${border};border-radius:7px;background:${background};color:${color};box-shadow:0 12px 30px rgba(0,0,0,.18);font:800 12px/1.25 Inter,system-ui,sans-serif;text-align:center;white-space:normal;">${escapeHtml(node.label)}</div>`;
}

async function setupPresence() {
  state.providerVersion += 1;
  const useRealtime = hasFirebaseConfig() && loadJson(REALTIME_KEY, false);
  state.provider = createRealtimeProvider(useRealtime);
  bindRealtimeProvider(state.provider);
  await state.provider.connect({ userProfile: state.profile });
  setInterval(() => {
    if (state.realtimeStatus === "firebase") {
      state.provider.updatePresence({ selectedNodeId: state.selectedId || null });
    }
  }, 30000);
}

function bindRealtimeProvider(provider) {
  const version = state.providerVersion;
  provider.onPresence((presence) => {
    if (version !== state.providerVersion || provider !== state.provider) return;
    state.presence = normalizePresenceList(presence);
    renderPresence();
    renderPresenceStrip();
    if (state.activeTab === "discussion" && !isComposerActive()) {
      if (state.currentDiscussionEntityId?.startsWith(`${OVERVIEW_CONTEXT_PREFIX}:`)) renderDiscussion(getOverviewDiscussionEntity());
      else renderDiscussion();
    }
    renderCurrentPresenceSummary();
    renderConnectionStatus();
  });
  provider.onCommentsSnapshot((comments) => {
    if (version !== state.providerVersion || provider !== state.provider) return;
    state.comments = groupCommentsByEntity(comments);
    persistComments();
    rebuildGraph();
    if (state.activeTab === "discussion" && !isComposerActive()) {
      if (state.currentDiscussionEntityId?.startsWith(`${OVERVIEW_CONTEXT_PREFIX}:`)) renderDiscussion(getOverviewDiscussionEntity());
      else renderRightPanel();
    }
    renderAnalysis();
    renderActivityPanel();
  });
  provider.onActivity((activity) => {
    if (version !== state.providerVersion || provider !== state.provider) return;
    state.activity = activity;
    activity.filter((item) => item.actorId === state.authUid).forEach((item) => state.activityRead.add(item.id));
    persistActivityRead();
    renderActivityButton();
    renderActivityPanel();
  });
  provider.onGamification((scores) => {
    if (version !== state.providerVersion || provider !== state.provider) return;
    state.gamification.scores = scores || { global: null, project: null };
    localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(state.gamification.scores));
    renderGamificationCard();
  });
}

function normalizePresenceList(presence) {
  const seen = new Set();
  return (presence || [])
    .filter((item) => item?.clientId && item.displayName && item.displayName !== "undefined")
    .filter((item) => {
      if (seen.has(item.clientId)) return false;
      seen.add(item.clientId);
      return true;
    })
    .map((item) => ({
      ...item,
      avatar: item.avatar || getInitials(item.displayName || "Anonyme"),
      color: item.color || "#7dd3fc"
    }));
}

function renderCurrentPresenceSummary() {
  if (!els.presenceSummary) return;
  const selected = state.entities.get(state.selectedId);
  const selectedLink = state.selectedLinkKey ? state.graph.links.find((link) => getLinkKey(link) === state.selectedLinkKey) : null;
  renderPresenceSummary(selected, selectedLink);
}

function createRealtimeProvider(useFirebase) {
  const config = window.APP_CONFIG?.realtime || {};
  const firebaseReady = useFirebase && config.provider === "firebase" && config.firebase?.apiKey && config.firebase?.databaseURL;
  return firebaseReady ? new FirebaseRealtimeProvider(config) : new LocalRealtimeProvider();
}

async function loadDefaultProject() {
  const requestedManifest = new URLSearchParams(window.location.search).get("project");
  await loadProject(requestedManifest || DEFAULT_PROJECT_MANIFEST_URL, { updateUrl: false });
}

async function loadProject(manifestUrl, options = {}) {
  beginProjectSwitch(manifestUrl);
  showToast("Chargement du manifeste…");
  const manifestResponse = await fetch(manifestUrl, { cache: "no-store" });
  if (!manifestResponse.ok) throw new Error(`Manifest indisponible (${manifestResponse.status})`);
  const manifest = await manifestResponse.json();
  const baseUrl = new URL(".", new URL(manifestUrl, window.location.href)).href;
  state.projectManifestUrl = manifestUrl;
  state.projectManifest = manifest;
  state.projectBaseUrl = baseUrl;
  applyModelSchema(manifest.modele || DEFAULT_MODEL_SCHEMA, { resetFilters: true });
  renderProjectSwitcher();
  renderTypeFilters();
  renderAnalysis();
  const canonicalFiles = await loadManifestFiles(manifest, baseUrl, (loaded, total, path) => {
    const pct = total ? Math.round((loaded / total) * 100) : 0;
    showToast(`Chargement du projet… ${pct}% · ${loaded}/${total} fichiers${path ? ` · ${shortLabel(path, 34)}` : ""}`);
  });
  const sessions = loadJson(PROJECT_SESSIONS_KEY, {});
  const sessionKey = getProjectSessionKey(manifest);
  const saved = sessions[sessionKey] || loadJson(SESSION_KEY, null);
  const canRestore = saved?.projectId === manifest.id
    && saved?.projectVersion === manifest.version
    && Array.isArray(saved.files);
  state.projectManifest = canRestore && saved?.manifest ? { ...manifest, ...saved.manifest } : manifest;
  if (options.updateUrl !== false) updateProjectUrl(manifestUrl);
  loadFiles(canRestore ? saved.files : canonicalFiles, canRestore ? "Contenus restaurés" : "Exploration prête", { resetFilters: true });
}

function beginProjectSwitch(manifestUrl) {
  closeProjectMenu();
  closeGraphSearch();
  closeFilterMenu();
  closeResetConfirm();
  hideRightPanel();
  destroyContentEditor();
  resetGraphInteractionState();
  clearSearchState();
  state.files.clear();
  state.entities = new Map();
  state.graph = { nodes: [], links: [] };
  state.visibleGraph = { nodes: [], links: [] };
  state.activeTypes = new Set();
  for (const key of Object.keys(TYPE_CONFIG)) delete TYPE_CONFIG[key];
  state.searchDocs = [];
  state.searchIndex = null;
  state.projectManifestUrl = manifestUrl;
  state.projectManifest = { titre: "Chargement…", version: "" };
  updateSearchControl();
  renderSearchResults();
  renderProjectSwitcher();
  renderTypeFilters();
  renderAnalysis();
  state.graphView?.graphData({ nodes: [], links: [] });
  renderPresence();
  renderPresenceStrip();
}

async function loadManifestFiles(manifest, baseUrl, onProgress = null) {
  const paths = [...new Set((manifest.fichiers || []).filter((path) => {
    const extension = getFileExtension(path);
    return extension === "md" || PACK_ASSET_EXTENSIONS.has(extension);
  }))];
  let loaded = 0;
  onProgress?.(loaded, paths.length, "");
  const results = await Promise.all(paths.map(async (path) => {
    const response = await fetch(new URL(path, baseUrl), { cache: "no-store" });
    if (!response.ok) throw new Error(`Fichier absent du projet : ${path}`);
    const file = PACK_ASSET_EXTENSIONS.has(getFileExtension(path))
      ? { path, dataUrl: await blobToDataUrl(await response.blob()), binary: true }
      : { path, text: await response.text() };
    loaded += 1;
    onProgress?.(loaded, paths.length, path);
    return file;
  }));
  results.push({ path: "manifest.json", text: JSON.stringify(manifest, null, 2) });
  return results;
}

async function importUserFiles(fileList) {
  const imported = [];
  for (const file of fileList) {
    if (file.name.toLowerCase().endsWith(".zip")) {
      imported.push(...await extractZipEntries(await JSZip.loadAsync(file)));
    } else if (file.name.toLowerCase().endsWith(".md")) {
      imported.push({ path: file.name, text: await file.text() });
    } else if (PACK_ASSET_EXTENSIONS.has(getFileExtension(file.name))) {
      imported.push({ path: file.name, dataUrl: await blobToDataUrl(file), binary: true });
    }
  }
  if (!imported.length) {
    showToast("Aucun contenu lisible détecté");
    return;
  }
  const importedManifestFile = imported.find((file) => file.path.toLowerCase() === "manifest.json");
  const importedManifest = importedManifestFile ? parseJson(importedManifestFile.text) : null;
  let baseFiles = [...state.files.values()];
  let replacesProject = false;
  if (importedManifest?.id && importedManifest.id !== state.projectManifest?.id) {
    const replace = window.confirm(`Le pack « ${importedManifest.titre || importedManifest.id} » est un autre projet. Le charger à la place du projet courant ?`);
    if (!replace) return;
    replacesProject = true;
    state.files.clear();
    baseFiles = [];
    state.projectManifest = importedManifest;
  } else if (importedManifest) {
    state.projectManifest = { ...state.projectManifest, ...importedManifest };
  }
  if (importedManifest?.id) registerRecentProject(importedManifest);
  const existingPaths = new Set(baseFiles.map((file) => file.path));
  const conflicts = imported.filter((file) => existingPaths.has(file.path) && file.path !== "manifest.json");
  if (conflicts.length && !window.confirm(`${conflicts.length} fichier${conflicts.length > 1 ? "s" : ""} existe${conflicts.length > 1 ? "nt" : ""} déjà. Remplacer par la version importée ?`)) {
    return;
  }
  loadFiles([...baseFiles, ...imported], importedManifest ? "Pack chargé" : "Contenus ajoutés", { resetFilters: replacesProject });
  if (state.realtimeStatus === "firebase") await reconnectRealtimeForDataset();
  els.dropOverlay.classList.add("hidden");
  els.packInput.value = "";
}

async function reconnectRealtimeForDataset() {
  await state.provider?.disconnect?.();
  state.comments = {};
  state.activity = [];
  rebuildGraph();
  state.providerVersion += 1;
  state.provider = createRealtimeProvider(true);
  bindRealtimeProvider(state.provider);
  await state.provider.connect({ userProfile: state.profile });
}

async function extractZipEntries(zip) {
  const entries = Object.values(zip.files).filter((item) => !item.dir);
  const roots = entries.map((entry) => entry.name.split("/")[0]).filter(Boolean);
  const commonRoot = roots.length && roots.every((root) => root === roots[0]) ? `${roots[0]}/` : "";
  const files = [];
  for (const entry of entries) {
    const path = commonRoot ? entry.name.slice(commonRoot.length) : entry.name;
    const extension = getFileExtension(path);
    if (PACK_ASSET_EXTENSIONS.has(extension)) {
      files.push({
        path,
        dataUrl: `data:${PACK_ASSET_MIME_TYPES[extension]};base64,${await entry.async("base64")}`,
        binary: true
      });
      continue;
    }
    if (extension !== "md" && extension !== "json") continue;
    files.push({
      path,
      text: await entry.async("string")
    });
  }
  return files;
}

function loadFiles(files, message, options = {}) {
  files.forEach((file) => state.files.set(file.path, file));
  applyModelSchema(state.projectManifest?.modele || DEFAULT_MODEL_SCHEMA, { resetFilters: options.resetFilters === true });
  state.entities = parseEntities([...state.files.values()]);
  state.datasetId = makeDatasetId([...state.entities.keys()].join("|"));
  state.gamification.scores = { ...state.gamification.scores, project: null };
  resetGamificationCycle();
  state.graph = buildGraph(state.entities);
  restoreGraphLayout();
  if (state.selectedId && !state.entities.has(state.selectedId)) hideRightPanel();
  buildSearchIndex();
  saveSession();
  updateVisibleGraph();
  renderProjectSwitcher();
  renderAnalysis();
  if (state.selectedId) renderRightPanel();
  scheduleInitialFit();
  showToast(`${message} · ${state.graph.nodes.length} éléments`);
}

function updateVisibleGraph(options = {}) {
  if (!options.skipPositionSync) syncGraphPositionsFromView();
  const selectedLinkPaths = getSelectedLinkPath();
  const selectedNodePaths = getSelectedNodePath();
  state.selectedLinkPathIds = selectedLinkPaths.nodeIds;
  state.selectedLinkPathLinkKeys = selectedLinkPaths.linkKeys;
  const selectedPathIds = getSelectedPathIds(selectedLinkPaths, selectedNodePaths);
  const selectedPathLinkKeys = state.selectedLinkKey ? selectedLinkPaths.linkKeys : selectedNodePaths.linkKeys;
  state.selectedPathIds = selectedPathIds;
  state.selectedPathLinkKeys = selectedPathLinkKeys;
  const focusActive = isGraphFocusActive();
  const nodes = state.graph.nodes
    .filter((node) => {
      const typeVisible = node.type === "contribution"
      ? state.realtimeStatus === "firebase" && state.activeTypes.has("contribution")
      : state.activeTypes.has(node.type);
      return typeVisible && (!focusActive || selectedPathIds.has(node.id));
    })
    .map((node) => ({ ...node }));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const links = state.graph.links
    .filter((link) => nodeIds.has(getId(link.source)) && nodeIds.has(getId(link.target)))
    .filter((link) => {
      if (!focusActive) return true;
      const source = getId(link.source);
      const target = getId(link.target);
      if (state.selectedLinkKey) return selectedLinkPaths.linkKeys.has(getLinkKey(link));
      if (state.selectedId) return selectedPathLinkKeys.has(getLinkKey(link));
      return true;
    })
    .map((link) => {
      const source = getId(link.source);
      const target = getId(link.target);
      const linkKey = getLinkKey(link);
      return {
        ...link,
        source,
        target,
        highlight: selectedPathLinkKeys.has(linkKey),
        hover: state.hoveredLinkKey === linkKey
      };
    });
  state.visibleGraph = { nodes, links };
  state.graphView.graphData(state.visibleGraph);
  softenGraphMotion();
  updateFocusDepthLabel();
  renderPresence();
  renderPresenceStrip();
  setTimeout(renderPresence, 300);
}

function syncGraphPositionsFromView() {
  if (!state.visibleGraph?.nodes?.length) return;
  const byId = new Map(state.visibleGraph.nodes.map((node) => [node.id, node]));
  for (const node of state.graph.nodes) {
    const current = byId.get(node.id);
    if (!current || current.x == null) continue;
    node.x = current.x;
    node.y = current.y;
    node.z = current.z;
    if (current.vx != null) node.vx = current.vx;
    if (current.vy != null) node.vy = current.vy;
    if (current.vz != null) node.vz = current.vz;
    if (current.fx != null) node.fx = current.fx;
    if (current.fy != null) node.fy = current.fy;
    if (current.fz != null) node.fz = current.fz;
  }
}

function getSelectedPathIds(selectedLinkPaths = getSelectedLinkPath(), selectedNodePaths = getSelectedNodePath()) {
  const ids = new Set([...state.searchMatchedIds]);
  if (state.selectedLinkKey) {
    for (const id of selectedLinkPaths.nodeIds || []) ids.add(id);
    if (state.selectedId) ids.add(state.selectedId);
    return ids;
  }
  if (state.selectedId) {
    for (const id of selectedNodePaths.nodeIds || []) ids.add(id);
    return ids;
  }
  return ids;
}

function getSelectedNodePath() {
  if (!state.selectedId) return { nodeIds: new Set(), linkKeys: new Set() };
  const nodeIds = new Set([state.selectedId]);
  const linkKeys = new Set();
  let frontier = new Set([state.selectedId]);
  const visited = new Set([state.selectedId]);
  const depth = getFocusDepth();
  for (let step = 0; step < depth; step += 1) {
    const next = new Set();
    for (const link of state.graph.links) {
      const source = getId(link.source);
      const target = getId(link.target);
      const sourceInFrontier = frontier.has(source);
      const targetInFrontier = frontier.has(target);
      if (!sourceInFrontier && !targetInFrontier) continue;
      const other = sourceInFrontier ? target : source;
      linkKeys.add(getLinkKey(link));
      nodeIds.add(source);
      nodeIds.add(target);
      if (!visited.has(other)) {
        visited.add(other);
        next.add(other);
      }
    }
    if (!next.size) break;
    frontier = next;
  }
  return { nodeIds, linkKeys };
}

function getSelectedLinkPath() {
  if (!state.selectedLinkKey) return { nodeIds: new Set(), linkKeys: new Set() };
  const selected = state.graph.links.find((link) => getLinkKey(link) === state.selectedLinkKey);
  if (!selected) return { nodeIds: new Set(), linkKeys: new Set() };
  const nodeIds = new Set([getId(selected.source), getId(selected.target)]);
  const linkKeys = new Set([getLinkKey(selected)]);
  const depth = getFocusDepth();
  collectPrimaryIncomingLink(getId(selected.source), nodeIds, linkKeys, 0, new Set(), depth);
  collectPrimaryOutgoingLink(getId(selected.target), nodeIds, linkKeys, 0, new Set(), depth);
  return { nodeIds, linkKeys };
}

function collectPrimaryIncomingLink(nodeId, nodeIds, linkKeys, depth = 0, visitedNodes = new Set(), maxDepth = getFocusDepth()) {
  if (depth >= maxDepth || linkKeys.size >= LINK_FOCUS_MAX_LINKS || visitedNodes.has(nodeId)) return;
  visitedNodes.add(nodeId);
  const link = pickPrimaryLink(state.graph.links.filter((item) => getId(item.target) === nodeId && !linkKeys.has(getLinkKey(item))));
  if (!link) return;
  const key = getLinkKey(link);
  linkKeys.add(key);
  const source = getId(link.source);
  nodeIds.add(source);
  nodeIds.add(nodeId);
  collectPrimaryIncomingLink(source, nodeIds, linkKeys, depth + 1, new Set(visitedNodes), maxDepth);
}

function collectPrimaryOutgoingLink(nodeId, nodeIds, linkKeys, depth = 0, visitedNodes = new Set(), maxDepth = getFocusDepth()) {
  if (depth >= maxDepth || linkKeys.size >= LINK_FOCUS_MAX_LINKS || visitedNodes.has(nodeId)) return;
  visitedNodes.add(nodeId);
  const link = pickPrimaryLink(state.graph.links.filter((item) => getId(item.source) === nodeId && !linkKeys.has(getLinkKey(item))));
  if (!link) return;
  const key = getLinkKey(link);
  linkKeys.add(key);
  const target = getId(link.target);
  nodeIds.add(nodeId);
  nodeIds.add(target);
  collectPrimaryOutgoingLink(target, nodeIds, linkKeys, depth + 1, new Set(visitedNodes), maxDepth);
}

function pickPrimaryLink(links) {
  return [...links].sort((a, b) => {
    const weight = Number(b.weight || 0) - Number(a.weight || 0);
    if (weight) return weight;
    const bTarget = state.entities.get(getId(b.target));
    const aTarget = state.entities.get(getId(a.target));
    return Number(bTarget?.influence_score || bTarget?.dependence_score || 0) - Number(aTarget?.influence_score || aTarget?.dependence_score || 0);
  })[0] || null;
}

function getFocusDepth() {
  return Math.max(1, Math.min(5, Number(state.graphPrefs.focusDepth || DEFAULT_GRAPH_PREFS.focusDepth)));
}

function isLinkHighlighted(link) {
  if (state.focusSuppressed) return false;
  const key = getLinkKey(link);
  if (state.selectedLinkKey) return Boolean(link.highlight) || state.selectedLinkPathLinkKeys?.has(key);
  return Boolean(link.highlight)
    || state.selectedLinkPathLinkKeys?.has(key)
    || (state.selectedPathIds?.has(getId(link.source)) && state.selectedPathIds?.has(getId(link.target)));
}

function isGraphFocusActive() {
  return Boolean(state.graphPrefs.focusMode && !state.focusSuppressed && (state.selectedId || state.selectedLinkKey || state.searchMatchedIds?.size));
}

function hasAnimatedSelection() {
  return Boolean(!state.focusSuppressed && (state.selectedId || state.selectedLinkKey));
}

function getGraphLinkColor(link) {
  if (!state.graphPrefs.showLinks) return "rgba(0,0,0,0)";
  if (isLinkHighlighted(link)) return getLinkTargetColor(link);
  if (state.hoveredLinkKey === getLinkKey(link)) return "rgba(237, 247, 246, 0.7)";
  if (isGraphFocusActive()) return "rgba(115, 133, 139, 0)";
  return "rgba(180, 210, 214, 0.13)";
}

function getGraphLinkWidth(link) {
  if (!state.graphPrefs.showLinks) return 0;
  if (isLinkHighlighted(link)) return Math.max(1.65, Math.min(3.2, (link.weight || 1) * 1.14));
  if (state.hoveredLinkKey === getLinkKey(link)) return 1.3;
  if (isGraphFocusActive()) return 0;
  return Math.max(0.18, (link.weight || 1) * 0.22);
}

function getGraphLinkParticles(link) {
  if (!state.graphPrefs.showLinks || !state.graphPrefs.showMotion) return 0;
  if (!hasAnimatedSelection()) return 0;
  return isLinkHighlighted(link) ? 1 : 0;
}

function refreshGraphLinkStyles() {
  if (!state.graphView) return;
  state.graphView
    .linkColor(getGraphLinkColor)
    .linkWidth(getGraphLinkWidth)
    .linkDirectionalParticles(getGraphLinkParticles);
}

function softenGraphMotion() {
  state.graphView.d3AlphaTarget?.(0);
  state.graphView.d3VelocityDecay?.(0.5);
  setTimeout(() => state.graphView?.d3AlphaTarget?.(0), 160);
}

function renderTypeFilters() {
  els.typeFilters.innerHTML = "";
  const entries = Object.entries(TYPE_CONFIG);
  if (state.realtimeStatus === "firebase") {
    if (!state.contributionFilterInitialized) {
      state.activeTypes.add("contribution");
      state.contributionFilterInitialized = true;
    }
    entries.push(["contribution", CONTRIBUTION_FILTER]);
  } else {
    state.activeTypes.delete("contribution");
    state.contributionFilterInitialized = false;
  }
  const enabledCount = entries.filter(([type]) => state.activeTypes.has(type)).length;
  const focusSummary = getFocusSummary();
  const focusDepthDisabled = !state.graphPrefs.focusMode || (!state.selectedId && !state.selectedLinkKey);
  renderQuickTypeFilters(entries);
  els.typeFilters.innerHTML = `
    <header class="graph-options-head">
      <div>
        <strong>Affichage du graphe</strong>
        <small>${enabledCount}/${entries.length} types visibles</small>
      </div>
      <button class="graph-options-mini" type="button" data-filter-action="all">Tout afficher</button>
    </header>
    <section class="graph-options-section">
      <p class="graph-options-kicker">Types d’éléments</p>
      <div class="graph-type-grid">
        ${entries.map(([type, config]) => `
          <button class="graph-type-toggle${state.activeTypes.has(type) ? " active" : ""}" type="button" data-type-filter="${escapeHtml(type)}" aria-pressed="${state.activeTypes.has(type)}">
            <span class="dot" style="background:${config.color}"></span>
            <span>${escapeHtml(config.label)}</span>
          </button>
        `).join("")}
      </div>
    </section>
    <section class="graph-options-section">
      <p class="graph-options-kicker">Lecture</p>
      <div class="graph-label-mode" role="group" aria-label="Mode d’affichage des labels">
        ${[
          ["auto", "Labels utiles"],
          ["all", "Tous les labels"],
          ["none", "Sans labels"]
        ].map(([value, label]) => `
          <button class="${state.graphPrefs.labelMode === value ? "active" : ""}" type="button" data-label-mode="${value}" aria-pressed="${state.graphPrefs.labelMode === value}">
            ${label}
          </button>
        `).join("")}
      </div>
      <div class="graph-option-switches">
        ${renderGraphOptionSwitch("showLinks", "Liens visibles", "Affiche ou masque les relations")}
        ${renderGraphOptionSwitch("showMotion", "Animations", "Active les particules de direction")}
        ${renderGraphOptionSwitch("focusMode", "Mode focus", "Atténue les éléments hors contexte")}
      </div>
      <label class="graph-depth-control">
        <span>
          <strong>Voisinage</strong>
          <small data-focus-depth-label>${focusDepthDisabled ? "Sélectionnez un nœud ou un lien pour l’appliquer" : `${getFocusDepth()} niveau${getFocusDepth() > 1 ? "x" : ""} · ${focusSummary}`}</small>
        </span>
        <input type="range" min="1" max="5" step="1" value="${getFocusDepth()}" data-focus-depth ${focusDepthDisabled ? "disabled" : ""}>
      </label>
    </section>
  `;
  els.typeFilters.querySelector("[data-filter-action='all']")?.addEventListener("click", () => {
    state.activeTypes = new Set(entries.map(([type]) => type));
    renderTypeFilters();
    updateVisibleGraph();
  });
  els.typeFilters.querySelectorAll("[data-type-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.typeFilter;
      if (state.activeTypes.has(type)) state.activeTypes.delete(type);
      else state.activeTypes.add(type);
      if (!state.activeTypes.size) state.activeTypes.add(type);
      renderTypeFilters();
      updateVisibleGraph();
    });
  });
  els.typeFilters.querySelectorAll("[data-label-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.graphPrefs.labelMode = button.dataset.labelMode;
      state.focusSuppressed = false;
      persistGraphPrefs();
      renderTypeFilters();
      updateVisibleGraph();
    });
  });
  els.typeFilters.querySelectorAll("[data-graph-pref]").forEach((input) => {
    input.addEventListener("change", () => {
      state.graphPrefs[input.dataset.graphPref] = input.checked;
      state.focusSuppressed = false;
      persistGraphPrefs();
      renderTypeFilters();
      updateVisibleGraph();
    });
  });
  const depthInput = els.typeFilters.querySelector("[data-focus-depth]");
  depthInput?.addEventListener("input", (event) => {
    state.graphPrefs.focusDepth = Number(event.target.value);
    state.focusSuppressed = false;
    const label = els.typeFilters.querySelector("[data-focus-depth-label]");
    if (label) label.textContent = `${getFocusDepth()} niveau${getFocusDepth() > 1 ? "x" : ""} autour de la sélection`;
    clearTimeout(state.focusDepthTimer);
    state.focusDepthTimer = setTimeout(() => {
      persistGraphPrefs();
      updateVisibleGraph();
      updateFocusDepthLabel();
    }, 120);
  });
}

function getFocusSummary() {
  const nodes = state.selectedLinkKey ? state.selectedLinkPathIds : state.selectedPathIds;
  const links = state.selectedLinkKey ? state.selectedLinkPathLinkKeys : state.selectedPathLinkKeys;
  const nodeCount = nodes?.size || 0;
  const linkCount = links?.size || 0;
  if (!nodeCount && !linkCount) return "focus prêt";
  return `${nodeCount} élément${nodeCount > 1 ? "s" : ""}, ${linkCount} lien${linkCount > 1 ? "s" : ""}`;
}

function updateFocusDepthLabel() {
  const label = els.typeFilters?.querySelector("[data-focus-depth-label]");
  const input = els.typeFilters?.querySelector("[data-focus-depth]");
  const disabled = !state.graphPrefs.focusMode || (!state.selectedId && !state.selectedLinkKey);
  if (input) input.disabled = disabled;
  if (!label) return;
  if (disabled) {
    label.textContent = "Sélectionnez un nœud ou un lien pour l’appliquer";
    return;
  }
  label.textContent = `${getFocusDepth()} niveau${getFocusDepth() > 1 ? "x" : ""} · ${getFocusSummary()}`;
}

function renderQuickTypeFilters(entries) {
  if (!els.quickTypeFilters) return;
  els.quickTypeFilters.innerHTML = entries.map(([type, config]) => `
    <button class="quick-type-filter${state.activeTypes.has(type) ? "" : " muted"}" type="button" data-quick-type-filter="${escapeHtml(type)}" aria-pressed="${state.activeTypes.has(type)}">
      <span class="dot" style="background:${config.color}"></span>
      <span>${escapeHtml(config.label)}</span>
    </button>
  `).join("");
  els.quickTypeFilters.querySelectorAll("[data-quick-type-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.quickTypeFilter;
      if (state.activeTypes.has(type)) state.activeTypes.delete(type);
      else state.activeTypes.add(type);
      if (!state.activeTypes.size) state.activeTypes.add(type);
      renderTypeFilters();
      updateVisibleGraph();
    });
  });
}

function renderGraphOptionSwitch(key, label, hint) {
  return `
    <div class="graph-option-switch">
      <span>
        <strong>${escapeHtml(label)}</strong>
        <small>${escapeHtml(hint)}</small>
      </span>
      <label class="switch">
        <input type="checkbox" data-graph-pref="${key}" ${state.graphPrefs[key] ? "checked" : ""}>
        <span></span>
      </label>
    </div>
  `;
}

function persistGraphPrefs() {
  localStorage.setItem(GRAPH_PREFS_KEY, JSON.stringify(state.graphPrefs));
}

function selectNode(id, moveCamera = false) {
  state.selectedId = id;
  state.selectedLinkKey = null;
  state.focusSuppressed = false;
  state.selectedLinkPathIds = new Set();
  state.selectedLinkPathLinkKeys = new Set();
  state.highlightedCommentId = null;
  state.provider?.updatePresence({ selectedNodeId: id });
  renderRightPanel();
  renderAnalysis();
  document.querySelector("#app").classList.add("right-open");
  els.rightPanel.classList.remove("hidden");
  updateVisibleGraph();
  scheduleGraphResize();
  if (moveCamera) fitFocusedSelection(id);
  updateDeepLink();
}

function selectContributionNode(node, moveCamera = false) {
  state.selectedId = node.entityId;
  state.selectedLinkKey = null;
  state.focusSuppressed = false;
  state.selectedLinkPathIds = new Set();
  state.selectedLinkPathLinkKeys = new Set();
  state.activeTab = "discussion";
  state.replyTo = null;
  state.highlightedCommentId = node.commentId;
  document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item.dataset.tab === "discussion"));
  state.provider?.updatePresence({ selectedNodeId: node.entityId });
  renderRightPanel();
  renderAnalysis();
  document.querySelector("#app").classList.add("right-open");
  els.rightPanel.classList.remove("hidden");
  updateVisibleGraph();
  scheduleGraphResize();
  if (moveCamera) fitFocusedSelection(node.entityId || node.id);
  updateDeepLink(node.commentId);
  requestAnimationFrame(() => {
    els.panelContent.querySelector(`[data-comment-id="${cssEscape(node.commentId)}"], [data-thread="${cssEscape(node.commentId)}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

function selectLink(link) {
  state.selectedLinkKey = getLinkKey(link);
  state.focusSuppressed = false;
  state.highlightedCommentId = null;
  const targetId = getId(link.target);
  const sourceId = getId(link.source);
  updateVisibleGraph();
  renderAnalysis();
  focusSelectedLinkPath(sourceId, targetId);
}

function exitGraphFocus() {
  if (!state.graphPrefs.focusMode || state.focusSuppressed || (!state.selectedId && !state.selectedLinkKey && !state.searchMatchedIds?.size)) return;
  state.focusSuppressed = true;
  state.hoveredLinkKey = null;
  updateVisibleGraph();
  renderAnalysis();
}

function applyInitialDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const entityId = params.get("select");
  if (!entityId || !state.entities.has(entityId)) return;
  state.activeTab = params.get("tab") === "discussion" ? "discussion" : "overview";
  state.highlightedCommentId = params.get("comment");
  selectNode(entityId, false);
  state.highlightedCommentId = params.get("comment");
  document.querySelectorAll("#panel-tabs .tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === state.activeTab);
  });
  renderRightPanel();
  updateDeepLink(state.highlightedCommentId);
  if (state.highlightedCommentId) {
    requestAnimationFrame(() => {
      els.panelContent.querySelector(`[data-comment-id="${cssEscape(state.highlightedCommentId)}"], [data-thread="${cssEscape(state.highlightedCommentId)}"]`)?.scrollIntoView({ block: "center" });
    });
  }
}

function buildDeepLink({ entityId = state.selectedId, tab = state.activeTab, commentId = null } = {}) {
  const url = new URL(window.location.href);
  if (entityId) url.searchParams.set("select", entityId);
  else url.searchParams.delete("select");
  if (entityId && tab === "discussion") url.searchParams.set("tab", "discussion");
  else url.searchParams.delete("tab");
  if (entityId && commentId) url.searchParams.set("comment", commentId);
  else url.searchParams.delete("comment");
  return url;
}

function updateDeepLink(commentId = state.highlightedCommentId) {
  const url = buildDeepLink({ commentId });
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

async function copyDeepLink(options = {}) {
  const url = buildDeepLink(options).href;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    const input = document.createElement("textarea");
    input.value = url;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }
  showToast("Lien copié");
}

function renderRightPanel() {
  const entity = state.entities.get(state.selectedId);
  if (!entity) return;
  els.panelKicker.textContent = TYPE_CONFIG[entity.type]?.singular || TYPE_LABELS[entity.type] || "Sélection";
  els.panelTitle.textContent = entity.label;
  if (state.activeTab === "overview") renderOverview(entity);
  if (state.activeTab === "discussion") renderDiscussion(entity);
}

function getOverviewDiscussionEntity() {
  const manifest = state.projectManifest || {};
  return {
    id: getOverviewContextId(),
    type: "overview",
    label: manifest.titre || manifest.id || "Vue d’ensemble",
    summary: manifest.description || "Échanges et réactions associés à la vue d’ensemble du projet."
  };
}

function getOverviewContextId() {
  return `${OVERVIEW_CONTEXT_PREFIX}:${state.datasetId || state.projectManifest?.id || "project"}`;
}

function openOverviewDiscussion() {
  state.selectedId = null;
  state.selectedLinkKey = null;
  state.activeTab = "discussion";
  state.replyTo = null;
  state.highlightedCommentId = null;
  els.rightPanel.classList.remove("hidden");
  document.querySelector("#app")?.classList.add("right-open");
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === "discussion"));
  const entity = getOverviewDiscussionEntity();
  els.panelKicker.textContent = "Vue d’ensemble";
  els.panelTitle.textContent = entity.label;
  renderDiscussion(entity);
  updateDeepLink();
  scheduleGraphResize();
}

function renderOverviewMetaDetails() {
  destroyContentEditor();
  const manifest = state.projectManifest || {};
  const generatedAt = formatManifestDate(manifest.date_generation);
  const fileCount = Array.isArray(manifest.fichiers) ? manifest.fichiers.length : state.files.size;
  els.panelContent.innerHTML = `
    <article class="readable-card overview-details-card">
      <p class="lead">${escapeHtml(manifest.description || "Aucune description fournie dans le manifeste du projet.")}</p>
      <h2>${escapeHtml(manifest.titre || manifest.id || "Vue d’ensemble")}</h2>
      <dl class="overview-detail-list">
        <div><dt>Identifiant</dt><dd>${escapeHtml(manifest.id || state.datasetId || "Non renseigné")}</dd></div>
        <div><dt>Version</dt><dd>${escapeHtml(manifest.version || "Non renseignée")}</dd></div>
        <div><dt>Génération</dt><dd>${escapeHtml(generatedAt || "Non renseignée")}</dd></div>
        <div><dt>Fichiers chargés</dt><dd>${fileCount}</dd></div>
      </dl>
    </article>
  `;
}

function renderOverview(entity) {
  destroyContentEditor();
  if (state.editMode) {
    renderEditForm(entity);
    return;
  }
  const related = renderInlineRelations(entity);
  els.panelContent.innerHTML = `
    <article class="readable-card">
      ${entity.summary ? `<p class="lead">${escapeHtml(entity.summary)}</p>` : ""}
      <div class="rendered-content">${renderMarkdownWithEntityLinks(entity.body, entity.path)}</div>
    </article>
    ${related ? `<section class="meta-section relation-section"><h3>Éléments liés</h3>${related}</section>` : ""}
    <footer class="reading-actions reading-footer">
      <span class="quiet">${escapeHtml(entity.path || "")}</span>
      <div class="reading-footer-actions">
        <div class="edit-toggle">
          <i>edit</i>
          <span>Modifier</span>
          <label class="switch">
            <input id="edit-toggle" type="checkbox">
            <span></span>
          </label>
          <span class="tooltip top">Modifier cette fiche sur cet appareil</span>
        </div>
        <button class="comment-permalink fiche-permalink" data-copy-entity-link="${escapeHtml(entity.id)}" type="button" aria-label="Copier le lien de cette fiche">
          <i>link</i>
        </button>
      </div>
    </footer>
  `;
  els.panelContent.querySelector("#edit-toggle").addEventListener("change", (event) => {
    state.editMode = event.target.checked;
    renderRightPanel();
  });
  els.panelContent.querySelector("[data-copy-entity-link]")?.addEventListener("click", () => copyDeepLink({ entityId: entity.id }));
  highlightRenderedSearchMatches();
  decorateSmartLinks(els.panelContent);
  bindInlineEntityClicks();
}

function renderInlineRelations(entity) {
  const links = state.graph.links.filter((link) => getId(link.source) === entity.id || getId(link.target) === entity.id);
  const items = [];
  for (const link of links) {
    const otherId = getId(link.source) === entity.id ? getId(link.target) : getId(link.source);
    const other = state.entities.get(otherId);
    if (!other || items.some((item) => item.id === other.id)) continue;
    items.push(other);
  }
  if (!items.length) return "";
  return `<div class="relation-chips">${items.slice(0, 24).map((item) => inlineEntityButton(item)).join("")}</div>`;
}

function inlineEntityButton(entity) {
  const color = TYPE_CONFIG[entity.type]?.color || "#9aa6ad";
  return `<button class="inline-entity" data-node="${escapeHtml(entity.id)}" type="button">
    <span class="dot" style="background:${color}"></span>${escapeHtml(entity.label)}
  </button>`;
}

function bindInlineEntityClicks() {
  els.panelContent.querySelectorAll("[data-node]").forEach((button) => {
    button.addEventListener("click", () => selectNode(button.dataset.node, true));
  });
}

function highlightRenderedSearchMatches() {
  if (!state.searchQuery.trim()) return;
  const root = els.panelContent.querySelector(".rendered-content");
  if (!root) return;
  const pattern = escapeRegExp(state.searchQuery.trim());
  if (!pattern) return;
  const regex = new RegExp(pattern, "gi");
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim() || !regex.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
      regex.lastIndex = 0;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    node.nodeValue.replace(regex, (match, offset) => {
      fragment.append(document.createTextNode(node.nodeValue.slice(lastIndex, offset)));
      const mark = document.createElement("mark");
      mark.className = "search-highlight";
      mark.textContent = match;
      fragment.append(mark);
      lastIndex = offset + match.length;
      return match;
    });
    fragment.append(document.createTextNode(node.nodeValue.slice(lastIndex)));
    node.parentNode.replaceChild(fragment, node);
  }
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderDiscussion(entity = state.entities.get(state.selectedId)) {
  if (!entity) return;
  state.currentDiscussionEntityId = entity.id;
  const online = state.realtimeStatus === "firebase";
  const comments = (state.comments[entity.id] || []).filter((comment) => !comment.deletedAt && !comment.systemKind);
  const presence = entity.id?.startsWith(`${OVERVIEW_CONTEXT_PREFIX}:`)
    ? state.presence
    : state.presence.filter((item) => item.selectedNodeId === entity.id);
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
  els.panelContent.innerHTML = `
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
  els.panelContent.querySelector("#send-comment")?.addEventListener("click", addComment);
  els.panelContent.querySelector("#send-reply")?.addEventListener("click", addComment);
  els.panelContent.querySelector("#comment-input")?.addEventListener("input", (event) => saveDraft(entity.id, null, event.target.value));
  els.panelContent.querySelector("#reply-input")?.addEventListener("input", (event) => saveDraft(entity.id, state.replyTo, event.target.value));
  els.panelContent.querySelectorAll("#comment-input, #reply-input").forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault();
        addComment();
      }
    });
  });
  els.panelContent.querySelector("#discussion-sync-switch")?.addEventListener("change", () => activateRealtime(document.querySelector("#toggle-avatars")));
  els.panelContent.querySelector("#cancel-reply")?.addEventListener("click", () => {
      state.replyTo = null;
      renderRightPanel();
    });
  els.panelContent.querySelectorAll("[data-follow]").forEach((button) => {
    button.addEventListener("click", () => followUser(button.dataset.follow));
  });
  els.panelContent.querySelectorAll("[data-expand-presence]").forEach((button) => {
    button.addEventListener("click", () => button.closest(".discussion-presence")?.classList.toggle("expanded"));
  });
  els.panelContent.querySelectorAll("[data-reply]").forEach((button) => {
    button.addEventListener("click", () => startReply(button.dataset.reply));
  });
  els.panelContent.querySelectorAll("[data-copy-comment-link]").forEach((button) => {
    button.addEventListener("click", () => copyDeepLink({ entityId: entity.id, tab: "discussion", commentId: button.dataset.copyCommentLink }));
  });
  els.panelContent.querySelectorAll("[data-delete-comment]").forEach((button) => {
    button.addEventListener("click", () => deleteComment(entity.id, button.dataset.deleteComment));
  });
  els.panelContent.querySelectorAll("[data-reaction]").forEach((button) => {
    button.addEventListener("click", () => reactToComment(entity.id, button.dataset.commentId, {
      emoji: button.dataset.reaction,
      annotation: button.dataset.annotation || ""
    }));
  });
  els.panelContent.querySelectorAll("[data-reaction-picker]").forEach((button) => {
    button.addEventListener("click", () => openEmojiPicker(entity.id, button.dataset.reactionPicker, button));
  });
  els.panelContent.querySelectorAll("[data-entity-reaction]").forEach((button) => {
    button.addEventListener("click", () => reactToEntity(entity.id, {
      emoji: button.dataset.entityReaction,
      annotation: button.dataset.annotation || ""
    }));
  });
  els.panelContent.querySelectorAll("[data-entity-reaction-picker]").forEach((button) => {
    button.addEventListener("click", () => openEntityEmojiPicker(button.dataset.entityReactionPicker, button));
  });
  if (state.highlightedCommentId) {
    requestAnimationFrame(() => {
      els.panelContent.querySelector(`[data-comment-id="${cssEscape(state.highlightedCommentId)}"], [data-thread="${cssEscape(state.highlightedCommentId)}"]`)?.scrollIntoView({ block: "center" });
    });
  }
}


function renderEditForm(entity) {
  destroyContentEditor();
  els.panelContent.innerHTML = `
    <div class="switch-row edit-mode">
      <span class="edit-mode-label"><i>edit</i>Modifier</span>
      <label class="switch">
        <input id="edit-toggle" type="checkbox" checked>
        <span></span>
      </label>
    </div>
    <div class="local-edit-warning"><i>info</i><span>Ces modifications restent locales à ce navigateur jusqu’à l’export et au partage d’un nouveau pack.</span></div>
    <label class="field-label">Titre
      <input id="adjust-label" class="text-field" type="text" value="${escapeHtml(entity.label)}">
    </label>
    <label class="field-label">Résumé
      <textarea id="adjust-summary" rows="5">${escapeHtml(entity.summary || "")}</textarea>
    </label>
    <label class="field-label">Contenu</label>
    <div id="content-editor" class="content-editor"></div>
    <textarea id="adjust-body" class="content-editor-fallback" rows="14">${escapeHtml(entity.body || "")}</textarea>
    <button id="apply-adjust" class="primary-button" type="button">Enregistrer</button>
    <button id="download-current" class="secondary-button" type="button">Exporter cette fiche</button>
  `;
  els.panelContent.querySelector("#edit-toggle").addEventListener("change", (event) => {
    state.editMode = event.target.checked;
    renderRightPanel();
  });
  setupContentEditor(entity);
  els.panelContent.querySelector("#apply-adjust").addEventListener("click", () => {
    entity.label = els.panelContent.querySelector("#adjust-label").value.trim() || entity.label;
    entity.summary = els.panelContent.querySelector("#adjust-summary").value.trim();
    entity.body = getEditedMarkdown();
    updateFileFromEntity(entity);
    entity.imageURL = getFirstMarkdownImage(entity.body, entity.path);
    rebuildGraph();
    state.editMode = false;
    renderRightPanel();
    showToast("Modification enregistrée");
  });
  els.panelContent.querySelector("#download-current").addEventListener("click", exportSelected);
}

function setupContentEditor(entity) {
  const mount = els.panelContent.querySelector("#content-editor");
  const fallback = els.panelContent.querySelector("#adjust-body");
  if (!mount || !window.toastui?.Editor) {
    mount?.classList.add("hidden");
    fallback?.classList.remove("content-editor-fallback");
    return;
  }
  fallback.hidden = true;
  state.contentEditorAssetMap = new Map();
  const editorMarkdown = resolveEditorMarkdownAssets(entity.body || "", entity.path);
  state.contentEditor = new window.toastui.Editor({
    el: mount,
    height: "520px",
    theme: document.documentElement.dataset.theme === "light" ? undefined : "dark",
    initialEditType: "wysiwyg",
    previewStyle: "vertical",
    initialValue: editorMarkdown,
    language: "fr-FR",
    usageStatistics: false,
    hideModeSwitch: false,
    toolbarItems: [
      ["heading", "bold", "italic", "strike"],
      ["hr", "quote"],
      ["ul", "ol", "task", "table"],
      ["link", "image"],
      ["code", "codeblock"]
    ],
    hooks: {
      addImageBlobHook: async (blob, callback) => {
        const extension = getImageExtensionFromBlob(blob);
        const path = `assets/uploads/${crypto.randomUUID()}.${extension}`;
        const dataUrl = await blobToDataUrl(blob);
        state.files.set(path, { path, dataUrl, binary: true });
        const relativePath = getRelativePackPath(entity.path, path);
        state.contentEditorAssetMap.set(dataUrl, relativePath);
        callback(dataUrl, blob.name || "Image");
      }
    }
  });
  setTimeout(() => {
    const modeTabs = mount.querySelectorAll(".toastui-editor-mode-switch .tab-item");
    if (modeTabs[0]) modeTabs[0].setAttribute("aria-label", "Source Markdown");
    if (modeTabs[1]) modeTabs[1].setAttribute("aria-label", "Éditeur visuel");
  }, 250);
}

function getEditedMarkdown() {
  let markdown = state.contentEditor?.getMarkdown()
    ?? els.panelContent.querySelector("#adjust-body")?.value
    ?? "";
  for (const [resolved, original] of state.contentEditorAssetMap) {
    markdown = markdown.split(resolved).join(original);
  }
  return markdown;
}

function destroyContentEditor() {
  state.contentEditor?.destroy?.();
  state.contentEditor = null;
  state.contentEditorAssetMap = new Map();
}

function renderAnalysis() {
  const selected = state.entities.get(state.selectedId);
  const selectedLink = state.selectedLinkKey ? state.graph.links.find((link) => getLinkKey(link) === state.selectedLinkKey) : null;
  const relatedIds = state.selectedId ? getSelectedPathIds() : new Set();
  const linkPath = selectedLink ? getSelectedLinkPath() : { nodeIds: new Set(), linkKeys: new Set() };
  const linkPathIds = linkPath.nodeIds;
  const relatedNodes = [...state.graph.nodes].filter((node) => relatedIds.has(node.id) && node.id !== state.selectedId);
  renderInsightBreadcrumb(selected);
  const focusNodes = selected ? relatedNodes : selectedLink ? [...state.graph.nodes].filter((node) => linkPathIds.has(node.id)) : [...state.graph.nodes];
  const linkedCount = selected
    ? state.graph.links.filter((link) => getId(link.source) === selected.id || getId(link.target) === selected.id).length
    : state.graph.links.length;
  if (selected) {
    const metadata = getEntityMetadataEntries(selected, relatedNodes.length, linkedCount);
    els.kpiGrid.classList.add("project-metadata");
    els.kpiGrid.innerHTML = `
      <article class="project-meta-card entity-meta-card">
        <p class="kicker">Métadonnées</p>
        <dl>
          ${metadata.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
        </dl>
      </article>
    `;
    els.timeline.innerHTML = `
      <div class="context-card">
        <p class="kicker">Sélection active</p>
        <strong>${escapeHtml(selected.label)}</strong>
        <p>${escapeHtml(selected.summary || "Aucun résumé disponible pour cet élément.")}</p>
      </div>
    `;
  } else if (selectedLink) {
    const source = state.entities.get(getId(selectedLink.source));
    const target = state.entities.get(getId(selectedLink.target));
    els.timeline.innerHTML = `
      <div class="context-card project-context-card">
        <strong>Lien sélectionné</strong>
        <p>${escapeHtml(source?.label || getId(selectedLink.source))} → ${escapeHtml(target?.label || getId(selectedLink.target))}</p>
        <div class="project-tags">
          <span>${escapeHtml(selectedLink.label || selectedLink.type || "Relation")}</span>
          <span>${linkPath.linkKeys.size} lien${linkPath.linkKeys.size > 1 ? "s" : ""} bout en bout</span>
        </div>
      </div>
    `;
    els.kpiGrid.classList.add("project-metadata");
    els.kpiGrid.innerHTML = `
      <article class="project-meta-card">
        <p class="kicker">Relation</p>
        <dl>
          <div><dt>Source</dt><dd>${escapeHtml(source?.label || getId(selectedLink.source))}</dd></div>
          <div><dt>Cible</dt><dd>${escapeHtml(target?.label || getId(selectedLink.target))}</dd></div>
          <div><dt>Type</dt><dd>${escapeHtml(selectedLink.type || "related_to")}</dd></div>
          <div><dt>Chemin</dt><dd>${linkPath.nodeIds.size} élément${linkPath.nodeIds.size > 1 ? "s" : ""}</dd></div>
        </dl>
      </article>
    `;
  } else {
    const manifest = state.projectManifest || {};
    const fileCount = Array.isArray(manifest.fichiers) ? manifest.fichiers.length : state.files.size;
    const generatedAt = formatManifestDate(manifest.date_generation);
    els.timeline.innerHTML = `
      <div class="context-card project-context-card">
        <strong>${escapeHtml(manifest.titre || manifest.id || "Projet sans titre")}</strong>
        <p>${escapeHtml(manifest.description || "Aucune description fournie dans le manifeste du projet.")}</p>
        <div class="project-tags">
          ${manifest.version ? `<span>Version ${escapeHtml(manifest.version)}</span>` : ""}
          ${generatedAt ? `<span>${escapeHtml(generatedAt)}</span>` : ""}
        </div>
      </div>
    `;
    els.kpiGrid.classList.add("project-metadata");
    els.kpiGrid.innerHTML = `
      <article class="project-meta-card">
        <p class="kicker">Métadonnées</p>
        <dl>
          <div><dt>Identifiant</dt><dd>${escapeHtml(manifest.id || state.datasetId)}</dd></div>
          <div><dt>Version</dt><dd>${escapeHtml(manifest.version || "Non renseignée")}</dd></div>
          <div><dt>Génération</dt><dd>${escapeHtml(generatedAt || "Non renseignée")}</dd></div>
          <div><dt>Fichiers chargés</dt><dd>${fileCount}</dd></div>
        </dl>
      </article>
    `;
  }
  const rows = focusNodes
    .filter((node) => getTypePresentation(node.type))
    .sort((a, b) => getTypePresentation(a.type).order - getTypePresentation(b.type).order || a.label.localeCompare(b.label, "fr"));
  els.entityTable.innerHTML = `
    <div class="chart-card">
      <div class="chart-frame">
        <canvas id="type-distribution-chart" aria-label="Répartition des éléments"></canvas>
      </div>
      <div id="type-distribution-legend" class="chart-legend"></div>
    </div>
    <table>
      <thead><tr><th>${selected ? "Éléments liés" : "Éléments structurants"}</th><th>Type</th></tr></thead>
      <tbody>${rows.map((node) => `
        <tr data-node="${escapeHtml(node.id)}">
          <td>${escapeHtml(node.label)}</td>
          <td><span class="type-chip" style="--chip:${getTypePresentation(node.type)?.color || "#9aa6ad"}">${escapeHtml(getTypePresentation(node.type)?.singular || node.type)}</span></td>
        </tr>
      `).join("")}</tbody>
    </table>
  `;
  els.entityTable.querySelectorAll("[data-node]").forEach((row) => {
    row.addEventListener("click", () => {
      const node = state.graph.nodes.find((item) => item.id === row.dataset.node);
      if (node?.type === "contribution") selectContributionNode(node, true);
      else selectNode(row.dataset.node, true);
    });
  });
  renderTypeDistributionChart(focusNodes);
  renderPresenceSummary(selected, selectedLink);
}

function renderPresenceSummary(selected, selectedLink) {
  if (!els.presenceSummary) return;
  const context = getAnalysisSocialContext(selected, selectedLink);
  const reactions = getEntityReactions(context.id);
  const online = state.realtimeStatus === "firebase";
  const presence = context.entityId
    ? state.presence.filter((item) => item.selectedNodeId === context.entityId)
    : state.presence;
  els.presenceSummary.innerHTML = `
    <article class="presence-summary-card">
      <div class="presence-summary-head">
        <p class="kicker">Coprésence</p>
        <span class="presence-mode-pill ${online ? "online" : "local"}">${online ? "Active" : "Locale"}</span>
      </div>
      <strong>${escapeHtml(context.label)}</strong>
      <div class="node-reaction-summary">
        ${renderEntityReactionBlock(context.id, reactions)}
      </div>
      ${online ? `
        ${presence.length ? `<div class="discussion-presence compact-presence">${renderPresenceChips(presence, 4)}</div>` : `<p class="presence-summary-note">Aucune autre présence sur ce contexte.</p>`}
        <button class="secondary-button compact" data-open-context-discussion="${escapeHtml(context.id)}" type="button">
          <i>forum</i> Ouvrir les échanges
        </button>
      ` : `
        <p class="presence-summary-note">Identité locale active. Connectez la coprésence pour partager les réactions et échanges.</p>
        <button class="secondary-button compact" data-activate-copresence type="button">
          <i>account_circle</i> Activer la coprésence
        </button>
      `}
    </article>
  `;
  els.presenceSummary.querySelector("[data-activate-copresence]")?.addEventListener("click", () => activateRealtime(document.querySelector("#toggle-avatars")));
  els.presenceSummary.querySelectorAll("[data-entity-reaction]").forEach((button) => {
    button.addEventListener("click", () => reactToEntity(context.id, {
      emoji: button.dataset.entityReaction,
      annotation: button.dataset.annotation || ""
    }));
  });
  els.presenceSummary.querySelectorAll("[data-entity-reaction-picker]").forEach((button) => {
    button.addEventListener("click", () => openEntityEmojiPicker(button.dataset.entityReactionPicker, button));
  });
  els.presenceSummary.querySelector("[data-open-context-discussion]")?.addEventListener("click", () => {
    if (context.entityId && state.entities.has(context.entityId)) {
      state.activeTab = "discussion";
      document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === "discussion"));
      selectNode(context.entityId, false);
      renderRightPanel();
      updateDeepLink();
      return;
    }
    openOverviewDiscussion();
  });
  els.presenceSummary.querySelectorAll("[data-follow]").forEach((button) => {
    button.addEventListener("click", () => followUser(button.dataset.follow));
  });
  els.presenceSummary.querySelector("[data-expand-presence]")?.addEventListener("click", (event) => {
    event.currentTarget.closest(".discussion-presence")?.classList.toggle("expanded");
  });
}

function getAnalysisSocialContext(selected, selectedLink) {
  if (selected) {
    return {
      id: selected.id,
      entityId: selected.id,
      label: selected.label || "Sélection active"
    };
  }
  if (selectedLink) {
    const source = state.entities.get(getId(selectedLink.source));
    const target = state.entities.get(getId(selectedLink.target));
    return {
      id: getOverviewContextId(),
      entityId: null,
      label: `${source?.label || getId(selectedLink.source)} → ${target?.label || getId(selectedLink.target)}`
    };
  }
  const overview = getOverviewDiscussionEntity();
  return {
    id: overview.id,
    entityId: null,
    label: "Vue d’ensemble"
  };
}

function getEntityReactions(entityId) {
  const anchor = (state.comments[entityId] || []).find((comment) => comment.systemKind === "entity-reactions");
  if (anchor) return getReactionGroups(anchor);
  return getReactionGroups(state.entityReactions?.[entityId] || {});
}

function entityReactionButtonMarkup(entityId, reaction) {
  return `<button class="reaction-button${reaction.selected ? " active" : ""}${reaction.isDefault ? " default-reaction" : ""}" data-entity-reaction="${escapeHtml(reaction.emoji)}" data-annotation="${escapeHtml(reaction.annotation || "")}" data-entity-id="${escapeHtml(entityId)}" type="button" aria-label="Réagir avec ${escapeHtml(reaction.annotation || reaction.emoji)}">${reactionEmojiMarkup(reaction)}${reaction.count ? `<strong>${reaction.count}</strong>` : ""}</button>`;
}

function renderEntityReactionBlock(entityId, reactions) {
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

function getEntityMetadataEntries(entity, relatedCount, linkCount) {
  const type = state.modelSchema.types.find((item) => item.id === entity.type);
  const entries = [
    ["Type", type?.singular || entity.type],
    ["Identifiant", entity.id],
    ["Fichier", entity.path || "Non renseigné"]
  ];
  const ignored = new Set(["titre", "title", "resume", "summary", "relations"]);
  for (const field of type?.fields || []) {
    if (ignored.has(field.key) || entries.length >= 6) continue;
    const value = formatMetadataValue(entity[field.key]);
    if (value) entries.push([field.label, value]);
  }
  entries.push(
    ["Éléments liés", String(relatedCount)],
    ["Relations directes", String(linkCount)],
    ["Échanges", String((state.comments[entity.id] || []).filter((comment) => !comment.deletedAt).length)]
  );
  return entries;
}

function formatMetadataValue(value) {
  if (value == null || value === "") return "";
  if (Array.isArray(value)) return value.map((item) => typeof item === "object" ? item.target || item.id || "" : item).filter(Boolean).join(", ");
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "object") return "";
  return String(value);
}

function formatManifestDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function renderInsightBreadcrumb(selected) {
  const container = document.querySelector("#insight-breadcrumb");
  if (!container) return;
  const entities = getBreadcrumbEntities(selected);
  container.innerHTML = `
    <button type="button" data-breadcrumb-root>Vue d’ensemble</button>
    ${entities.map((entity) => `
      <i>chevron_right</i>
      <button type="button" data-node="${escapeHtml(entity.id)}">${escapeHtml(entity.label)}</button>
    `).join("")}
  `;
  container.querySelector("[data-breadcrumb-root]")?.addEventListener("click", resetView);
  container.querySelectorAll("[data-node]").forEach((button) => {
    button.addEventListener("click", () => selectNode(button.dataset.node, true));
  });
}

function getBreadcrumbEntities(selected) {
  if (!selected) return [];
  const chain = [selected];
  const visited = new Set([selected.id]);
  let currentId = selected.id;
  while (chain.length < 5) {
    const current = state.entities.get(currentId);
    const currentOrder = TYPE_CONFIG[current?.type]?.order ?? Number.MAX_SAFE_INTEGER;
    const parentLink = state.graph.links.find((link) => {
      if (getId(link.source) !== currentId || ["related_to", "comment_on"].includes(link.type)) return false;
      const target = state.entities.get(getId(link.target));
      return (TYPE_CONFIG[target?.type]?.order ?? Number.MAX_SAFE_INTEGER) < currentOrder;
    });
    const parentId = parentLink ? getId(parentLink.target) : null;
    const parent = parentId ? state.entities.get(parentId) : null;
    if (!parent || visited.has(parent.id)) break;
    chain.unshift(parent);
    visited.add(parent.id);
    currentId = parent.id;
  }
  return chain;
}

function getDistributionEntries(nodes) {
  const counts = nodes.reduce((acc, node) => {
    if (!getTypePresentation(node.type)) return acc;
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {});
  const configurations = [
    ...Object.entries(TYPE_CONFIG),
    ["contribution", { ...CONTRIBUTION_FILTER, order: Number.MAX_SAFE_INTEGER }]
  ];
  return configurations
    .map(([type, config]) => ({ type, ...config, value: counts[type] || 0 }))
    .filter((entry) => entry.value > 0);
}

function getTypePresentation(type) {
  if (type === "contribution") return { ...CONTRIBUTION_FILTER, order: Number.MAX_SAFE_INTEGER };
  return TYPE_CONFIG[type] || null;
}

function renderTypeDistributionChart(nodes) {
  const canvas = document.querySelector("#type-distribution-chart");
  const legend = document.querySelector("#type-distribution-legend");
  if (!canvas) return;
  const entries = getDistributionEntries(nodes);
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  const signature = JSON.stringify(entries.map(({ label, value, color }) => [label, value, color]));
  if (!window.Chart) {
    canvas.hidden = true;
    const card = canvas.closest(".chart-card");
    card?.classList.add("chart-card-fallback");
    card?.setAttribute("data-chart-state", "fallback");
    if (legend) {
      legend.innerHTML = entries.map((entry) => `
        <span><i class="legend-dot" style="background:${entry.color}"></i><span class="legend-label">${escapeHtml(entry.label)}</span><strong>${entry.value}</strong></span>
      `).join("");
    }
    return;
  }
  canvas.hidden = false;
  const card = canvas.closest(".chart-card");
  card?.classList.remove("chart-card-fallback");
  card?.setAttribute("data-chart-state", "chartjs");
  if (state.charts.typeDistribution && state.charts.typeDistributionSignature === signature && state.charts.typeDistribution.canvas === canvas) {
    return;
  }
  state.charts.typeDistribution?.destroy();
  state.charts.typeDistributionSignature = signature;
  state.charts.typeDistribution = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: entries.map((entry) => entry.label),
      datasets: [{
        data: entries.map((entry) => entry.value),
        backgroundColor: entries.map((entry) => entry.color),
        borderColor: "rgba(7, 16, 21, 0.92)",
        borderWidth: 3,
        hoverOffset: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 80,
      cutout: "66%",
      animation: { duration: 280 },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: true,
          callbacks: {
            label: (context) => `${context.label}: ${context.parsed}`
          }
        }
      }
    },
    plugins: [{
      id: "centerText",
      afterDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        ctx.save();
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text").trim() || "#edf7f6";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "700 20px system-ui";
        ctx.fillText(String(total), (chartArea.left + chartArea.right) / 2, (chartArea.top + chartArea.bottom) / 2 - 4);
        ctx.font = "600 11px system-ui";
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || "#9fb3b8";
        ctx.fillText(nodes.length === state.graph.nodes.length ? "éléments" : "liés", (chartArea.left + chartArea.right) / 2, (chartArea.top + chartArea.bottom) / 2 + 17);
        ctx.restore();
      }
    }]
  });
  if (legend) {
    legend.innerHTML = entries.map((entry) => `
      <span><i class="legend-dot" style="background:${entry.color}"></i><span class="legend-label">${escapeHtml(entry.label)}</span><strong>${entry.value}</strong></span>
    `).join("");
  }
  requestAnimationFrame(() => state.charts.typeDistribution?.resize());
}

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
    const marker = document.createElement("div");
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
  const visibleLimit = window.innerWidth < 1100 ? 2 : window.innerWidth < 1450 ? 3 : 4;
  els.presenceStrip.innerHTML = renderPresenceChips(users, visibleLimit);
  els.presenceStrip.querySelectorAll("[data-follow]").forEach((button) => {
    button.addEventListener("click", () => followUser(button.dataset.follow));
  });
  els.presenceStrip.querySelector("[data-expand-presence]")?.addEventListener("click", () => {
    els.presenceStrip.classList.toggle("expanded");
  });
}

function renderPresenceChips(users, limit = 5) {
  const chips = users.map((user, index) => {
    const isSelf = user.clientId === state.profile.clientId;
    const node = user.selectedNodeId ? state.entities.get(user.selectedNodeId) : null;
    const tip = user.selectedNodeId && !node
      ? `${user.displayName} consulte une fiche absente de votre atlas`
      : node ? `Rejoindre ${user.displayName} · ${node.label}` : `${user.displayName} · disponible`;
    return `<button class="presence-top-chip${isSelf ? " self" : ""}${user.selectedNodeId && !node ? " missing-node" : ""}${index >= limit ? " presence-overflow" : ""}" type="button" data-follow="${escapeHtml(user.clientId)}" aria-label="${escapeHtml(tip)}">
      ${avatarMarkup(user)}
      <span class="tooltip bottom">${escapeHtml(tip)}</span>
    </button>`;
  }).join("");
  return `${chips}${users.length > limit ? `<button class="presence-more" data-expand-presence type="button" aria-label="Afficher les ${users.length - limit} autres coprésences">+${users.length - limit}</button>` : ""}`;
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

function renderCommentCard(comment) {
  const canDelete = state.isAdmin || comment.clientId === state.profile.clientId || comment.ownerId === state.authUid;
  const isOwn = comment.clientId === state.profile.clientId || comment.ownerId === state.authUid;
  const reactionGroups = getCommentReactions(comment);
  return `<article class="comment-card${comment.parentId ? " reply" : ""}${isOwn ? " own" : ""}${comment.id === state.highlightedCommentId ? " highlighted" : ""}" data-comment-id="${escapeHtml(comment.id)}">
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
  const replies = allComments.filter((item) => item.parentId === comment.id).sort((a, b) => a.createdAt - b.createdAt);
  const highlighted = comment.id === state.highlightedCommentId;
  return `<section class="thread${highlighted ? " highlighted" : ""}" data-thread="${escapeHtml(comment.id)}">
    ${renderCommentCard(comment)}
    ${replies.length ? `<div class="thread-count">${replies.length} réponse${replies.length > 1 ? "s" : ""}</div>` : ""}
    ${state.replyTo === comment.id ? renderInlineReplyBox(comment) : ""}
    ${replies.length ? `<div class="reply-list">${replies.map((reply) => `
      ${renderCommentCard(reply, true)}
      ${state.replyTo === reply.id ? renderInlineReplyBox(reply) : ""}
    `).join("")}</div>` : ""}
  </section>`;
}

function renderInlineReplyBox(comment) {
  const draft = getDraft(state.currentDiscussionEntityId || state.selectedId, comment.id);
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

async function reactToComment(entityId, commentId, reaction) {
  if (state.realtimeStatus !== "firebase") return;
  try {
    await state.provider?.toggleReaction(entityId, commentId, reaction);
    recordHeartEvent("reaction", HEART_POINTS.reaction);
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
      recordHeartEvent("reaction", HEART_POINTS.reaction);
    }
  } catch {
    if (state.isAdmin) {
      try {
        await state.provider?.toggleEntityReaction(entityId, reaction);
        recordHeartEvent("reaction", HEART_POINTS.reaction);
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
    if (entityId.startsWith(`${OVERVIEW_CONTEXT_PREFIX}:`)) renderDiscussion(getOverviewDiscussionEntity());
    else renderRightPanel();
  }
}

function openEmojiPicker(entityId, commentId, anchor) {
  if (state.realtimeStatus !== "firebase") return;
  state.emojiPickerTarget = { entityId, commentId };
  els.emojiPickerPopover?.classList.remove("hidden");
  const rect = anchor?.getBoundingClientRect();
  const card = els.emojiPickerPopover?.querySelector(".emoji-picker-card");
  if (rect && card) {
    const cardWidth = card.offsetWidth || 326;
    const cardHeight = card.offsetHeight || Math.min(398, window.innerHeight - 20);
    const left = Math.max(10, Math.min(window.innerWidth - cardWidth - 10, rect.right - cardWidth));
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > cardHeight + 8 ? rect.bottom + 8 : Math.max(10, rect.top - cardHeight - 8);
    card.style.left = `${Math.round(left)}px`;
    card.style.top = `${Math.round(top)}px`;
  }
  requestAnimationFrame(() => els.emojiPicker?.shadowRoot?.querySelector("input")?.focus());
}

function openEntityEmojiPicker(entityId, anchor) {
  state.emojiPickerTarget = { entityId, entityReaction: true };
  els.emojiPickerPopover?.classList.remove("hidden");
  const rect = anchor?.getBoundingClientRect();
  const card = els.emojiPickerPopover?.querySelector(".emoji-picker-card");
  if (rect && card) {
    const cardWidth = card.offsetWidth || 326;
    const cardHeight = card.offsetHeight || Math.min(398, window.innerHeight - 20);
    const left = Math.max(10, Math.min(window.innerWidth - cardWidth - 10, rect.right - cardWidth));
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > cardHeight + 8 ? rect.bottom + 8 : Math.max(10, rect.top - cardHeight - 8);
    card.style.left = `${Math.round(left)}px`;
    card.style.top = `${Math.round(top)}px`;
  }
  requestAnimationFrame(() => els.emojiPicker?.shadowRoot?.querySelector("input")?.focus());
}

function closeEmojiPicker() {
  els.emojiPickerPopover?.classList.add("hidden");
  state.emojiPickerTarget = null;
}

function handleEmojiSelection(event) {
  const detail = event.detail || {};
  const emoji = detail.unicode || detail.emoji?.unicode;
  if (!emoji) return;
  selectEmojiReaction({
    emoji,
    annotation: detail.emoji?.annotation || detail.emoji?.shortcodes?.[0] || emoji
  });
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
  return getReactionGroups(comment);
}

function getReactionGroups(source) {
  const groups = new Map();
  const add = (reaction, entries, isDefault = false) => {
    if (!reaction?.emoji) return;
    const values = Object.entries(entries || {});
    const count = values.filter(([, value]) => !value?.isAdmin).length;
    const selected = Boolean(entries?.[state.authUid]);
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

function emojiToId(emoji) {
  return [...emoji].map((char) => char.codePointAt(0).toString(16)).join("-");
}

function reactionEmojiMarkup(reaction) {
  return `<span class="reaction-emoji">${escapeHtml(reaction?.emoji || "")}</span>`;
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
    id: crypto.randomUUID(),
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
    recordHeartEvent(comment.parentId ? "reply" : "comment", comment.parentId ? HEART_POINTS.reply : HEART_POINTS.comment);
    const replyTarget = state.replyTo;
    state.replyTo = null;
    state.highlightedCommentId = comment.parentId || comment.id;
    clearDraft(entityId, replyTarget);
    input.value = "";
    if (entityId.startsWith(`${OVERVIEW_CONTEXT_PREFIX}:`)) renderDiscussion(getOverviewDiscussionEntity());
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

function exportSelected() {
  const entity = state.entities.get(state.selectedId);
  if (!entity) {
    showToast("Aucune fiche sélectionnée");
    return;
  }
  downloadBlob(new Blob([entity.rawText || serializeEntity(entity)], { type: "text/markdown;charset=utf-8" }), `${safeFileName(entity.label)}.md`);
}

async function exportAll() {
  const zip = new JSZip();
  const projectName = safeFileName(state.projectManifest?.titre || state.projectManifest?.id || "prospectre");
  const projectRoot = zip.folder(projectName);
  const files = getExportFiles();
  for (const file of files) {
    if (file.dataUrl) {
      projectRoot.file(file.exportPath, file.dataUrl.split(",")[1] || "", { base64: true });
    } else {
      projectRoot.file(file.exportPath, file.text);
    }
  }
  const manifest = {
    ...(state.projectManifest || {}),
    modele: state.modelSchema,
    date_export: new Date().toISOString(),
    fichiers: ["README.md", ...files.map((file) => file.exportPath).filter((path) => path !== "README.md"), "manifest.json"]
  };
  projectRoot.file("manifest.json", JSON.stringify(manifest, null, 2));
  projectRoot.file("contributions/commentaires.json", JSON.stringify(state.comments, null, 2));
  projectRoot.file("contributions/activite.json", JSON.stringify(state.activity, null, 2));
  downloadBlob(await zip.generateAsync({ type: "blob" }), `${projectName}.zip`);
}

function getExportFiles() {
  const entityByPath = new Map([...state.entities.values()].map((entity) => [entity.path, entity]));
  const usedPaths = new Set();
  return [...state.files.values()]
    .filter((file) => file.path !== "manifest.json")
    .map((file) => {
      const entity = entityByPath.get(file.path);
      const type = entity ? state.modelSchema.types.find((item) => item.id === entity.type) : null;
      const parts = file.path.split("/");
      let exportPath = file.path;
      if (type?.folder && parts.length) {
        parts[0] = type.folder;
        exportPath = parts.join("/");
      }
      if (usedPaths.has(exportPath)) {
        const extensionIndex = exportPath.lastIndexOf(".");
        const base = extensionIndex > -1 ? exportPath.slice(0, extensionIndex) : exportPath;
        const extension = extensionIndex > -1 ? exportPath.slice(extensionIndex) : "";
        let suffix = 2;
        while (usedPaths.has(`${base}-${suffix}${extension}`)) suffix += 1;
        exportPath = `${base}-${suffix}${extension}`;
      }
      usedPaths.add(exportPath);
      return { ...file, exportPath };
    });
}

function updateFileFromEntity(entity) {
  const file = state.files.get(entity.path);
  if (!file) return;
  const parsed = parseMarkdownFile(file.text);
  if ("titre" in parsed.meta) parsed.meta.titre = entity.label;
  else parsed.meta.label = entity.label;
  if ("resume" in parsed.meta) parsed.meta.resume = entity.summary;
  else parsed.meta.summary = entity.summary;
  const yaml = jsyaml.dump(parsed.meta, { lineWidth: 100 });
  file.text = `---\n${yaml}---\n\n${entity.body || ""}`;
  entity.rawText = file.text;
  saveSession();
}

function serializeEntity(entity) {
  const meta = { ...entity };
  for (const key of ["body", "rawText", "path", "size", "color", "x", "y", "z", "vx", "vy", "vz", "index"]) delete meta[key];
  return `---\n${jsyaml.dump(meta, { lineWidth: 100 })}---\n\n${entity.body || ""}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getFileExtension(path) {
  return String(path || "").split(".").pop().toLowerCase();
}

function showDropOverlay() {
  els.dropOverlay.classList.remove("hidden");
}

function isFileDrag(event) {
  return [...(event.dataTransfer?.types || [])].includes("Files");
}

function canAdministerSchema() {
  return state.authProvider !== "google" || state.isAdmin;
}

function openSchemaAdmin(view = "types") {
  closeTransferMenu();
  if (!canAdministerSchema()) {
    showToast("Ce compte ne dispose pas des droits d’administration");
    return;
  }
  state.schemaDraft = structuredClone(state.modelSchema);
  state.schemaView = view;
  const available = state.schemaDraft.types.some((type) => type.id === state.schemaSelectedType);
  if (!available) state.schemaSelectedType = state.schemaDraft.types[0]?.id || "";
  els.schemaAdmin.classList.remove("hidden");
  document.querySelector("#app").classList.add("schema-admin-open");
  renderSchemaAdmin();
}

function closeSchemaAdmin() {
  if (els.schemaAdmin?.classList.contains("hidden")) return;
  els.schemaAdmin.classList.add("hidden");
  document.querySelector("#app").classList.remove("schema-admin-open");
  state.schemaDraft = null;
}

function renderSchemaAdmin() {
  if (!state.schemaDraft || !els.schemaAdminContent) return;
  document.querySelectorAll("[data-schema-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.schemaView === state.schemaView);
  });
  document.querySelector("#schema-project-name").textContent = state.projectManifest?.titre || state.projectManifest?.id || "Projet local";
  document.querySelector("#schema-version-label").textContent = `Schéma ${state.schemaDraft.version}`;
  if (state.schemaView === "types") renderSchemaTypes();
  if (state.schemaView === "fields") renderSchemaFields();
  if (state.schemaView === "transfer") renderSchemaTransfer();
}

function renderSchemaTypes() {
  const rows = [...state.schemaDraft.types].sort((a, b) => a.order - b.order).map((type) => {
    const count = [...state.entities.values()].filter((entity) => entity.type === type.id).length;
    return `
      <div class="schema-type-row" data-type-row="${escapeHtml(type.id)}">
        <button class="schema-drag" type="button" aria-label="Déplacer ${escapeHtml(type.label)}" title="Glisser pour réordonner"><i>drag_indicator</i></button>
        <label><span>Nom affiché</span><input data-schema-type="${escapeHtml(type.id)}" data-schema-prop="label" value="${escapeHtml(type.label)}"></label>
        <label><span>Singulier</span><input data-schema-type="${escapeHtml(type.id)}" data-schema-prop="singular" value="${escapeHtml(type.singular)}"></label>
        <label><span>Identifiant technique</span><input value="${escapeHtml(type.id)}" disabled></label>
        <label><span>Dossier</span><input data-schema-type="${escapeHtml(type.id)}" data-schema-prop="folder" value="${escapeHtml(type.folder)}"></label>
        <label class="schema-color-control"><span>Couleur</span><input type="color" data-schema-type="${escapeHtml(type.id)}" data-schema-prop="color" value="${escapeHtml(type.color)}"></label>
        <label class="schema-label-control"><span>Label</span><input type="checkbox" data-schema-type="${escapeHtml(type.id)}" data-schema-prop="showLabel"${type.showLabel ? " checked" : ""} aria-label="Afficher les labels de ce type"></label>
        <span class="schema-count">${count} élément${count > 1 ? "s" : ""}</span>
        <button class="schema-icon-action" data-delete-type="${escapeHtml(type.id)}" type="button" aria-label="Supprimer ce type"><i>delete</i></button>
      </div>
    `;
  }).join("");
  const preview = [...state.schemaDraft.types].sort((a, b) => a.order - b.order).map((type) => `
    <span class="schema-filter-preview" data-schema-preview="${escapeHtml(type.id)}" style="--schema-color:${escapeHtml(type.color)}"><span></span>${escapeHtml(type.label)}</span>
  `).join("");
  els.schemaAdminContent.innerHTML = `
    <section class="schema-section-head">
      <div><p class="kicker">Vocabulaire métier</p><h2>Types d’éléments</h2><p>Les libellés modifient l’interface. Les identifiants restent stables pour préserver les fichiers.</p></div>
      <button class="primary-button compact-action" data-add-type type="button"><i>add</i>Nouveau type</button>
    </section>
    <div class="schema-dashboard">
      <article><strong>${state.schemaDraft.types.length}</strong><span>types actifs</span></article>
      <article><strong>${state.schemaDraft.types.reduce((sum, type) => sum + type.fields.length, 0)}</strong><span>champs configurés</span></article>
      <article><strong>${getSchemaEntityCount(state.schemaDraft)}</strong><span>éléments chargés</span></article>
    </div>
    <div class="schema-types-layout">
      <section class="schema-card schema-type-list">
        <div class="schema-type-columns"><span></span><span>Nom affiché</span><span>Singulier</span><span>Identifiant</span><span>Dossier</span><span>Couleur</span><span>Label</span><span>Contenu</span><span></span></div>
        ${rows || `<p class="empty-state">Aucun type configuré.</p>`}
      </section>
      <aside class="schema-card schema-preview-card">
        <p class="kicker">Aperçu</p>
        <h3>Filtres de l’application</h3>
        <p>Les changements sont visibles après enregistrement.</p>
        <div class="schema-filter-list">${preview}</div>
        <div class="schema-notice"><i>lock</i><span>Les identifiants techniques ne sont pas renommés automatiquement.</span></div>
      </aside>
    </div>
  `;
}

function renderSchemaFields() {
  const selectedType = state.schemaDraft.types.find((type) => type.id === state.schemaSelectedType) || state.schemaDraft.types[0];
  if (!selectedType) {
    els.schemaAdminContent.innerHTML = `<p class="empty-state">Créez d’abord un type d’élément.</p>`;
    return;
  }
  state.schemaSelectedType = selectedType.id;
  const selectedField = selectedType.fields.find((field) => field.key === state.schemaSelectedField) || selectedType.fields[0] || null;
  state.schemaSelectedField = selectedField?.key || "";
  const options = state.schemaDraft.types.map((type) => `<option value="${escapeHtml(type.id)}"${type.id === selectedType.id ? " selected" : ""}>${escapeHtml(type.label)}</option>`).join("");
  const fieldRows = selectedType.fields.map((field) => `
    <button class="schema-field-row${field.key === selectedField?.key ? " active" : ""}" data-select-field="${escapeHtml(field.key)}" type="button">
      <i>${field.kind === "reference" ? "link" : field.kind === "select" ? "list" : field.kind === "number" ? "tag" : "text_fields"}</i>
      <span><strong>${escapeHtml(field.label)}</strong><small>${escapeHtml(field.key)}</small></span>
      <em>${escapeHtml(fieldKindLabel(field.kind))}</em>
      <b>${field.required ? "Requis" : "Optionnel"}</b>
    </button>
  `).join("");
  els.schemaAdminContent.innerHTML = `
    <section class="schema-section-head">
      <div><p class="kicker">Structure des contenus</p><h2>Champs</h2><p>Configurez le front matter YAML et les formulaires associés.</p></div>
      <label class="schema-type-select"><span>Type édité</span><select data-schema-selected-type>${options}</select></label>
    </section>
    <div class="schema-fields-layout">
      <section class="schema-card schema-fields-list">
        <header><div><h3>${escapeHtml(selectedType.singular)}</h3><p>${selectedType.fields.length} champ${selectedType.fields.length > 1 ? "s" : ""}</p></div><button class="secondary-button compact-action" data-add-field type="button"><i>add</i>Ajouter un champ</button></header>
        <div>${fieldRows || `<p class="empty-state">Aucun champ configuré.</p>`}</div>
      </section>
      ${selectedField ? renderFieldInspector(selectedType, selectedField) : `<aside class="schema-card"><p class="empty-state">Sélectionnez ou ajoutez un champ.</p></aside>`}
    </div>
  `;
}

function renderFieldInspector(type, field) {
  const kindOptions = ["text", "textarea", "number", "boolean", "select", "reference"]
    .map((kind) => `<option value="${kind}"${kind === field.kind ? " selected" : ""}>${fieldKindLabel(kind)}</option>`).join("");
  const targetOptions = [`<option value="*"${field.target === "*" ? " selected" : ""}>Tous les types</option>`]
    .concat(state.schemaDraft.types.map((item) => `<option value="${escapeHtml(item.id)}"${field.target === item.id ? " selected" : ""}>${escapeHtml(item.label)}</option>`)).join("");
  const yamlValue = field.kind === "select" ? field.values?.[0] || "valeur"
    : field.kind === "reference" ? `${field.target === "*" ? "type" : field.target}:identifiant`
      : field.kind === "number" ? "2040" : field.kind === "boolean" ? "true" : `"Exemple"`;
  return `
    <aside class="schema-card schema-field-inspector">
      <header><div><p class="kicker">Propriétés du champ</p><h3>${escapeHtml(field.label)}</h3></div><button class="schema-icon-action" data-delete-field="${escapeHtml(field.key)}" type="button"><i>delete</i></button></header>
      <label><span>Libellé</span><input data-field-prop="label" value="${escapeHtml(field.label)}"></label>
      <label><span>Clé YAML</span><input value="${escapeHtml(field.key)}" disabled></label>
      <div class="schema-warning"><i>warning</i>Renommer le libellé ne modifie pas la clé YAML.</div>
      <label><span>Type de champ</span><select data-field-prop="kind">${kindOptions}</select></label>
      <label class="schema-check"><input type="checkbox" data-field-prop="required"${field.required ? " checked" : ""}><span>Champ obligatoire</span></label>
      ${field.kind === "reference" ? `
        <label><span>Type ciblé</span><select data-field-prop="target">${targetOptions}</select></label>
        <label class="schema-check"><input type="checkbox" data-field-prop="multiple"${field.multiple ? " checked" : ""}><span>Autoriser plusieurs références</span></label>
      ` : ""}
      ${field.kind === "select" ? `
        <label><span>Valeurs autorisées <small>une par ligne</small></span><textarea data-field-values>${escapeHtml((field.values || []).join("\n"))}</textarea></label>
      ` : ""}
      <div class="schema-yaml-preview"><span>Aperçu YAML</span><code>${escapeHtml(field.key)}: ${escapeHtml(yamlValue)}</code></div>
    </aside>
  `;
}

function renderSchemaTransfer() {
  const report = getSchemaCompatibilityReport(state.schemaDraft);
  els.schemaAdminContent.innerHTML = `
    <section class="schema-section-head">
      <div><p class="kicker">Portabilité</p><h2>Import / export du schéma</h2><p>Le schéma est embarqué dans le manifeste des prochains exports de pack.</p></div>
    </section>
    <div class="schema-transfer-grid">
      <section class="schema-card schema-compatibility">
        <p class="kicker">Contrôle de compatibilité</p>
        <div class="schema-score"><strong>${report.score}%</strong><span>compatible avec le projet courant</span></div>
        <div class="schema-dashboard">
          <article><strong>${report.valid}</strong><span>fichiers valides</span></article>
          <article><strong>${report.warnings.length}</strong><span>avertissements</span></article>
          <article><strong>${report.errors.length}</strong><span>erreurs</span></article>
        </div>
        <div class="schema-report-list">
          ${[...report.errors, ...report.warnings].map((item) => `<p class="${item.level}"><i>${item.level === "error" ? "error" : "warning"}</i>${escapeHtml(item.message)}</p>`).join("") || `<p class="success"><i>check_circle</i>Aucune incompatibilité détectée.</p>`}
        </div>
      </section>
      <section class="schema-card schema-transfer-actions">
        <article><i>download</i><div><h3>Exporter le schéma</h3><p>Télécharge un JSON réutilisable dans un autre projet.</p><button class="primary-button compact-action" data-export-schema type="button">Télécharger</button></div></article>
        <article><i>upload</i><div><h3>Importer un schéma</h3><p>Charge une configuration et contrôle sa compatibilité avant enregistrement.</p><button class="secondary-button compact-action" data-import-schema type="button">Choisir un fichier</button></div></article>
        <article><i>inventory_2</i><div><h3>Exporter le pack complet</h3><p>Le manifeste contiendra la version actuellement enregistrée du schéma.</p><button class="secondary-button compact-action" data-export-pack type="button">Exporter le projet</button></div></article>
      </section>
    </div>
  `;
}

function handleSchemaAdminInput(event) {
  if (!state.schemaDraft) return;
  const typeId = event.target.dataset.schemaType;
  if (typeId) {
    const type = state.schemaDraft.types.find((item) => item.id === typeId);
    if (!type) return;
    type[event.target.dataset.schemaProp] = event.target.type === "checkbox"
      ? event.target.checked
      : event.target.type === "number" ? Number(event.target.value) : event.target.value;
    if (event.target.dataset.schemaProp === "color") {
      els.schemaAdminContent.querySelector(`[data-schema-preview="${cssEscape(type.id)}"]`)
        ?.style.setProperty("--schema-color", type.color);
    }
    return;
  }
  if (event.target.matches("[data-schema-selected-type]")) {
    state.schemaSelectedType = event.target.value;
    state.schemaSelectedField = "";
    renderSchemaFields();
    return;
  }
  const fieldProp = event.target.dataset.fieldProp;
  if (fieldProp) {
    const field = getSelectedSchemaField();
    if (!field) return;
    field[fieldProp] = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    if (fieldProp === "kind") {
      field.values = field.kind === "select" ? field.values || [] : undefined;
      field.target = field.kind === "reference" ? field.target || "*" : undefined;
      renderSchemaFields();
    }
    return;
  }
  if (event.target.matches("[data-field-values]")) {
    const field = getSelectedSchemaField();
    if (field) field.values = [...new Set(event.target.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean))];
  }
}

function handleSchemaAdminClick(event) {
  const button = event.target.closest("button");
  if (!button || !state.schemaDraft) return;
  if (button.dataset.selectField) {
    state.schemaSelectedField = button.dataset.selectField;
    renderSchemaFields();
  } else if (button.hasAttribute("data-add-type")) {
    addSchemaType();
  } else if (button.dataset.deleteType) {
    deleteSchemaType(button.dataset.deleteType);
  } else if (button.hasAttribute("data-add-field")) {
    addSchemaField();
  } else if (button.dataset.deleteField) {
    deleteSchemaField(button.dataset.deleteField);
  } else if (button.hasAttribute("data-export-schema")) {
    exportSchemaDraft();
  } else if (button.hasAttribute("data-import-schema")) {
    els.schemaFileInput.click();
  } else if (button.hasAttribute("data-export-pack")) {
    exportAll();
  }
}

function prepareSchemaTypeDrag(event) {
  const handle = event.target.closest(".schema-drag");
  const row = handle?.closest("[data-type-row]");
  state.schemaDragArmedType = row?.dataset.typeRow || null;
  if (!row) return;
  state.schemaPointerDrag = {
    sourceId: row.dataset.typeRow,
    targetId: row.dataset.typeRow,
    pointerId: event.pointerId
  };
  row.classList.add("dragging");
  handle.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function moveSchemaPointerDrag(event) {
  if (!state.schemaPointerDrag || event.pointerId !== state.schemaPointerDrag.pointerId) return;
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-type-row]");
  if (!target || target.dataset.typeRow === state.schemaPointerDrag.sourceId) return;
  state.schemaPointerDrag.targetId = target.dataset.typeRow;
  els.schemaAdminContent.querySelectorAll(".schema-type-row.drag-over").forEach((item) => item.classList.remove("drag-over"));
  target.classList.add("drag-over");
  event.preventDefault();
}

function finishSchemaPointerDrag(event) {
  const drag = state.schemaPointerDrag;
  if (!drag || event.pointerId !== drag.pointerId) return;
  state.schemaPointerDrag = null;
  if (drag.sourceId !== drag.targetId) reorderSchemaTypes(drag.sourceId, drag.targetId);
  endSchemaTypeDrag();
  renderSchemaTypes();
}

function startSchemaTypeDrag(event) {
  const row = event.target.closest("[data-type-row]");
  if (!row || state.schemaDragArmedType !== row.dataset.typeRow) {
    event.preventDefault();
    return;
  }
  state.schemaDraggedType = row.dataset.typeRow;
  row.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", state.schemaDraggedType);
}

function moveSchemaTypeDrag(event) {
  if (!state.schemaDraggedType) return;
  const row = event.target.closest("[data-type-row]");
  if (!row || row.dataset.typeRow === state.schemaDraggedType) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  els.schemaAdminContent.querySelectorAll(".schema-type-row.drag-over").forEach((item) => item.classList.remove("drag-over"));
  row.classList.add("drag-over");
}

function dropSchemaTypeDrag(event) {
  const targetRow = event.target.closest("[data-type-row]");
  const sourceId = state.schemaDraggedType || event.dataTransfer?.getData("text/plain");
  const targetId = targetRow?.dataset.typeRow;
  if (!sourceId || !targetId || sourceId === targetId) return;
  event.preventDefault();
  reorderSchemaTypes(sourceId, targetId);
  endSchemaTypeDrag();
  renderSchemaTypes();
}

function reorderSchemaTypes(sourceId, targetId) {
  const ordered = [...state.schemaDraft.types].sort((a, b) => a.order - b.order);
  const sourceIndex = ordered.findIndex((type) => type.id === sourceId);
  const targetIndex = ordered.findIndex((type) => type.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return false;
  const [moved] = ordered.splice(sourceIndex, 1);
  ordered.splice(targetIndex, 0, moved);
  ordered.forEach((type, index) => {
    type.order = index;
  });
  state.schemaDraft.types = ordered;
  return true;
}

function endSchemaTypeDrag() {
  state.schemaDraggedType = null;
  state.schemaDragArmedType = null;
  els.schemaAdminContent?.querySelectorAll(".schema-type-row").forEach((row) => {
    row.classList.remove("dragging", "drag-over");
  });
}

function addSchemaType() {
  const label = window.prompt("Nom du nouveau type");
  if (!label?.trim()) return;
  const proposed = safeSchemaId(label);
  const id = window.prompt("Identifiant technique stable", proposed);
  const normalizedId = safeSchemaId(id);
  if (!normalizedId || state.schemaDraft.types.some((type) => type.id === normalizedId)) {
    showToast("Identifiant invalide ou déjà utilisé");
    return;
  }
  state.schemaDraft.types.push({
    id: normalizedId,
    label: label.trim().endsWith("s") ? label.trim() : `${label.trim()}s`,
    singular: label.trim(),
    folder: `${normalizedId}s`,
    color: "#7dd3fc",
    size: 12,
    order: state.schemaDraft.types.length,
    showLabel: true,
    fields: [{ key: "titre", label: "Titre", kind: "text", required: true }]
  });
  renderSchemaTypes();
}

function deleteSchemaType(typeId) {
  const used = [...state.entities.values()].filter((entity) => entity.type === typeId).length;
  if (used) {
    showToast(`Suppression impossible : ${used} élément${used > 1 ? "s utilisent" : " utilise"} ce type`);
    return;
  }
  if (!window.confirm("Supprimer ce type du schéma ?")) return;
  state.schemaDraft.types = state.schemaDraft.types.filter((type) => type.id !== typeId);
  renderSchemaTypes();
}

function addSchemaField() {
  const type = state.schemaDraft.types.find((item) => item.id === state.schemaSelectedType);
  if (!type) return;
  const label = window.prompt("Libellé du champ");
  if (!label?.trim()) return;
  const key = safeSchemaId(window.prompt("Clé YAML stable", safeSchemaId(label)));
  if (!key || type.fields.some((field) => field.key === key)) {
    showToast("Clé YAML invalide ou déjà utilisée");
    return;
  }
  type.fields.push({ key, label: label.trim(), kind: "text", required: false });
  state.schemaSelectedField = key;
  renderSchemaFields();
}

function deleteSchemaField(fieldKey) {
  const type = state.schemaDraft.types.find((item) => item.id === state.schemaSelectedType);
  if (!type || fieldKey === "titre") {
    showToast("Le champ titre est obligatoire");
    return;
  }
  if (!window.confirm("Supprimer ce champ du schéma ? Les données existantes ne seront pas effacées.")) return;
  type.fields = type.fields.filter((field) => field.key !== fieldKey);
  state.schemaSelectedField = type.fields[0]?.key || "";
  renderSchemaFields();
}

function getSelectedSchemaField() {
  return state.schemaDraft?.types.find((type) => type.id === state.schemaSelectedType)
    ?.fields.find((field) => field.key === state.schemaSelectedField);
}

function saveSchemaDraft() {
  if (!state.schemaDraft) return;
  const errors = validateModelSchema(state.schemaDraft);
  if (errors.length) {
    showToast(errors[0]);
    return;
  }
  const normalized = normalizeModelSchema({
    ...state.schemaDraft,
    version: bumpPatchVersion(state.modelSchema.version),
    updatedAt: new Date().toISOString()
  });
  applyModelSchema(normalized);
  state.projectManifest = { ...(state.projectManifest || {}), modele: state.modelSchema };
  state.schemaDraft = structuredClone(state.modelSchema);
  saveSession();
  rebuildGraph();
  renderTypeFilters();
  renderSchemaAdmin();
  showToast(`Schéma ${state.modelSchema.version} enregistré`);
}

function resetSchemaDraft() {
  if (!window.confirm("Réinitialiser le schéma avec les types et champs par défaut ?")) return;
  state.schemaDraft = structuredClone(DEFAULT_MODEL_SCHEMA);
  state.schemaSelectedType = DEFAULT_MODEL_SCHEMA.types[0]?.id || "";
  state.schemaSelectedField = DEFAULT_MODEL_SCHEMA.types[0]?.fields[0]?.key || "";
  renderSchemaAdmin();
}

function validateModelSchema(schema) {
  if (!schema.types.length) return ["Le schéma doit contenir au moins un type"];
  const ids = new Set();
  for (const type of schema.types) {
    if (!type.label.trim() || !type.singular.trim()) return [`Le type ${type.id} doit avoir un libellé`];
    if (ids.has(type.id)) return [`Identifiant de type dupliqué : ${type.id}`];
    ids.add(type.id);
    const keys = new Set();
    for (const field of type.fields) {
      if (keys.has(field.key)) return [`Clé YAML dupliquée dans ${type.label} : ${field.key}`];
      keys.add(field.key);
      if (field.kind === "select" && !field.values?.length) return [`Le champ ${field.label} doit contenir au moins une valeur`];
    }
  }
  return [];
}

function getSchemaCompatibilityReport(schema) {
  const errors = [];
  const warnings = [];
  let valid = 0;
  const types = new Map(schema.types.map((type) => [type.id, type]));
  for (const entity of state.entities.values()) {
    if (HIDDEN_NODE_TYPES.has(entity.type)) continue;
    const type = types.get(entity.type);
    if (!type) {
      errors.push({ level: "error", message: `${entity.label} utilise le type absent « ${entity.type} ».` });
      continue;
    }
    const parsed = parseMarkdownFile(entity.rawText || "");
    const missing = type.fields.filter((field) => field.required && parsed.meta[field.key] == null && !(field.key === "titre" && entity.label));
    if (missing.length) {
      warnings.push({ level: "warning", message: `${entity.label} : ${missing.map((field) => field.label).join(", ")} manquant(s).` });
    } else {
      valid += 1;
    }
  }
  const issueCount = errors.length + warnings.length;
  const entityCount = getSchemaEntityCount(schema);
  const score = entityCount ? Math.max(0, Math.round((1 - issueCount / entityCount) * 100)) : 100;
  return { errors: errors.slice(0, 12), warnings: warnings.slice(0, 12), valid, score };
}

function getSchemaEntityCount(schema) {
  const typeIds = new Set(schema.types.map((type) => type.id));
  return [...state.entities.values()].filter((entity) => typeIds.has(entity.type)).length;
}

function exportSchemaDraft() {
  const blob = new Blob([JSON.stringify(normalizeModelSchema(state.schemaDraft), null, 2)], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, `${safeFileName(state.projectManifest?.titre || "prospectre")}-schema.json`);
}

async function importSchemaFile(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  const imported = parseJson(await file.text());
  if (!imported?.types || !Array.isArray(imported.types)) {
    showToast("Fichier de schéma invalide");
    return;
  }
  state.schemaDraft = normalizeModelSchema(imported);
  state.schemaView = "transfer";
  renderSchemaAdmin();
  showToast("Schéma chargé en brouillon");
}

function fieldKindLabel(kind) {
  return {
    text: "Texte court",
    textarea: "Texte long",
    number: "Nombre",
    boolean: "Oui / non",
    select: "Liste de valeurs",
    reference: "Référence"
  }[kind] || kind;
}

function safeSchemaId(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function bumpPatchVersion(version) {
  const parts = String(version || MODEL_SCHEMA_VERSION).split(".").map((part) => Number(part) || 0);
  return `${parts[0] || 1}.${parts[1] || 0}.${(parts[2] || 0) + 1}`;
}

function hideRightPanel() {
  els.rightPanel.classList.add("hidden");
  document.querySelector("#app").classList.remove("right-open");
  state.selectedId = null;
  state.highlightedCommentId = null;
  state.provider?.updatePresence({ selectedNodeId: null });
  renderAnalysis();
  updateVisibleGraph();
  updateDeepLink(null);
  scheduleGraphResize();
}

function toggleDrawer() {
  els.bottomDrawer.classList.toggle("collapsed");
  document.querySelector("#app").classList.toggle("drawer-open", !els.bottomDrawer.classList.contains("collapsed"));
  document.querySelector("#app").classList.toggle("drawer-collapsed", els.bottomDrawer.classList.contains("collapsed"));
  const icon = document.querySelector("#toggle-drawer i");
  icon.textContent = els.bottomDrawer.classList.contains("collapsed") ? "expand_less" : "expand_more";
  scheduleGraphResize();
}

function toggleAvatars(event) {
  event.preventDefault();
  toggleRealtimeMode(state.realtimeStatus !== "firebase");
}

async function activateRealtime(button) {
  if (!hasFirebaseConfig()) {
    showToast("Coprésence indisponible");
    renderConnectionStatus();
    return;
  }
  button.disabled = true;
  showToast("Activation de la présence…");
  state.providerVersion += 1;
  state.provider = createRealtimeProvider(true);
  bindRealtimeProvider(state.provider);
  await state.provider.connect({ userProfile: state.profile });
  localStorage.setItem(REALTIME_KEY, JSON.stringify(state.realtimeStatus === "firebase"));
  resetGamificationCycle();
  button.disabled = false;
  button.classList.toggle("active", state.realtimeStatus === "firebase");
  renderConnectionStatus();
  rebuildGraph();
}

async function deactivateRealtime() {
  if (state.authProvider === "google") {
    const anonymousProfile = getAnonymousProfile();
    await state.provider?.signOutGoogle?.(anonymousProfile);
    state.profile = anonymousProfile;
  }
  await state.provider?.disconnect?.();
  state.realtimeStatus = "local";
  localStorage.setItem(REALTIME_KEY, JSON.stringify(false));
  state.authUid = null;
  state.authEmail = null;
  state.authProvider = "local";
  state.isAdmin = false;
  state.providerVersion += 1;
  state.provider = createRealtimeProvider(false);
  bindRealtimeProvider(state.provider);
  await state.provider.connect({ userProfile: state.profile });
  resetGamificationCycle();
  state.avatarsVisible = true;
  renderConnectionStatus();
  rebuildGraph();
  renderPresence();
  renderRightPanel();
}

async function toggleRealtimeMode(enabled) {
  if (enabled) {
    await activateRealtime(document.querySelector("#toggle-avatars"));
  } else {
    await deactivateRealtime();
    showToast("Mode local actif");
  }
}

async function toggleGoogleAccount() {
  if (state.authProvider === "google") {
    await disconnectGoogleAccount();
    return;
  }
  await connectGoogleAccount();
}

async function connectGoogleAccount() {
  try {
    if (state.realtimeStatus !== "firebase") {
      await activateRealtime(document.querySelector("#toggle-avatars"));
    }
    if (typeof state.provider?.signInWithGoogle !== "function") {
      showToast("Connexion Google indisponible");
      return;
    }
    persistProfile(state.profile, "anonymous");
    await state.provider.signInWithGoogle();
    resetGamificationCycle();
    els.profileName.value = state.profile.displayName;
    els.profileInitial.value = state.profile.avatar;
    renderConnectionStatus();
    renderProfileButton();
    renderPresenceStrip();
    renderRightPanel();
    renderProfileControls();
    showToast(state.isAdmin ? "Compte Google administrateur connecté" : "Compte Google connecté");
  } catch {
    showToast("Connexion Google annulée ou indisponible");
  }
}

async function disconnectGoogleAccount() {
  try {
    const anonymousProfile = getAnonymousProfile();
    await state.provider?.signOutGoogle?.(anonymousProfile);
    state.profile = anonymousProfile;
    resetGamificationCycle();
    renderConnectionStatus();
    renderProfileButton();
    renderProfileControls();
    renderPresenceStrip();
    showToast("Compte Google déconnecté");
  } catch {
    showToast("Déconnexion Google indisponible");
  }
}

function hasFirebaseConfig() {
  const config = window.APP_CONFIG?.realtime || {};
  return config.provider === "firebase" && config.firebase?.apiKey && config.firebase?.databaseURL;
}

function openProfile() {
  renderProfileControls();
  if (els.realtimeSwitch) els.realtimeSwitch.checked = state.realtimeStatus === "firebase";
  const willOpen = els.profileMenu.classList.contains("hidden");
  closeActivityPanel();
  els.profileMenu.classList.toggle("hidden", !willOpen);
  document.querySelector("#app").classList.toggle("profile-open", willOpen);
}

function closeProfile() {
  els.profileMenu.classList.add("hidden");
  document.querySelector("#app").classList.remove("profile-open");
  pauseGamificationVisual();
}

function toggleProfileSettings() {
  const open = els.profileSettingsPanel?.classList.contains("hidden");
  els.profileSettingsPanel?.classList.toggle("hidden", !open);
  els.profileSettingsToggle?.setAttribute("aria-expanded", String(open));
  els.profileSettingsToggle?.classList.toggle("open", Boolean(open));
}

function openActivityPanel() {
  closeProfile();
  const willOpen = els.activityPanel.classList.contains("hidden");
  els.activityPanel.classList.toggle("hidden", !willOpen);
  document.querySelector("#app").classList.toggle("activity-open", willOpen);
  if (willOpen) renderActivityPanel();
}

function closeActivityPanel() {
  els.activityPanel?.classList.add("hidden");
  document.querySelector("#app").classList.remove("activity-open");
}

function renderActivityButton() {
  if (!els.activityButton) return;
  const online = state.realtimeStatus === "firebase";
  els.activitySlot?.classList.toggle("is-visible", online);
  els.activitySlot?.setAttribute("aria-hidden", String(!online));
  els.activityButton.tabIndex = online ? 0 : -1;
  const unread = state.activity.filter((item) => VISIBLE_ACTIVITY_TYPES.has(item.type) && item.actorId !== state.authUid && !state.activityRead.has(item.id)).length;
  els.activityBadge.textContent = unread > 99 ? "99+" : String(unread);
  els.activityBadge.classList.toggle("hidden", unread === 0);
  const label = unread ? `${unread} activité${unread > 1 ? "s" : ""} non vue${unread > 1 ? "s" : ""}` : "Fil d’activité";
  els.activityButton.setAttribute("aria-label", label);
  const tooltip = els.activityButton.querySelector(".tooltip");
  if (tooltip) tooltip.textContent = label;
}

function renderActivityPanel() {
  if (!els.activityContent) return;
  document.querySelectorAll(".admin-only").forEach((item) => item.classList.toggle("hidden", !state.isAdmin));
  document.querySelector("#activity-tabs")?.classList.toggle("admin-mode", state.isAdmin);
  if (state.activityTab === "trash" && !state.isAdmin) state.activityTab = "unread";
  document.querySelectorAll("[data-activity-tab]").forEach((item) => {
    item.classList.toggle("active", item.dataset.activityTab === state.activityTab);
  });
  if (state.activityTab === "trash") {
    renderTrashActivity();
    return;
  }
  const wantsRead = state.activityTab === "read";
  const items = state.activity.filter((item) => VISIBLE_ACTIVITY_TYPES.has(item.type) && state.activityRead.has(item.id) === wantsRead);
  els.activityContent.innerHTML = items.length
    ? `<div class="activity-list">${items.map(renderActivityItem).join("")}</div>`
    : `<p class="empty-state">${wantsRead ? "Aucune activité consultée." : "Aucune nouvelle activité."}</p>`;
  els.activityContent.querySelectorAll("[data-activity-id]").forEach((button) => {
    button.addEventListener("click", () => openActivityItem(button.dataset.activityId));
  });
}

function renderActivityItem(item) {
  const labels = {
    comment: "a commenté",
    reply: "a répondu"
  };
  const comment = findComment(item.commentId);
  const reactions = comment ? getCommentReactions(comment) : [];
  return `<button class="activity-item" type="button" data-activity-id="${escapeHtml(item.id)}">
    <span class="activity-timeline-dot" aria-hidden="true"></span>
    ${avatarMarkup({ actorId: item.actorId, avatar: item.actorAvatar, photoURL: item.actorPhotoURL, color: item.actorColor })}
    <span class="activity-copy">
      <span class="activity-title"><strong>${escapeHtml(item.actorName || "Anonyme")} ${escapeHtml(labels[item.type] || "a interagi")}</strong>${relativeTimeMarkup(item.createdAt, "time")}</span>
      <span class="activity-entity">${escapeHtml(item.entityLabel || "Élément")}</span>
      ${item.text ? `<span class="activity-message">${escapeHtml(item.text)}</span>` : ""}
      ${reactions.length ? `<span class="activity-reactions">${reactions.map((reaction) => `<span>${reactionEmojiMarkup(reaction)}${reaction.count ? `<strong>${reaction.count}</strong>` : ""}</span>`).join("")}</span>` : ""}
    </span>
  </button>`;
}

function openActivityItem(activityId) {
  const item = state.activity.find((entry) => entry.id === activityId);
  if (!item) return;
  state.activityRead.add(activityId);
  persistActivityRead();
  renderActivityButton();
  if (item.entityId && state.entities.has(item.entityId)) {
    state.selectedId = item.entityId;
    state.activeTab = "discussion";
    state.highlightedCommentId = item.parentId || item.commentId;
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === "discussion"));
    renderRightPanel();
    renderAnalysis();
    document.querySelector("#app").classList.add("right-open");
    els.rightPanel.classList.remove("hidden");
    updateVisibleGraph();
  }
  closeActivityPanel();
}

function renderTrashActivity() {
  const deleted = getAllComments().filter((comment) => comment.deletedAt).sort((a, b) => b.deletedAt - a.deletedAt);
  els.activityContent.innerHTML = deleted.length
    ? `<div class="trash-list">${deleted.map((comment) => `
      <article class="trash-item">
        <div><strong>${escapeHtml(comment.displayName || "Anonyme")}</strong><span>${escapeHtml(state.entities.get(comment.entityId)?.label || comment.entityId)}</span></div>
        <p>${escapeHtml(shortLabel(comment.text || "", 160))}</p>
        <small>Supprimé par ${escapeHtml(comment.deletedByName || "administrateur")} · ${relativeTimeMarkup(comment.deletedAt, "span")}</small>
        <div class="comment-actions">
          <button type="button" data-restore-comment="${escapeHtml(comment.id)}"><i>restore</i>Restaurer</button>
          <button type="button" data-purge-comment="${escapeHtml(comment.id)}"><i>delete_forever</i>Supprimer définitivement</button>
        </div>
      </article>
    `).join("")}</div>`
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

function scheduleProfileSave() {
  clearTimeout(state.profileSaveTimer);
  state.profileSaveTimer = setTimeout(saveProfile, 650);
}

function saveProfile() {
  state.profile.displayName = els.profileName.value.trim() || "Anonyme";
  state.profile.avatar = els.profileInitial.value.trim().slice(0, 2) || "A";
  state.profile.color = els.profileColor?.value || state.profile.color;
  state.profile.avatarMode = document.querySelector("[name='avatar-mode']:checked")?.value || "initials";
  state.profile.photoURL = state.profile.avatarMode === "google" ? state.profile.googlePhotoURL || null : null;
  state.profile.userCustomized = true;
  persistProfile(state.profile, state.authProvider === "google" ? "google" : "anonymous");
  renderProfileButton();
  renderProfileIdentity();
  if (els.profileColorPreview) {
    applyAvatarElement(els.profileColorPreview, state.profile);
  }
  state.provider?.syncProfile(state.profile);
  renderPresence();
  renderPresenceStrip();
  if (state.activeTab === "discussion") renderDiscussion();
}

async function clearLocalData() {
  const confirmed = window.confirm("Réinitialiser complètement l’application et créer une nouvelle identité locale ?");
  if (!confirmed) return;
  try {
    if (state.provider?.authApi && state.provider?.auth) {
      await state.provider.authApi.signOut(state.provider.auth);
    }
  } catch {
    // Le nettoyage local doit rester possible même si Firebase est indisponible.
  }
  await state.provider?.disconnect?.();
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(ANONYMOUS_PROFILE_KEY);
  localStorage.removeItem(GOOGLE_PROFILE_KEY);
  localStorage.removeItem(COMMENTS_KEY);
  localStorage.removeItem(DRAFTS_KEY);
  localStorage.removeItem(ACTIVITY_READ_KEY);
  localStorage.removeItem(THEME_KEY);
  localStorage.removeItem(REALTIME_KEY);
  window.location.reload();
}

function renderProfileButton() {
  applyAvatarElement(els.profileAvatar, state.profile);
}

function renderProfileControls() {
  els.profileName.value = state.profile.displayName;
  els.profileInitial.value = state.profile.avatar;
  if (els.profileColor) els.profileColor.value = state.profile.color;
  const googleChoice = document.querySelector("[name='avatar-mode'][value='google']");
  const initialsChoice = document.querySelector("[name='avatar-mode'][value='initials']");
  const canUseGooglePhoto = Boolean(state.profile.googlePhotoURL && state.authProvider === "google");
  document.querySelector(".avatar-choice")?.classList.toggle("hidden", !canUseGooglePhoto);
  document.querySelector("#avatar-photo-choice")?.classList.toggle("hidden", !canUseGooglePhoto);
  if (googleChoice) googleChoice.checked = canUseGooglePhoto && state.profile.avatarMode === "google";
  if (initialsChoice) initialsChoice.checked = !googleChoice?.checked;
  if (els.profileColorPreview) {
    applyAvatarElement(els.profileColorPreview, state.profile);
  }
  renderGamificationCard();
  renderProfileIdentity();
  renderThemeChoice();
}

function renderGamificationCard() {
  if (!els.gamificationCard) return;
  const online = state.realtimeStatus === "firebase";
  const globalScore = Number(state.gamification.scores?.global?.totalHearts || 0);
  const projectScore = Number(state.gamification.scores?.project?.projectHearts || 0);
  const cycle = state.gamification.cycle;
  const remaining = Math.max(0, HEART_CYCLE_SECONDS - cycle.activeSeconds);
  const progress = Math.min(1, cycle.activeSeconds / HEART_CYCLE_SECONDS);
  const active = isGamificationActive();
  const signature = [
    online,
    active,
    globalScore,
    projectScore,
    cycle.points,
    cycle.activeSeconds,
    cycle.breakdown.click,
    cycle.breakdown.reaction,
    cycle.breakdown.reply,
    cycle.breakdown.comment,
    cycle.breakdown.linkPreview,
    cycle.breakdown.linkOpen,
    cycle.breakdown.linkCopy,
    cycle.breakdown.linkEmbed
  ].join("|");
  if (state.gamification.lastRenderSignature !== signature) {
    state.gamification.lastRenderSignature = signature;
    els.gamificationCard.innerHTML = online ? `
      <div class="heart-hero">
        <div class="heart-reactor" aria-hidden="true" style="--progress:${progress}; --beat:0;">
          <span class="heart-aura"></span>
          <span class="heart-orbit orbit-a"></span>
          <span class="heart-orbit orbit-b"></span>
          <svg class="heart-core" viewBox="0 0 160 160" role="img" aria-label="">
            <defs>
              <linearGradient id="heart-core-gradient" x1="20%" y1="0%" x2="84%" y2="100%">
                <stop offset="0%" stop-color="#ff9ec8"></stop>
                <stop offset="48%" stop-color="#ff3f87"></stop>
                <stop offset="100%" stop-color="#b3165f"></stop>
              </linearGradient>
              <filter id="heart-core-glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="7" result="blur"></feGaussianBlur>
                <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0.95 0 0.1 0 0 0.18 0 0 1 0 0.62 0 0 0 0.78 0"></feColorMatrix>
                <feMerge><feMergeNode></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
              </filter>
            </defs>
            <path class="heart-core-path" filter="url(#heart-core-glow)" fill="url(#heart-core-gradient)" d="M80 133C37 102 20 78 20 51c0-19 14-33 33-33 12 0 22 6 27 16 5-10 15-16 27-16 19 0 33 14 33 33 0 27-17 51-60 82Z"></path>
            <path class="heart-sheen" d="M46 36c13-11 31-7 38 9" fill="none" stroke="rgba(255,255,255,.62)" stroke-width="7" stroke-linecap="round"></path>
          </svg>
          <svg class="heart-progress" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52"></circle>
            <circle cx="60" cy="60" r="52"></circle>
          </svg>
          <span class="heart-signal signal-a"></span>
          <span class="heart-signal signal-b"></span>
          <span class="heart-cycle">${formatHeartTime(remaining)}</span>
        </div>
        <div class="heart-copy">
          <p class="kicker">Coprésence vivante</p>
          <h3><span data-heart-counter="cycle">${cycle.points}</span> ❤️</h3>
          <span>${active ? "Attention active" : "En pause douce"} · prochain cycle dans ${formatHeartTime(remaining)}</span>
        </div>
      </div>
      <div class="heart-score-grid">
        <span><small>Total</small><strong data-heart-counter="global">${globalScore}</strong></span>
        <span><small>Projet</small><strong data-heart-counter="project">${projectScore}</strong></span>
      </div>
      <div class="heart-breakdown" aria-label="Détail des cœurs du cycle">
        ${heartBreakdownItem("schedule", "Temps", cycle.breakdown.second)}
        ${heartBreakdownItem("touch_app", "Clics", cycle.breakdown.click)}
        ${heartBreakdownItem("add_reaction", "Réactions", cycle.breakdown.reaction)}
        ${heartBreakdownItem("reply", "Réponses", cycle.breakdown.reply)}
        ${heartBreakdownItem("chat", "Contributions", cycle.breakdown.comment)}
        ${heartBreakdownItem("visibility", "Aperçus", cycle.breakdown.linkPreview)}
        ${heartBreakdownItem("open_in_new", "Ouvertures", cycle.breakdown.linkOpen)}
        ${heartBreakdownItem("content_copy", "Copies", cycle.breakdown.linkCopy)}
        ${heartBreakdownItem("fullscreen", "Intégrations", cycle.breakdown.linkEmbed)}
      </div>
    ` : `
      <div class="heart-idle">
        <i>favorite</i>
        <div>
          <p class="kicker">💓 coprésence</p>
          <strong>Activez la coprésence pour lancer les cycles d’attention.</strong>
          <span>Les points sont synchronisés par sessions actives de ${HEART_CYCLE_SECONDS} secondes.</span>
        </div>
      </div>
    `;
  }
  updateHeartCounters({ globalScore, projectScore, cyclePoints: cycle.points });
  syncGamificationVisual({ online, active, progress, cyclePoints: cycle.points });
}

function heartBreakdownItem(icon, label, value) {
  return `<span><i aria-hidden="true">${icon}</i><small>${escapeHtml(label)}</small><strong>${Number(value || 0)}</strong></span>`;
}

function formatHeartTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function updateHeartCounters(values) {
  animateHeartCounter("global", values.globalScore);
  animateHeartCounter("project", values.projectScore);
  animateHeartCounter("cycle", values.cyclePoints);
}

function animateHeartCounter(name, target) {
  const element = els.gamificationCard?.querySelector(`[data-heart-counter="${name}"]`);
  if (!element) return;
  const key = name === "global" ? "totalHearts" : name === "project" ? "projectHearts" : "cycleHearts";
  const start = Number(state.gamification.shownTotals[key] || 0);
  const end = Number(target || 0);
  state.gamification.shownTotals[key] = end;
  if (start === end) {
    element.textContent = String(end);
    return;
  }
  const started = performance.now();
  const duration = 520;
  const step = (now) => {
    if (!document.body.contains(element)) return;
    const t = Math.min(1, (now - started) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    element.textContent = String(Math.round(start + (end - start) * eased));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function syncGamificationVisual({ online, active, progress, cyclePoints }) {
  const reactor = els.gamificationCard?.querySelector(".heart-reactor");
  const shouldRun = Boolean(online && reactor && !els.profileMenu?.classList.contains("hidden") && !document.hidden);
  if (!shouldRun) {
    pauseGamificationVisual();
    return;
  }
  if (!state.gamification.view || state.gamification.view.element !== reactor) {
    state.gamification.view?.destroy();
    state.gamification.view = new GamificationHeartView(reactor);
  }
  state.gamification.view.update({ active, progress, intensity: 0.72 + Math.min(0.5, cyclePoints / 420) });
  state.gamification.view.start();
}

function pauseGamificationVisual() {
  state.gamification.view?.stop();
}

class GamificationHeartView {
  constructor(element) {
    this.element = element;
    this.frame = null;
    this.lastFrame = 0;
    this.progress = 0;
    this.active = false;
    this.intensity = 0.8;
  }

  update({ active, progress, intensity }) {
    this.active = Boolean(active);
    this.progress = progress || 0;
    this.intensity = intensity || 0.8;
  }

  start() {
    if (this.frame) return;
    const loop = (now) => {
      this.frame = requestAnimationFrame(loop);
      if (now - this.lastFrame < 33) return;
      this.lastFrame = now;
      this.render(now);
    };
    this.frame = requestAnimationFrame(loop);
  }

  stop() {
    if (!this.frame) return;
    cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  resize() {
    // Kept for API symmetry with the previous renderer.
  }

  render(now) {
    if (!this.element) return;
    const t = now / 1000;
    const beat = this.active ? 0.5 + Math.sin(t * 3.4) * 0.5 : 0.18 + Math.sin(t * 1.25) * 0.12;
    const drift = Math.sin(t * 0.8) * 0.5 + 0.5;
    this.element.style.setProperty("--beat", beat.toFixed(3));
    this.element.style.setProperty("--drift", drift.toFixed(3));
    this.element.style.setProperty("--intensity", this.intensity.toFixed(3));
    this.element.style.setProperty("--progress", String(this.progress));
    this.element.classList.toggle("is-active", this.active);
  }

  destroy() {
    this.stop();
    this.element = null;
  }
}

function renderProfileIdentity() {
  if (!els.profileIdentity) return;
  const identity = getIdentityState();
  els.profileIdentity.innerHTML = `
    ${avatarMarkup(state.profile, "width:34px;height:34px;")}
    <div><strong>${escapeHtml(identity.label)}</strong><span>${escapeHtml(identity.detail)}</span></div>
    <span class="account-state ${identity.connected ? "connected" : ""}">${escapeHtml(identity.connected ? "Actif" : "Local")}</span>
  `;
  const initialsPreview = document.querySelector("#avatar-choice-initials");
  if (initialsPreview) {
    initialsPreview.textContent = state.profile.avatar;
    initialsPreview.style.background = state.profile.color;
  }
  const photoPreview = document.querySelector("#avatar-choice-photo");
  if (photoPreview) applyAvatarElement(photoPreview, {
    ...state.profile,
    photoURL: state.profile.googlePhotoURL || null
  });
}

function renderThemeChoice() {
  const theme = loadJson(THEME_KEY, "system");
  document.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.classList.toggle("active", button.dataset.themeChoice === theme);
    button.setAttribute("aria-pressed", String(button.dataset.themeChoice === theme));
  });
}

function applyTheme(theme) {
  const resolved = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : theme;
  document.documentElement.dataset.theme = resolved;
  if (state.graphView) updateVisibleGraph();
}

function renderConnectionStatus() {
  const online = state.presence.filter((item) => Date.now() - item.lastSeen < 45000).length || 1;
  els.realtimeMode.textContent = state.realtimeStatus === "firebase" ? "Coprésence" : "Local";
  els.presenceCount.textContent = String(online);
  const button = document.querySelector("#toggle-avatars");
  button.classList.toggle("active", state.realtimeStatus === "firebase");
  button.classList.toggle("online", state.realtimeStatus === "firebase");
  button.setAttribute("aria-pressed", state.realtimeStatus === "firebase" ? "true" : "false");
  const presenceLabel = state.realtimeStatus === "firebase" ? "Désactiver la coprésence" : "Activer la coprésence";
  button.setAttribute("aria-label", presenceLabel);
  const presenceTooltip = button.querySelector(".tooltip");
  if (presenceTooltip) presenceTooltip.textContent = presenceLabel;
  if (els.authMode) els.authMode.textContent = state.authProvider === "google"
    ? state.isAdmin ? "Google · admin" : "Google"
    : state.realtimeStatus === "firebase" ? "Anonyme Firebase" : "Non connecté";
  if (els.realtimeSwitch) els.realtimeSwitch.checked = state.realtimeStatus === "firebase";
  if (els.googleLogin) {
    els.googleLogin.disabled = !hasFirebaseConfig();
    els.googleLogin.classList.toggle("connected", state.authProvider === "google");
    els.googleLogin.querySelector("i").textContent = state.authProvider === "google" ? "logout" : "account_circle";
    els.googleLogin.querySelector("span").textContent = state.authProvider === "google"
      ? state.isAdmin ? "Déconnexion Google · admin" : "Déconnexion Google"
      : "Connexion Google";
  }
  const schemaButton = document.querySelector("#open-schema-admin");
  if (schemaButton) {
    schemaButton.disabled = !canAdministerSchema();
    schemaButton.title = canAdministerSchema() ? "" : "Droits administrateur requis";
  }
  if (!canAdministerSchema()) closeSchemaAdmin();
  document.querySelector("#realtime-dot")?.classList.toggle("online", state.realtimeStatus === "firebase");
  document.querySelector("#realtime-dot")?.classList.toggle("offline", state.realtimeStatus !== "firebase");
  renderTypeFilters();
  renderActivityButton();
  renderGamificationCard();
  renderProfileIdentity();
}

function rebuildGraph() {
  state.graph = buildGraph(state.entities);
  restoreGraphLayout();
  buildSearchIndex();
  updateVisibleGraph();
  renderAnalysis();
}

function startRightResize(event) {
  state.resize = { type: "right", startX: event.clientX, startWidth: els.rightPanel.getBoundingClientRect().width };
  event.preventDefault();
}

function startBottomResize(event) {
  els.bottomDrawer.classList.remove("collapsed");
  document.querySelector("#app").classList.add("drawer-open");
  document.querySelector("#app").classList.remove("drawer-collapsed");
  state.resize = { type: "bottom", startY: event.clientY, startHeight: els.bottomDrawer.getBoundingClientRect().height };
  event.preventDefault();
}

function resizePanels(event) {
  if (!state.resize) return;
  if (state.resize.type === "right") {
    const width = Math.min(
      Math.max(state.resize.startWidth + state.resize.startX - event.clientX, 340),
      Math.max(340, window.innerWidth * 0.9)
    );
    document.documentElement.style.setProperty("--right-panel-width", `${Math.round(width)}px`);
  }
  if (state.resize.type === "bottom") {
    const height = Math.min(Math.max(state.resize.startHeight + state.resize.startY - event.clientY, 180), Math.min(560, window.innerHeight - 180));
    document.documentElement.style.setProperty("--bottom-drawer-height", `${Math.round(height)}px`);
  }
  resizeGraph();
}

function stopResize() {
  state.resize = null;
}

function resetView() {
  hideRightPanel();
  resetGraphInteractionState();
  state.activeTypes = new Set(Object.keys(TYPE_CONFIG));
  if (state.realtimeStatus === "firebase") state.activeTypes.add("contribution");
  clearSearchState();
  clearPersistedLayout();
  releaseGraphLayout();
  state.graph = buildGraph(state.entities);
  state.visibleGraph = { nodes: [], links: [] };
  updateSearchControl();
  renderSearchResults();
  renderTypeFilters();
  updateVisibleGraph({ skipPositionSync: true });
  renderAnalysis();
  state.graphView.d3ReheatSimulation?.();
  fitVisibleGraph(800, RESET_FIT_PADDING);
}

function toggleResetConfirm() {
  const open = els.resetViewPopover?.classList.contains("hidden");
  if (open) {
    closeProjectMenu();
    closeFilterMenu();
    closeGraphSearch();
    closeGraphHelp();
  }
  els.resetViewPopover?.classList.toggle("hidden", !open);
  els.resetViewButton?.setAttribute("aria-expanded", String(open));
  if (open) requestAnimationFrame(() => positionToolbarPopover(els.resetViewPopover, els.resetViewButton));
}

function closeResetConfirm() {
  els.resetViewPopover?.classList.add("hidden");
  els.resetViewButton?.setAttribute("aria-expanded", "false");
}

function toggleGraphHelp() {
  const open = els.graphHelpPopover?.classList.contains("hidden");
  if (open) {
    closeProjectMenu();
    closeFilterMenu();
    closeGraphSearch();
    closeResetConfirm();
  }
  els.graphHelpPopover?.classList.toggle("hidden", !open);
  els.graphHelpToggle?.setAttribute("aria-expanded", String(open));
  if (open) requestAnimationFrame(() => positionToolbarPopover(els.graphHelpPopover, els.graphHelpToggle));
}

function closeGraphHelp() {
  els.graphHelpPopover?.classList.add("hidden");
  els.graphHelpToggle?.setAttribute("aria-expanded", "false");
}

function clearSelection() {
  if (!state.selectedId && els.rightPanel.classList.contains("hidden")) return;
  hideRightPanel();
}

function clearSearch() {
  clearSearchState();
  updateSearchControl();
  updateVisibleGraph();
  renderSearchResults();
  if (state.selectedId) renderRightPanel();
  els.search.focus();
}

function toggleGraphSearch() {
  if (els.graphSearchPopover.classList.contains("hidden")) openGraphSearch();
  else closeGraphSearch();
}

function openGraphSearch() {
  closeFilterMenu();
  closeResetConfirm();
  closeGraphHelp();
  closeProjectMenu();
  els.graphSearchPopover?.classList.remove("hidden");
  els.graphSearchToggle?.setAttribute("aria-expanded", "true");
  requestAnimationFrame(() => {
    positionToolbarPopover(els.graphSearchPopover, els.graphSearchToggle);
    els.search?.focus();
  });
  renderSearchResults();
}

function closeGraphSearch() {
  els.graphSearchPopover?.classList.add("hidden");
  els.graphSearchToggle?.setAttribute("aria-expanded", "false");
}

function positionOpenToolbarPopover() {
  if (els.typeFilters && !els.typeFilters.classList.contains("hidden")) positionToolbarPopover(els.typeFilters, els.filterMenuToggle);
  if (els.graphSearchPopover && !els.graphSearchPopover.classList.contains("hidden")) positionToolbarPopover(els.graphSearchPopover, els.graphSearchToggle);
  if (els.resetViewPopover && !els.resetViewPopover.classList.contains("hidden")) positionToolbarPopover(els.resetViewPopover, els.resetViewButton);
  if (els.graphHelpPopover && !els.graphHelpPopover.classList.contains("hidden")) positionToolbarPopover(els.graphHelpPopover, els.graphHelpToggle);
}

function positionToolbarPopover(popover, anchor) {
  if (!popover || popover.classList.contains("hidden")) return;
  const toolbar = document.querySelector(".graph-toolbar");
  const anchorRect = toolbar?.getBoundingClientRect() || anchor?.getBoundingClientRect();
  if (!anchorRect) return;
  const popoverRect = popover.getBoundingClientRect();
  const gap = 10;
  const minMargin = 10;
  const maxLeft = window.innerWidth - popoverRect.width - minMargin;
  const maxTop = window.innerHeight - popoverRect.height - minMargin;
  const left = Math.max(minMargin, Math.min(maxLeft, anchorRect.right + gap));
  const top = Math.max(minMargin, Math.min(maxTop, anchorRect.top));
  popover.style.left = `${Math.round(left)}px`;
  popover.style.top = `${Math.round(top)}px`;
}

function buildSearchIndex() {
  const docs = [...state.graph.nodes]
    .filter((node) => node.type !== "contribution")
    .map((node) => {
      const metadata = Object.entries(node)
        .filter(([key, value]) => !["body", "rawText", "imageURL"].includes(key) && typeof value !== "object")
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
      return {
        id: node.id,
        type: node.type,
        label: node.label || "",
        summary: node.summary || "",
        body: node.body || "",
        tags: Array.isArray(node.tags) ? node.tags.join(" ") : String(node.tags || ""),
        keywords: Array.isArray(node.keywords) ? node.keywords.join(" ") : String(node.keywords || ""),
        metadata,
        haystack: getSearchText(node)
      };
    });
  state.searchDocs = docs;
  state.searchIndex = window.Fuse
    ? new window.Fuse(docs, {
      includeMatches: true,
      includeScore: true,
      threshold: 0.36,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: [
        { name: "label", weight: 0.38 },
        { name: "summary", weight: 0.22 },
        { name: "body", weight: 0.22 },
        { name: "keywords", weight: 0.08 },
        { name: "tags", weight: 0.06 },
        { name: "metadata", weight: 0.04 }
      ]
    })
    : null;
}

function runGraphSearch(value) {
  state.searchQuery = value;
  state.searchTerm = normalizeSearchText(value);
  updateSearchControl();
  if (!state.searchTerm) {
    state.searchResults = [];
    state.searchActiveIndex = -1;
    state.searchMatchedIds = new Set();
    renderSearchResults();
    updateVisibleGraph();
    if (state.selectedId) renderRightPanel();
    return;
  }
  const results = state.searchIndex
    ? state.searchIndex.search(value).slice(0, SEARCH_RESULT_LIMIT).map((result) => ({
      item: result.item,
      score: result.score,
      excerpt: getSearchExcerpt(result.item, value, result.matches)
    }))
    : fallbackSearch(value);
  state.searchResults = results;
  state.searchActiveIndex = results.length ? 0 : -1;
  state.searchMatchedIds = new Set(results.map((result) => result.item.id));
  renderSearchResults();
  updateVisibleGraph();
  if (results[0]) navigateToSearchResult(0, { fromInput: true });
}

function fallbackSearch(value) {
  const term = normalizeSearchText(value);
  return (state.searchDocs || [])
    .filter((item) => item.haystack.includes(term))
    .slice(0, SEARCH_RESULT_LIMIT)
    .map((item) => ({ item, score: 0.5, excerpt: getFallbackExcerpt(item, term) }));
}

function renderSearchResults() {
  if (!els.graphSearchResults || !els.graphSearchStatus) return;
  if (!state.searchTerm) {
    els.graphSearchStatus.textContent = "Tapez un mot-clé, un titre ou un fragment de contenu.";
    els.graphSearchResults.innerHTML = "";
    return;
  }
  if (!state.searchResults.length) {
    els.graphSearchStatus.textContent = "Aucun résultat.";
    els.graphSearchResults.innerHTML = `<p class="empty-state compact">Aucune fiche ne correspond à cette recherche.</p>`;
    return;
  }
  els.graphSearchStatus.textContent = `${state.searchResults.length} résultat${state.searchResults.length > 1 ? "s" : ""}`;
  els.graphSearchResults.innerHTML = state.searchResults.map((result, index) => {
    const entity = state.entities.get(result.item.id);
    const type = TYPE_CONFIG[entity?.type]?.singular || entity?.type || "Fiche";
    const active = index === state.searchActiveIndex;
    return `
      <button class="graph-search-result${active ? " active" : ""}" type="button" role="option" aria-selected="${active}" data-search-index="${index}">
        <span class="dot" style="background:${TYPE_CONFIG[entity?.type]?.color || "#9aa6ad"}"></span>
        <span>
          <strong>${escapeHtml(result.item.label)}</strong>
          <small>${escapeHtml(type)} · ${escapeHtml(result.excerpt || result.item.summary || "")}</small>
        </span>
      </button>
    `;
  }).join("");
  els.graphSearchResults.querySelectorAll("[data-search-index]").forEach((button) => {
    button.addEventListener("click", () => navigateToSearchResult(Number(button.dataset.searchIndex)));
  });
}

function navigateToSearchResult(index, options = {}) {
  const result = state.searchResults[index];
  if (!result) return;
  state.searchActiveIndex = index;
  renderSearchResults();
  selectNode(result.item.id, true);
  if (!options.fromInput) els.search?.focus();
}

function handleGraphSearchKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeGraphSearch();
    return;
  }
  if (!state.searchResults.length) return;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    const next = Math.min(state.searchResults.length - 1, state.searchActiveIndex + 1);
    navigateToSearchResult(next);
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    const previous = Math.max(0, state.searchActiveIndex - 1);
    navigateToSearchResult(previous);
  }
  if (event.key === "Enter") {
    event.preventDefault();
    navigateToSearchResult(Math.max(0, state.searchActiveIndex));
  }
}

function getSearchExcerpt(item, value, matches = []) {
  const bodyMatch = matches?.find((match) => ["body", "summary", "metadata", "label"].includes(match.key));
  const source = String(item[bodyMatch?.key] || item.body || item.summary || item.label || "");
  const matchIndex = bodyMatch?.indices?.[0]?.[0] ?? normalizeSearchText(source).indexOf(normalizeSearchText(value));
  return makeExcerpt(source, matchIndex);
}

function getFallbackExcerpt(item, term) {
  const source = [item.summary, item.body, item.metadata].filter(Boolean).join("\n");
  const index = normalizeSearchText(source).indexOf(term);
  return makeExcerpt(source, index);
}

function makeExcerpt(text, index) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const start = Math.max(0, index > -1 ? index - 42 : 0);
  const excerpt = clean.slice(start, start + 128);
  return `${start > 0 ? "…" : ""}${excerpt}${start + 128 < clean.length ? "…" : ""}`;
}

function clearSearchState() {
  if (els.search) els.search.value = "";
  state.searchQuery = "";
  state.searchTerm = "";
  state.searchResults = [];
  state.searchActiveIndex = -1;
  state.searchMatchedIds = new Set();
}

function updateSearchControl() {
  els.clearSearch?.classList.toggle("hidden", !els.search.value);
}

function fitVisibleGraph(duration = 700, padding = FIT_PADDING) {
  state.graphView.zoomToFit(duration, padding);
}

function focusSelectedLinkPath(sourceId, targetId) {
  const ids = state.selectedLinkPathIds?.size ? state.selectedLinkPathIds : new Set([sourceId, targetId]);
  fitNodeSet(ids, { duration: 720, padding: FOCUS_FIT_PADDING, fallbackId: state.entities.has(targetId) ? targetId : sourceId });
}

function scheduleInitialFit() {
  clearTimeout(state.initialFitTimer);
  state.initialFitTimer = setTimeout(() => fitVisibleGraph(850, FIT_PADDING), INITIAL_FIT_DELAY);
  clearTimeout(state.initialTightFitTimer);
  state.initialTightFitTimer = setTimeout(() => fitVisibleGraph(650, 12), INITIAL_FIT_DELAY + 650);
}

function zoomCamera(factor) {
  const camera = state.graphView.camera();
  state.graphView.cameraPosition({
    x: camera.position.x * factor,
    y: camera.position.y * factor,
    z: camera.position.z * factor
  }, undefined, 450);
}

function focusNode(id, distance = 180) {
  const node = state.graph.nodes.find((item) => item.id === id);
  if (!node || node.x == null) return;
  const length = Math.hypot(node.x, node.y, node.z) || 1;
  const ratio = 1 + distance / length;
  state.graphView.cameraPosition({ x: node.x * ratio, y: node.y * ratio, z: node.z * ratio }, node, 850);
}

function fitFocusedSelection(fallbackId = state.selectedId) {
  if (state.selectedLinkKey && state.selectedLinkPathIds?.size) {
    fitNodeSet(state.selectedLinkPathIds, { duration: 720, padding: FOCUS_FIT_PADDING, fallbackId });
    return;
  }
  if (state.selectedId && state.selectedPathIds?.size) {
    fitNodeSet(state.selectedPathIds, { duration: 720, padding: FOCUS_FIT_PADDING, fallbackId: state.selectedId });
    return;
  }
  if (fallbackId) focusNode(fallbackId, 120);
}

function fitNodeSet(ids, options = {}) {
  const nodeIds = ids instanceof Set ? ids : new Set(ids || []);
  const targets = state.visibleGraph.nodes.filter((node) => nodeIds.has(node.id) && node.x != null);
  if (targets.length >= 2) {
    tightenCameraOnNodes(targets, options);
    return;
  }
  focusNode(options.fallbackId || targets[0]?.id, 110);
}

function tightenCameraOnNodes(nodes, options = {}) {
  const points = nodes.filter((node) => node.x != null);
  if (!points.length) return;
  const center = points.reduce((acc, node) => ({
    x: acc.x + node.x,
    y: acc.y + node.y,
    z: acc.z + node.z
  }), { x: 0, y: 0, z: 0 });
  center.x /= points.length;
  center.y /= points.length;
  center.z /= points.length;
  const radius = Math.max(18, ...points.map((node) => Math.hypot(node.x - center.x, node.y - center.y, node.z - center.z) + (node.size || 8)));
  const camera = state.graphView.camera();
  const current = camera.position;
  const direction = {
    x: current.x - center.x,
    y: current.y - center.y,
    z: current.z - center.z
  };
  const length = Math.hypot(direction.x, direction.y, direction.z) || 1;
  const aspect = getGraphAspectRatio();
  const distance = Math.max(46, radius * (aspect > 1.35 ? 1.35 : 1.7));
  const target = {
    x: center.x + direction.x / length * distance,
    y: center.y + direction.y / length * distance,
    z: center.z + direction.z / length * distance
  };
  state.graphView.cameraPosition(target, center, options.duration || 620);
}

function getGraphAspectRatio() {
  const rect = els.graphStage.getBoundingClientRect();
  return Math.max(0.7, Math.min(2.4, rect.width / Math.max(1, rect.height)));
}

function resizeGraph() {
  const rect = els.graphStage.getBoundingClientRect();
  state.graphView.width(Math.max(320, rect.width)).height(Math.max(240, rect.height));
  renderPresence();
  positionOpenToolbarPopover();
}

function scheduleGraphResize() {
  clearTimeout(state.graphResizeTimer);
  resizeGraph();
  state.graphResizeTimer = setTimeout(resizeGraph, 220);
  requestAnimationFrame(() => requestAnimationFrame(resizeGraph));
}

function getImageExtensionFromBlob(blob) {
  const extension = String(blob?.name || "").split(".").pop().toLowerCase();
  if (PACK_ASSET_EXTENSIONS.has(extension)) return extension;
  return {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg"
  }[blob?.type] || "png";
}

function getScoreBoost(entity) {
  const score = Math.max(Number(entity.influence_score || 0), Number(entity.dependence_score || 0));
  return score ? score * 0.32 : 0;
}

function getLinkDistance(link) {
  const source = state.graph.nodes.find((node) => node.id === getId(link.source));
  const target = state.graph.nodes.find((node) => node.id === getId(link.target));
  return Math.min(112, 68 + Math.max(source?.size || 8, target?.size || 8) * 1.3);
}

function getLinkTargetColor(link) {
  const target = state.entities.get(getId(link.target));
  return TYPE_CONFIG[target?.type]?.color || "#e0a336";
}

function getLinkKey(link) {
  return `${getId(link.source)}|${getId(link.target)}|${link.type || "related_to"}`;
}

function getSearchText(node) {
  return normalizeSearchText([node.id, node.label, node.summary, ...(node.keywords || []), ...(node.tags || []), node.body].join(" "));
}

function isTextInputActive() {
  const element = document.activeElement;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(element?.tagName) || element?.isContentEditable;
}

function decorateSmartLinks(root = document) {
  root.querySelectorAll?.('a[href^="http://"], a[href^="https://"]').forEach((link) => {
    if (link.dataset.smartLink) return;
    link.dataset.smartLink = link.href;
    link.rel = "noopener noreferrer";
    link.target = "_blank";
  });
}

function renderSmartText(text) {
  const source = String(text || "");
  const urlPattern = /(https?:\/\/[^\s<>"')\]]+)/g;
  let cursor = 0;
  let html = "";
  for (const match of source.matchAll(urlPattern)) {
    const url = match[0];
    html += escapeHtml(source.slice(cursor, match.index));
    html += `<a href="${escapeHtml(url)}" data-smart-link="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(shortLabel(url, 48))}</a>`;
    cursor = match.index + url.length;
  }
  html += escapeHtml(source.slice(cursor));
  return html;
}

function handleSmartLinkHover(event) {
  const link = event.target.closest?.("[data-smart-link]");
  if (!link || link === state.linkPreview.anchor) return;
  openLinkPreview(link, { passive: true });
}

function handleSmartLinkFocus(event) {
  const link = event.target.closest?.("[data-smart-link]");
  if (link) openLinkPreview(link, { passive: true });
}

function handleSmartLinkClick(event) {
  const link = event.target.closest?.("[data-smart-link]");
  const action = event.target.closest?.("[data-link-action]");
  if (action) {
    event.preventDefault();
    runSmartLinkAction(action.dataset.linkAction);
    return;
  }
  if (!link) return;
  event.preventDefault();
  openLinkPreview(link);
}

function openLinkPreview(link, options = {}) {
  const url = link?.dataset.smartLink || link?.href;
  if (!url || !els.linkPreviewPopover) return;
  state.linkPreview = {
    url,
    title: link.textContent?.trim() || url,
    anchor: link
  };
  els.linkPreviewPopover.innerHTML = renderLinkPreview(url, state.linkPreview.title);
  els.linkPreviewPopover.classList.remove("hidden");
  positionLinkPreview(link);
  if (!options.passive) recordHeartEvent("linkPreview", HEART_POINTS.linkPreview);
}

function renderLinkPreview(url, title) {
  let parsed = null;
  try {
    parsed = new URL(url);
  } catch {
    parsed = null;
  }
  const host = parsed?.hostname?.replace(/^www\./, "") || "Lien externe";
  const initial = host.charAt(0).toUpperCase() || "L";
  return `
    <div class="link-preview-head">
      <span class="link-preview-icon">${escapeHtml(initial)}</span>
      <div>
        <strong>${escapeHtml(shortLabel(title || host, 76))}</strong>
        <span>${escapeHtml(host)}</span>
      </div>
    </div>
    <p>${escapeHtml(shortLabel(url, 120))}</p>
    <div class="link-preview-actions">
      <button type="button" data-link-action="open"><i>open_in_new</i>Ouvrir</button>
      <button type="button" data-link-action="copy"><i>content_copy</i>Copier</button>
      <button type="button" data-link-action="embed"><i>fullscreen</i>Intégrer</button>
    </div>
  `;
}

function positionLinkPreview(anchor) {
  if (!anchor || !els.linkPreviewPopover) return;
  const rect = anchor.getBoundingClientRect();
  const popover = els.linkPreviewPopover;
  const width = Math.min(360, window.innerWidth - 20);
  popover.style.width = `${width}px`;
  const height = popover.offsetHeight || 180;
  const left = Math.max(10, Math.min(window.innerWidth - width - 10, rect.left));
  const top = rect.bottom + height + 10 < window.innerHeight
    ? rect.bottom + 10
    : Math.max(10, rect.top - height - 10);
  popover.style.left = `${Math.round(left)}px`;
  popover.style.top = `${Math.round(top)}px`;
}

async function runSmartLinkAction(action) {
  const url = state.linkPreview.url;
  if (!url) return;
  if (action === "open") {
    recordHeartEvent("linkOpen", HEART_POINTS.linkOpen);
    window.open(url, "_blank", "noopener,noreferrer");
  }
  if (action === "copy") {
    try {
      await navigator.clipboard.writeText(url);
      recordHeartEvent("linkCopy", HEART_POINTS.linkCopy);
      showToast("Lien copié");
    } catch {
      showToast("Copie indisponible");
    }
  }
  if (action === "embed") {
    recordHeartEvent("linkEmbed", HEART_POINTS.linkEmbed);
    openLinkEmbed(url, state.linkPreview.title);
  }
}

function closeLinkPreview() {
  els.linkPreviewPopover?.classList.add("hidden");
}

function openLinkEmbed(url, title = "Lien") {
  if (!els.linkEmbedModal || !els.linkEmbedFrame) return;
  closeLinkPreview();
  els.linkEmbedTitle.textContent = shortLabel(title || url, 90);
  els.linkEmbedFrame.src = url;
  els.linkEmbedModal.classList.remove("hidden");
}

function closeLinkEmbed() {
  els.linkEmbedModal?.classList.add("hidden");
  if (els.linkEmbedFrame) els.linkEmbedFrame.src = "about:blank";
}

function minimalPresence(profile) {
  return {
    clientId: profile.clientId,
    displayName: profile.displayName,
    avatar: profile.avatar,
    photoURL: profile.photoURL || null,
    color: profile.color,
    selectedNodeId: state.selectedId,
    lastSeen: Date.now()
  };
}

function getIdentityState() {
  if (state.authProvider === "google") {
    return {
      label: state.isAdmin ? "Google · admin" : "Google",
      detail: state.authEmail || "Compte Google connecté",
      connected: true
    };
  }
  if (state.realtimeStatus === "firebase") {
    return { label: "Anonyme", detail: "Identité anonyme connectée à Firebase", connected: true };
  }
  return { label: "Local", detail: "Identité enregistrée uniquement sur cet appareil", connected: false };
}

function avatarMarkup(profile, extraStyle = "") {
  const resolved = resolveAvatarProfile(profile);
  const color = resolved?.color || "#a7f3d0";
  const photoURL = resolveAvatarAssetURL(resolved?.photoURL);
  const fallback = escapeHtml(resolved?.avatar || "?");
  const image = photoURL
    ? `<span class="avatar-fallback">${fallback}</span><img src="${escapeHtml(photoURL)}" alt="" loading="lazy" decoding="async" draggable="false" referrerpolicy="no-referrer" onerror="this.remove()">`
    : fallback;
  return `<span class="avatar-chip${photoURL ? " has-photo" : ""}" style="background-color:${color};${extraStyle}">${image}</span>`;
}

function resolveAvatarProfile(profile) {
  const isCurrentUser = profile?.ownerId && profile.ownerId === state.authUid
    || profile?.actorId && profile.actorId === state.authUid
    || profile?.clientId && profile.clientId === state.profile.clientId;
  return isCurrentUser ? state.profile : profile;
}

function applyAvatarElement(element, profile) {
  if (!element) return;
  const photoURL = resolveAvatarAssetURL(profile?.photoURL);
  element.classList.toggle("has-photo", Boolean(photoURL));
  element.style.background = profile?.color || "#a7f3d0";
  element.replaceChildren();
  if (photoURL) {
    const image = document.createElement("img");
    image.src = photoURL;
    image.alt = "";
    image.decoding = "async";
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => {
      element.classList.remove("has-photo");
      element.textContent = profile?.avatar || "?";
    }, { once: true });
    element.append(image);
  } else {
    element.textContent = profile?.avatar || "?";
  }
}

function resolveAvatarAssetURL(url) {
  return url || null;
}

function getProjectSessionKey(manifest = state.projectManifest) {
  return `${manifest?.id || state.datasetId || "local"}::${manifest?.version || "noversion"}`;
}

function getStoredLayouts() {
  return loadJson(GRAPH_LAYOUT_KEY, {});
}

function restoreGraphLayout() {
  const layout = getStoredLayouts()[getProjectSessionKey()] || {};
  for (const node of state.graph.nodes) {
    const position = layout[node.id];
    if (!position) continue;
    node.x = Number(position.x);
    node.y = Number(position.y);
    node.z = Number(position.z);
    node.fx = node.x;
    node.fy = node.y;
    node.fz = node.z;
  }
}

function persistNodePosition(node) {
  if (!node?.id || node.type === "contribution") return;
  const layouts = getStoredLayouts();
  const key = getProjectSessionKey();
  layouts[key] ||= {};
  layouts[key][node.id] = { x: node.x, y: node.y, z: node.z };
  localStorage.setItem(GRAPH_LAYOUT_KEY, JSON.stringify(layouts));
}

function applyNodePosition(node) {
  if (!node?.id) return;
  const source = state.graph.nodes.find((item) => item.id === node.id);
  if (!source || source === node) return;
  source.x = node.x;
  source.y = node.y;
  source.z = node.z;
  source.fx = node.fx;
  source.fy = node.fy;
  source.fz = node.fz;
}

function clearPersistedLayout() {
  const layouts = getStoredLayouts();
  delete layouts[getProjectSessionKey()];
  localStorage.setItem(GRAPH_LAYOUT_KEY, JSON.stringify(layouts));
}

function releaseGraphLayout() {
  for (const node of state.graph.nodes) {
    node.fx = undefined;
    node.fy = undefined;
    node.fz = undefined;
  }
}

function resetGraphInteractionState() {
  state.selectedId = null;
  state.selectedLinkKey = null;
  state.hoveredLinkKey = null;
  state.focusSuppressed = false;
  state.selectedLinkPathIds = new Set();
  state.selectedLinkPathLinkKeys = new Set();
  state.selectedPathIds = new Set();
  state.selectedPathLinkKeys = new Set();
  state.highlightedCommentId = null;
}

function saveSession() {
  const snapshot = {
    projectId: state.projectManifest?.id || state.datasetId,
    projectVersion: state.projectManifest?.version || null,
    projectManifestUrl: state.projectManifestUrl,
    manifest: state.projectManifest,
    files: [...state.files.values()]
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
  const sessions = loadJson(PROJECT_SESSIONS_KEY, {});
  sessions[getProjectSessionKey(state.projectManifest)] = snapshot;
  localStorage.setItem(PROJECT_SESSIONS_KEY, JSON.stringify(sessions));
}

function persistComments() {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(state.comments));
}

function persistEntityReactions() {
  localStorage.setItem(ENTITY_REACTIONS_KEY, JSON.stringify(state.entityReactions));
}

function groupCommentsByEntity(comments) {
  return comments.reduce((groups, comment) => {
    if (!comment?.entityId || !comment?.id) return groups;
    groups[comment.entityId] ||= [];
    groups[comment.entityId].push(comment);
    return groups;
  }, {});
}

function getAllComments() {
  return Object.values(state.comments).flat();
}

function findComment(commentId) {
  return getAllComments().find((comment) => comment.id === commentId);
}

function isComposerActive() {
  return ["comment-input", "reply-input"].includes(document.activeElement?.id);
}

function draftKey(entityId, parentId) {
  return `${entityId}::${parentId || "root"}`;
}

function getDraft(entityId, parentId) {
  return state.drafts[draftKey(entityId, parentId)] || "";
}

function saveDraft(entityId, parentId, value) {
  const key = draftKey(entityId, parentId);
  if (value) state.drafts[key] = value;
  else delete state.drafts[key];
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(state.drafts));
}

function clearDraft(entityId, parentId) {
  saveDraft(entityId, parentId, "");
}

function persistActivityRead() {
  localStorage.setItem(ACTIVITY_READ_KEY, JSON.stringify([...state.activityRead]));
}

function setupRelativeTimes() {
  window.setInterval(updateRelativeTimes, 30000);
}

function updateRelativeTimes(root = document) {
  root.querySelectorAll("[data-relative-time]").forEach((element) => {
    element.textContent = formatRelativeTime(Number(element.dataset.relativeTime));
  });
}

function relativeTimeMarkup(timestamp, tag = "span") {
  if (!timestamp) return "";
  const absolute = new Date(timestamp).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  });
  return `<${tag} class="social-time" data-relative-time="${Number(timestamp)}" title="${escapeHtml(absolute)}">${escapeHtml(formatRelativeTime(timestamp))}</${tag}>`;
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return "";
  if (window.dayjs) {
    const value = window.dayjs(timestamp).fromNow();
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  const seconds = Math.round((Number(timestamp) - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
  const ranges = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60]
  ];
  const [unit, divisor] = ranges.find(([, value]) => Math.abs(seconds) >= value) || ["second", 1];
  const value = formatter.format(Math.round(seconds / divisor), unit);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function showToast(message) {
  if (!els.toast) return;
  els.toast.innerHTML = `
    <div class="toast-content">
      <i aria-hidden="true">notifications</i>
      <span>${escapeHtml(message)}</span>
      <button class="toast-close" type="button" aria-label="Fermer la notification"><i>close</i></button>
    </div>
    <span class="toast-progress" aria-hidden="true"></span>
  `;
  els.toast.classList.remove("hidden");
  els.toast.querySelector(".toast-close")?.addEventListener("click", hideToast, { once: true });
  els.toast.querySelector(".toast-progress")?.addEventListener("animationend", hideToast, { once: true });
  clearTimeout(state.toastTimer);
}

function hideToast() {
  clearTimeout(state.toastTimer);
  els.toast?.classList.add("hidden");
}
