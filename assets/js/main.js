import {
  CONTRIBUTION_FILTER,
  DEFAULT_PROJECT_MANIFEST_URL,
  FALLBACK_MODEL_SCHEMA as DEFAULT_MODEL_SCHEMA,
  HIDDEN_NODE_TYPES,
  KNOWN_PROJECT_MANIFESTS,
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
  applySchemaFieldInput,
  applySchemaTypeInput,
  bumpPatchVersion,
  addSchemaField as addSchemaFieldValue,
  createSchemaField,
  createSchemaType,
  fieldKindLabel,
  getSchemaCompatibilityReport as getSchemaCompatibilityReportValue,
  getSchemaEntityCount as getSchemaEntityCountValue,
  getSelectedSchemaField as getSelectedSchemaFieldValue,
  getSelectedSchemaType,
  mergeModelSchemas,
  normalizeModelSchema,
  parseSchemaFieldValues,
  removeSchemaField,
  removeSchemaType,
  reorderSchemaTypes as reorderSchemaTypesValue,
  safeSchemaId,
  validateModelSchema
} from "./model/schema.js";
import { computeCameraFitForNodes } from "./graph/camera-model.js";
import {
  buildVisibleGraph,
  getSelectedLinkPath as getSelectedLinkPathModel,
  getSelectedNodePath as getSelectedNodePathModel,
  getSelectedPathIds as getSelectedPathIdsModel
} from "./graph/focus-model.js";
import {
  getLinkDistance as getLinkDistanceValue,
  getLinkKey as getLinkKeyValue,
  getLinkTargetColor as getLinkTargetColorValue,
  getScoreBoost
} from "./graph/link-model.js";
import { createNodeRenderer } from "./graph/node-renderer.js";
import {
  getExportFiles,
  getFileExtension,
  getImageExtensionFromBlob as getImageExtensionFromBlobValue,
  serializeEntity,
  updateMarkdownFileFromEntity
} from "./services/export-model.js";
import {
  getIdentityState as getIdentityStateValue,
  minimalPresence as minimalPresenceValue,
  resolveAvatarProfile as resolveAvatarProfileValue
} from "./services/identity-model.js";
import {
  createProjectNavigationHref,
  createImportedFilesPlan,
  createRemoteSingleFileManifest as createRemoteSingleFileManifestValue,
  createRemoteResourceHref,
  createRecentProjectList,
  createSelectionDeepLinkUrl,
  ensureUniqueMoodleNamespace as ensureUniqueMoodleNamespaceValue,
  getInitialDeepLinkRequest,
  getLaunchRequestFromSearch,
  getRemoteFileName as getRemoteFileNameValue,
  mergeProjectManifestWithMoodlePack as mergeProjectManifestWithMoodlePackValue,
  resolveProjectRestore,
  sameProjectUrl as sameProjectUrlValue
} from "./services/project-launch.js";
import { createRealtimeProviders } from "./services/realtime.js";
import {
  applyNodePositionToSource,
  applyStoredGraphLayout,
  clearGraphNodePosition,
  createSessionSnapshot,
  draftKey,
  getProjectSessionKey as getProjectSessionKeyValue,
  groupCommentsByEntity,
  persistGraphNodePosition,
  syncGraphPositionsFromVisible
} from "./services/session-model.js";
import { createMarkdownRenderer } from "./ui/markdown.js";
import {
  renderActivityItem as renderActivityItemView,
  renderTrashItem
} from "./ui/activity-view.js";
import {
  htmlToMarkdown,
  looksLikeHtml,
  markdownToEditableHtml
} from "./ui/content-format.js";
import {
  applyEditorSyntaxHighlighting,
  createEditFormValues,
  getEditedBodyAndFormatValue,
  normalizeSummaryStyle,
  renderEditFormView,
  renderSummaryCallout,
  resetEditorScrollPositions,
  setGraphImageOptionEnabled,
  setGraphImageValue,
  setSummaryOptionEnabled,
  setSummaryStyleSelection,
  summaryStyleLabel
} from "./ui/editor-view.js";
import {
  getEntityRenderFormat,
  getVisibleEntitySummary,
  renderEntityReadView,
  renderInlineRelations
} from "./ui/entity-view.js";
import {
  computeGraphQualityMetrics,
  formatCompactNumber,
  formatGraphNumber
} from "./ui/graph-quality-model.js";
import {
  renderGraphOptionsView,
  renderQuickTypeFiltersView
} from "./ui/graph-options-view.js";
import { renderGraphQualityCard as renderGraphQualityCardView } from "./ui/graph-quality-view.js";
import {
  formatManifestDate,
  getBreadcrumbEntities,
  getEntityMetadataEntries
} from "./ui/insight-model.js";
import {
  renderOverviewDetailsView,
  renderOverviewEditView
} from "./ui/overview-view.js";
import {
  emojiToId,
  getCommentReactions as getCommentReactionsView,
  getEntityReactions as getEntityReactionsView,
  reactionEmojiMarkup,
  renderEntityReactionBlock
} from "./ui/reactions-view.js";
import {
  formatRelativeTime as formatRelativeTimeView,
  relativeTimeMarkup as relativeTimeMarkupView
} from "./ui/relative-time-view.js";
import {
  buildSearchDocuments,
  fallbackSearchDocuments,
  getSearchExcerpt,
  renderSearchResultsView
} from "./ui/search-view.js";
import {
  getGamificationViewModel,
  renderGamificationCard as renderGamificationCardView
} from "./ui/gamification-view.js";
import {
  decorateSmartLinks,
  renderLinkPreview,
  renderSmartText
} from "./ui/smart-link-view.js";
import {
  renderSchemaFieldsView,
  renderSchemaTransferView,
  renderSchemaTypesView
} from "./ui/schema-view.js";
import {
  applyAvatarElement,
  avatarMarkup as avatarMarkupView,
  renderProfileIdentity as renderProfileIdentityView,
  resolveAvatarAssetURL
} from "./ui/profile-view.js";
import { renderPresenceChips as renderPresenceChipsView } from "./ui/presence-view.js";
import {
  getTypePresentation,
  renderTypeDistributionChart as renderTypeDistributionChartView
} from "./ui/type-distribution-chart.js";
import { renderToast } from "./ui/toast-view.js";
import { bootstrapProspectre } from "./app/bootstrap.js";
import { PanelManager } from "./panels/panel-manager.js";
import {
  createGraphToolbarController,
  GRAPH_TOOLBAR_PREFS_KEY,
  normalizeGraphToolbarPrefs
} from "./ui/graph-toolbar.js";
import {
  createDiscussionRenderer,
  createNativeEmojiPickerController,
  QUICK_REACTIONS
} from "./controllers/comments-controller.js";
import { createGraphController } from "./controllers/graph-controller.js";
import {
  destroyEditorState,
  getEntityEditSignature,
  getEntityEditorFormat,
  getEditorModeViewState,
  getInitialEditorMode,
  getNextEditorState,
  isEditorBodyDirty,
  markEditorSurfaceDirty,
  normalizeEditorFormat,
  normalizeEditorMode,
  scheduleEditorAutosave
} from "./controllers/editor-controller.js";
import { overlays } from "./ui/overlay-manager.js";
import { confirmAction, requestChoice } from "./ui/confirm-dialog.js";
import { ensureMoodleHtmlSupport, isMoodleHtmlEntity } from "./ui/moodle-bootstrap.js";
import {
  convertMoodleCompetencyCsv,
  isLikelyMoodleCompetencyCsv
} from "./import/moodle-competency-csv.js";

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
  graphHelpToggle: document.querySelector("#graph-help-toggle"),
  graphHelpPopover: document.querySelector("#graph-help-popover"),
  graphToolbar: document.querySelector(".graph-toolbar"),
  openGraphWindow: document.querySelector("#open-graph-window"),
  fullscreenGraph: document.querySelector("#fullscreen-graph"),
  insightsToggle: document.querySelector("#insights-toggle"),
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
  profileOptionsTabs: document.querySelector(".profile-options-tabs"),
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
  panelManager: null,
  graphController: null,
  appStore: null,
  windowBridge: null,
  externalWindow: null,
  providerVersion: 0,
  datasetId: "local",
  realtimeStatus: "local",
  authUid: null,
  authEmail: null,
  authProvider: "local",
  isAdmin: false,
  availableProjectManifests: null,
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
state.editAutosaveTimer = null;
state.schemaDraggedType = null;
state.schemaDragArmedType = null;
state.emojiPickerTarget = null;
state.discussionRenderer = createDiscussionRenderer({
  getState: () => state,
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
  overviewPrefix: OVERVIEW_CONTEXT_PREFIX
});

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
  resolveGraphImage,
  renderContentWithEntityLinks,
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
  resolveGraphImage,
  resolveAvatarProfile,
  getScoreBoost
});

init();

async function init() {
  if (!window.ForceGraph3D || !window.JSZip || !window.jsyaml || !window.marked || !window.DOMPurify || !window.Papa) {
    showToast("Chargement incomplet. Vérifiez la connexion.");
    return;
  }
  bootstrapV3Runtime();
  applyTheme(loadJson(THEME_KEY, "system"));
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    if (loadJson(THEME_KEY, "system") === "system") applyTheme("system");
  });
  setupControls();
  setupGamification();
  setupGlobalTooltips();
  setupRelativeTimes();
  setupGraph();
  setupPanelManager();
  setupGraphController();
  const projectDiscovery = discoverAvailableProjectManifests();
  await loadDefaultProject();
  await projectDiscovery;
  applyInitialDeepLink();
  await setupPresence();
  const adminView = new URLSearchParams(window.location.search).get("admin");
  if (["modele", "champs", "transfert"].includes(adminView)) {
    openSchemaAdmin(adminView === "champs" ? "fields" : adminView === "transfert" ? "transfer" : "types");
  }
}

function bootstrapV3Runtime() {
  const runtime = bootstrapProspectre({
    state,
    theme: loadJson(THEME_KEY, "system"),
    onBridgeMessage: handleBridgeMessage
  });
  state.appStore = runtime.store;
  state.windowBridge = runtime.bridge;
  state.externalWindow = runtime.externalWindow;
}

function handleBridgeMessage(message) {
  const { type, payload } = message;
  if (type === "selection:set" && payload?.id && state.entities.has(payload.id)) {
    if (state.selectedId === payload.id) return;
    state.bridgeApplying = true;
    selectNode(payload.id, Boolean(payload.moveCamera));
    state.bridgeApplying = false;
  }
  if (type === "theme:set" && payload?.theme) {
    applyTheme(payload.theme, { broadcast: false });
  }
  if (type === "graph:fit") {
    fitVisibleGraph();
  }
  if (type === "state:request") {
    state.windowBridge?.publish("state:hydrate", state.windowBridge.getState());
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
  els.mobileMenuToggle?.addEventListener("click", toggleMobileMenu);
  els.filterMenuToggle?.addEventListener("click", toggleFilterMenu);
  els.mobileMenu?.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button && !button.hasAttribute("data-expand-presence")) closeMobileMenu();
  });
  document.addEventListener("pointerdown", (event) => {
    if (els.topbar?.classList.contains("menu-open") && !els.topbar.contains(event.target)) closeMobileMenu();
    if (els.projectSwitcherMenu && !event.target.closest(".project-switcher-wrap")) closeProjectMenu();
    if (els.graphSearchPopover && !event.target.closest("#graph-search-popover") && !event.target.closest("#graph-search-toggle")) closeGraphSearch();
    if (els.typeFilters && !event.target.closest("#type-filters") && !event.target.closest("#filter-menu-toggle")) closeFilterMenu();
    if (els.graphHelpPopover && !event.target.closest("#graph-help-popover") && !event.target.closest("#graph-help-toggle")) closeGraphHelp();
    if (!event.target.closest("#emoji-picker-popover") && !event.target.closest("[data-reaction-picker]")) closeEmojiPicker();
    if (!event.target.closest("#link-preview-popover") && !event.target.closest("[data-smart-link]")) closeLinkPreview();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
      closeProjectMenu();
      closeGraphSearch();
      closeFilterMenu();
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
  els.graphHelpToggle?.addEventListener("click", toggleGraphHelp);
  setupGraphToolbar();
  document.querySelector("#fit-view").addEventListener("click", () => state.graphController?.fit?.() || fitVisibleGraph());
  document.querySelector("#zoom-in").addEventListener("click", () => zoomCamera(0.78));
  document.querySelector("#zoom-out").addEventListener("click", () => zoomCamera(1.22));
  els.insightsToggle?.addEventListener("click", toggleInsightsPanel);
  els.openGraphWindow?.addEventListener("click", () => state.graphController?.externalize?.() || openGraphExternalWindow());
  els.fullscreenGraph?.addEventListener("click", () => state.graphController?.fullscreen?.() || toggleGraphFullscreen());
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
  document.addEventListener("click", handleWidgetExternalAction);
  els.profileOptionsTabs?.addEventListener("click", handleProfileTabClick);
  document.addEventListener("load", handleRichImageLoad, true);
  document.addEventListener("error", handleRichImageError, true);
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
  setupNativeEmojiPicker();
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
    showToast(`Merci pour ces ${HEART_CYCLE_SECONDS}s d’attention 🫶 \n❤️➕${payload.points}`);
    state.gamification.cycle = createEmptyHeartCycle();
  } catch (error) {
    if (error?.partial) {
      showToast("💓 partiellement synchronisés · correction au prochain cycle");
    } else {
      showToast("💓 non synchronisés · vérifiez la synchronisation des cycles");
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
    closeGraphHelp();
  }
  els.typeFilters?.classList.toggle("hidden", !open);
  els.filterMenuToggle?.setAttribute("aria-expanded", String(open));
  syncToolbarActiveStates();
  if (open) requestAnimationFrame(() => positionToolbarPopover(els.typeFilters, els.filterMenuToggle));
}

function closeFilterMenu() {
  els.typeFilters?.classList.add("hidden");
  els.filterMenuToggle?.setAttribute("aria-expanded", "false");
  syncToolbarActiveStates();
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
  const knownProjects = state.availableProjectManifests
    || KNOWN_PROJECT_MANIFESTS.filter((entry) => sameProjectUrl(entry.url, DEFAULT_PROJECT_MANIFEST_URL));
  const projects = [
    ...knownProjects,
    ...recent.filter((item) => !knownProjects.some((known) => known.id === item.id))
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

function setupPanelManager() {
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
    onLayoutChange: syncAdaptivePanelLayout
  });
  state.panelManager.register({
    id: "context",
    title: "Aucun élément sélectionné",
    icon: "panel",
    defaultPrefs: { mode: "dock", edge: "right", size: 430, width: 430, x: 96, y: 92, height: 620 },
    render: renderContextPanelBody,
    canExternalize: true,
    onClose: closeContextPanelState
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
    onClose: closeProfileState
  });
  state.panelManager.register({
    id: "activity",
    title: "Fil d’activité",
    icon: "activity",
    defaultPrefs: { mode: "dock", edge: "right", size: 460, width: 460, x: 136, y: 118, height: 650 },
    className: "adaptive-panel--activity",
    render: renderActivityPanelBody,
    canExternalize: true,
    onClose: closeActivityPanelState
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
  if (state.externalWindow?.kind === "panel") {
    state.panelManager.open(state.externalWindow.panelId || "insights");
  } else if (state.externalWindow?.kind !== "graph") {
    state.panelManager.open("insights");
  }
  syncAdaptivePanelLayout(state.panelManager.getLayout());
  syncToolbarActiveStates();
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
  const breadcrumb = document.querySelector("#insight-breadcrumb");
  const titleSlot = panel?.querySelector("[data-panel-title-slot='insights']");
  if (breadcrumb && titleSlot && breadcrumb.parentElement !== titleSlot) {
    titleSlot.append(breadcrumb);
  }
  if (!state.insightsPanelBody) {
    state.insightsPanelBody = document.createElement("div");
    state.insightsPanelBody.className = "adaptive-panel__insights";
    const drawerBody = document.createElement("div");
    drawerBody.className = "drawer-body";
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
  renderProfileControls();
  if (els.realtimeSwitch) els.realtimeSwitch.checked = state.realtimeStatus === "firebase";
  return state.profilePanelBody;
}

function renderActivityPanelBody() {
  if (!state.activityPanelBody) {
    state.activityPanelBody = document.createElement("div");
    state.activityPanelBody.className = "adaptive-panel__activity";
    [document.querySelector("#activity-tabs"), els.activityContent].filter(Boolean).forEach((element) => state.activityPanelBody.append(element));
  }
  renderActivityPanel();
  return state.activityPanelBody;
}

function renderGamificationPanelBody() {
  if (!state.gamificationPanelBody) {
    state.gamificationPanelBody = document.createElement("div");
    state.gamificationPanelBody.className = "adaptive-panel__gamification";
    if (els.gamificationCard) state.gamificationPanelBody.append(els.gamificationCard);
  }
  renderGamificationCard();
  return state.gamificationPanelBody;
}

function syncAdaptivePanelLayout(layout = state.panelManager?.getLayout?.() || {}) {
  const app = document.querySelector("#app");
  if (!app) return;
  app.style.setProperty("--graph-left", "0px");
  app.style.setProperty("--graph-top-offset", "0px");
  app.style.setProperty("--graph-right", "0px");
  app.style.setProperty("--graph-bottom", "0px");
  app.classList.toggle("has-adaptive-panels", Object.values(layout).some((panel) => panel?.open));
  app.classList.remove("right-open", "drawer-open", "drawer-collapsed");
  syncToolbarActiveStates(layout);
  positionOpenToolbarPopover();
}

function toggleInsightsPanel() {
  const open = Boolean(state.panelManager?.getLayout?.().insights?.open);
  if (open) state.panelManager?.close("insights");
  else state.panelManager?.open("insights");
  syncToolbarActiveStates();
}

function syncToolbarActiveStates(layout = state.panelManager?.getLayout?.() || {}) {
  setToolActive(els.insightsToggle, Boolean(layout.insights?.open));
  setToolActive(els.filterMenuToggle, !els.typeFilters?.classList.contains("hidden"));
  setToolActive(els.graphSearchToggle, !els.graphSearchPopover?.classList.contains("hidden"));
  setToolActive(els.graphHelpToggle, !els.graphHelpPopover?.classList.contains("hidden"));
}

function setToolActive(button, active) {
  if (!button) return;
  button.classList.toggle("is-active", Boolean(active));
  button.setAttribute("aria-pressed", active ? "true" : "false");
}

function setupGraphToolbar() {
  const toolbar = els.graphToolbar;
  if (!toolbar) return;
  state.graphToolbarController = createGraphToolbarController({
    toolbar,
    storageKey: GRAPH_TOOLBAR_PREFS_KEY,
    onChange: positionOpenToolbarPopover
  });
  state.graphToolbarController.mount();
}

function setupGraphController() {
  state.graphController = createGraphController({
    resetView,
    fitVisibleGraph,
    scheduleGraphResize,
    openExternal: openGraphExternalWindow,
    requestFullscreen: toggleGraphFullscreen,
    panelManager: state.panelManager
  });
  state.graphController.mount();
}

function applyGraphToolbarPrefs(prefs) {
  state.graphToolbarController?.apply(normalizeGraphToolbarPrefs(prefs));
}

function openGraphExternalWindow() {
  state.windowBridge?.openExternal({ kind: "graph", title: "PROSPECTRE — Graphe" });
  showToast("Graphe ouvert en fenêtre externe");
}

async function toggleGraphFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await (els.graphStage || document.documentElement).requestFullscreen();
    setTimeout(() => fitVisibleGraph(), 120);
  } catch {
    showToast("Plein écran indisponible");
  }
}

function openContextPanel() {
  state.panelManager?.open("context");
}

function closeContextPanelState() {
  document.querySelector("#app")?.classList.remove("right-open");
  state.selectedId = null;
  state.highlightedCommentId = null;
  state.provider?.updatePresence({ selectedNodeId: null });
  renderAnalysis();
  updateVisibleGraph();
  updateDeepLink(null);
  scheduleGraphResize();
}

function sameProjectUrl(a, b) {
  return sameProjectUrlValue(a, b, window.location.href);
}

function updateProjectUrl(manifestUrl) {
  window.history.replaceState(null, "", createProjectNavigationHref(window.location.href, manifestUrl, {
    defaultManifestUrl: DEFAULT_PROJECT_MANIFEST_URL
  }));
}

function registerRecentProject(manifest) {
  const recent = loadJson(RECENT_PROJECTS_KEY, []);
  localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(createRecentProjectList(recent, manifest)));
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
  state.graphView.onNodeRightClick?.((node) => releaseNodeFreeformPosition(node));
  state.graphView.d3Force("charge").strength(-105);
  state.graphView.d3Force("link").distance((link) => getLinkDistance(link));
  state.graphView.d3AlphaDecay?.(0.055);
  state.graphView.d3VelocityDecay?.(0.46);
  window.addEventListener("resize", resizeGraph);
  els.graphStage.addEventListener("contextmenu", (event) => event.preventDefault());
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
  const requested = getUrlLaunchRequest();
  try {
    if (requested.kind === "project") {
      await loadProject(requested.value, { updateUrl: false });
      return;
    }
    if (requested.kind === "resource") {
      await loadRemoteResource(requested.value, { updateUrl: false });
      return;
    }
    await loadProject(DEFAULT_PROJECT_MANIFEST_URL, { updateUrl: false });
  } catch (error) {
    if (requested.kind === "default") throw error;
    console.warn("Ressource demandée indisponible, retour au projet par défaut.", error);
    showToast("Ressource demandée indisponible · retour au projet par défaut");
    await loadProject(DEFAULT_PROJECT_MANIFEST_URL, { updateUrl: true });
  }
}

function getUrlLaunchRequest() {
  return getLaunchRequestFromSearch(window.location.search, {
    defaultManifestUrl: DEFAULT_PROJECT_MANIFEST_URL,
    knownManifests: KNOWN_PROJECT_MANIFESTS
  });
}

async function discoverAvailableProjectManifests() {
  const discovered = await Promise.all(KNOWN_PROJECT_MANIFESTS.map(async (entry) => {
    if (!entry.url) return null;
    try {
      const response = await fetch(entry.url, { cache: "no-store" });
      if (!response.ok) return null;
      const manifest = await response.json();
      return {
        ...entry,
        id: manifest.id || entry.id,
        title: manifest.titre || entry.title,
        version: manifest.version || entry.version || "",
        description: manifest.description || entry.description || ""
      };
    } catch (error) {
      console.info(`Pack local absent ou indisponible: ${entry.url}`, error);
      return null;
    }
  }));
  state.availableProjectManifests = discovered.filter(Boolean);
  renderProjectSwitcher();
  return state.availableProjectManifests;
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
  const restore = resolveProjectRestore(manifest, canonicalFiles, saved);
  state.projectManifest = restore.manifest;
  if (options.updateUrl !== false) updateProjectUrl(manifestUrl);
  loadFiles(restore.files, restore.message, { resetFilters: true });
  state.appStore?.dispatch({
    type: "state:patch",
    scope: "project",
    patch: {
      project: {
        manifest: state.projectManifest,
        manifestUrl,
        datasetId: state.datasetId,
        restored: restore.restored
      }
    }
  });
  state.windowBridge?.publish("project:loaded", {
    manifest: state.projectManifest,
    manifestUrl,
    datasetId: state.datasetId
  });
}

async function loadRemoteResource(resourceUrl, options = {}) {
  const absoluteUrl = new URL(resourceUrl, window.location.href).href;
  const fileName = getRemoteFileName(absoluteUrl);
  const extension = getFileExtension(fileName);
  showToast(`Chargement distant… ${shortLabel(fileName || absoluteUrl, 42)}`);
  if (extension === "json" || /manifest\.json(?:$|[?#])/i.test(absoluteUrl)) {
    await loadProject(absoluteUrl, options);
    return;
  }
  const response = await fetch(absoluteUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`Ressource distante indisponible (${response.status})`);
  if (extension === "zip") {
    const files = await extractZipEntries(await JSZip.loadAsync(await response.blob()));
    await loadRemoteImportedFiles(files, {
      title: fileName.replace(/\.zip$/i, "") || "Pack distant",
      sourceUrl: absoluteUrl,
      updateUrl: options.updateUrl
    });
    return;
  }
  if (extension === "csv") {
    const text = await response.text();
    if (!isLikelyMoodleCompetencyCsv(text)) throw new Error("CSV distant non reconnu comme référentiel Moodle.");
    const pack = convertMoodleCompetencyCsv(text, { fileName });
    await loadRemoteMoodlePack(pack, { sourceUrl: absoluteUrl, updateUrl: options.updateUrl });
    return;
  }
  if (extension === "md") {
    await loadRemoteImportedFiles([{ path: fileName || "fiche.md", text: await response.text() }], {
      title: fileName.replace(/\.md$/i, "") || "Fiche distante",
      sourceUrl: absoluteUrl,
      updateUrl: options.updateUrl
    });
    return;
  }
  throw new Error(`Type de ressource distante non pris en charge : ${extension || "inconnu"}`);
}

async function loadRemoteMoodlePack(pack, options = {}) {
  beginProjectSwitch(options.sourceUrl || pack.manifest.id);
  state.projectManifest = {
    ...pack.manifest,
    source: {
      ...(pack.manifest.source || {}),
      url: options.sourceUrl || pack.manifest.source?.url || ""
    }
  };
  state.projectManifestUrl = options.sourceUrl || "";
  registerRecentProject(state.projectManifest);
  if (options.updateUrl !== false) updateRemoteResourceUrl(options.sourceUrl);
  loadFiles(pack.files, "Référentiel Moodle distant chargé", { resetFilters: true });
  if (state.realtimeStatus === "firebase") await reconnectRealtimeForDataset();
}

async function loadRemoteImportedFiles(files, options = {}) {
  const importedManifestFile = files.find((file) => file.path.toLowerCase() === "manifest.json");
  const importedManifest = importedManifestFile ? parseJson(importedManifestFile.text) : null;
  const manifest = importedManifest || createRemoteSingleFileManifest(files, options);
  beginProjectSwitch(options.sourceUrl || manifest.id);
  state.projectManifest = {
    ...manifest,
    source: {
      ...(manifest.source || {}),
      url: options.sourceUrl || manifest.source?.url || ""
    }
  };
  state.projectManifestUrl = options.sourceUrl || "";
  registerRecentProject(state.projectManifest);
  if (options.updateUrl !== false) updateRemoteResourceUrl(options.sourceUrl);
  loadFiles(files, importedManifest ? "Pack distant chargé" : "Fiche distante chargée", { resetFilters: true });
  if (state.realtimeStatus === "firebase") await reconnectRealtimeForDataset();
}

function createRemoteSingleFileManifest(files, options = {}) {
  return createRemoteSingleFileManifestValue(files, {
    ...options,
    safeFileName,
    defaultModelSchema: DEFAULT_MODEL_SCHEMA
  });
}

function updateRemoteResourceUrl(resourceUrl) {
  const href = createRemoteResourceHref(window.location.href, resourceUrl);
  if (href) window.history.replaceState(null, "", href);
}

function getRemoteFileName(resourceUrl) {
  return getRemoteFileNameValue(resourceUrl, window.location.href);
}

function beginProjectSwitch(manifestUrl) {
  closeProjectMenu();
  closeGraphSearch();
  closeFilterMenu();
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
    } else if (file.name.toLowerCase().endsWith(".csv")) {
      if (await importMoodleCsvFile(file)) return;
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
  const importPlan = createImportedFilesPlan(imported, [...state.files.values()], state.projectManifest, parseJson);
  const { importedManifest, conflicts } = importPlan;
  const { baseFiles, replacesProject } = importPlan;
  if (replacesProject) {
    const replace = await confirmAction({
      title: "Charger un autre projet",
      message: `Le pack « ${importedManifest.titre || importedManifest.id} » ne correspond pas au projet actif.`,
      details: "Le projet courant sera remplacé par le contenu importé.",
      anchor: els.dropOverlay?.querySelector(".drop-card"),
      confirmLabel: "Remplacer",
      confirmIcon: "sync",
      tone: "danger"
    });
    if (!replace) return;
    state.files.clear();
    state.projectManifest = importedManifest;
  } else if (importedManifest) {
    state.projectManifest = { ...state.projectManifest, ...importedManifest };
  }
  if (importedManifest?.id) registerRecentProject(importedManifest);
  if (conflicts.length) {
    const replaceConflicts = await confirmAction({
      title: "Fichiers déjà présents",
      message: `${conflicts.length} fichier${conflicts.length > 1 ? "s existent" : " existe"} déjà dans le projet.`,
      details: "Les versions importées remplaceront les fichiers portant le même chemin.",
      anchor: els.dropOverlay?.querySelector(".drop-card"),
      confirmLabel: "Remplacer",
      confirmIcon: "published_with_changes",
      tone: "danger"
    });
    if (!replaceConflicts) return;
  }
  loadFiles([...baseFiles, ...imported], importPlan.message, { resetFilters: replacesProject });
  if (state.realtimeStatus === "firebase") await reconnectRealtimeForDataset();
  els.dropOverlay.classList.add("hidden");
  els.packInput.value = "";
}

async function importMoodleCsvFile(file) {
  const text = await file.text();
  if (!isLikelyMoodleCompetencyCsv(text)) return false;
  let pack;
  try {
    pack = convertMoodleCompetencyCsv(text, { fileName: file.name });
  } catch (error) {
    showToast(error?.message || "CSV Moodle illisible");
    return true;
  }
  const mode = await requestChoice({
    title: "Référentiel Moodle détecté",
    message: `${pack.manifest.titre} · ${pack.stats.rows} éléments`,
    details: "Choisir comment intégrer ce référentiel dans PROSPECTRE.",
    anchor: els.dropOverlay?.querySelector(".drop-card"),
    choices: [
      { label: "Remplacer le projet", value: "replace", kind: "primary", icon: "sync" },
      { label: "Fusionner", value: "merge", kind: "secondary", icon: "merge_type" }
    ]
  });
  if (!mode) return true;
  const replace = mode === "replace";
  const finalPack = replace ? pack : ensureUniqueMoodleNamespace(text, file.name, pack);
  if (replace) {
    state.files.clear();
    state.projectManifest = finalPack.manifest;
    registerRecentProject(finalPack.manifest);
    loadFiles(finalPack.files, "Référentiel Moodle chargé", { resetFilters: true });
  } else {
    const importedFiles = finalPack.files
      .filter((item) => item.path !== "manifest.json")
      .map((item) => item.path === "README.md"
        ? { ...item, path: `moodle/${safeFileName(finalPack.stats.frameworkId || "referentiel")}/README.md` }
        : item);
    state.projectManifest = mergeProjectManifestWithMoodlePack(state.projectManifest, finalPack.manifest, importedFiles);
    loadFiles([...state.files.values(), ...importedFiles], "Référentiel Moodle ajouté", { resetFilters: false });
  }
  if (state.realtimeStatus === "firebase") await reconnectRealtimeForDataset();
  els.dropOverlay.classList.add("hidden");
  els.packInput.value = "";
  return true;
}

function ensureUniqueMoodleNamespace(text, fileName, pack) {
  return ensureUniqueMoodleNamespaceValue(text, fileName, pack, {
    entityIds: new Set([...state.entities.keys()]),
    parseMarkdownFile,
    convertMoodleCompetencyCsv
  });
}

function mergeProjectManifestWithMoodlePack(currentManifest, importedManifest, importedFiles) {
  return mergeProjectManifestWithMoodlePackValue(currentManifest, importedManifest, importedFiles, {
    currentModelSchema: state.modelSchema,
    defaultModelSchema: DEFAULT_MODEL_SCHEMA,
    mergeModelSchemas
  });
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
  state.visibleGraph = buildVisibleGraph({
    graph: state.graph,
    activeTypes: state.activeTypes,
    realtimeStatus: state.realtimeStatus,
    focusActive,
    selectedPathIds,
    selectedPathLinkKeys,
    selectedLinkKey: state.selectedLinkKey,
    selectedId: state.selectedId,
    selectedLinkPaths,
    hoveredLinkKey: state.hoveredLinkKey,
    getLinkKey
  });
  state.graphView.graphData(state.visibleGraph);
  softenGraphMotion();
  updateFocusDepthLabel();
  renderPresence();
  renderPresenceStrip();
  renderAnalysis();
  setTimeout(renderPresence, 300);
}

function syncGraphPositionsFromView() {
  syncGraphPositionsFromVisible(state.graph.nodes, state.visibleGraph?.nodes);
}

function getSelectedPathIds(selectedLinkPaths = getSelectedLinkPath(), selectedNodePaths = getSelectedNodePath()) {
  return getSelectedPathIdsModel({
    searchMatchedIds: state.searchMatchedIds,
    selectedLinkKey: state.selectedLinkKey,
    selectedId: state.selectedId,
    selectedLinkPaths,
    selectedNodePaths
  });
}

function getSelectedNodePath() {
  return getSelectedNodePathModel({
    selectedId: state.selectedId,
    links: state.graph.links,
    focusDepth: getFocusDepth(),
    getLinkKey
  });
}

function getSelectedLinkPath() {
  return getSelectedLinkPathModel({
    selectedLinkKey: state.selectedLinkKey,
    links: state.graph.links,
    entities: state.entities,
    focusDepth: getFocusDepth(),
    getLinkKey,
    maxLinks: LINK_FOCUS_MAX_LINKS
  });
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
  els.typeFilters.innerHTML = renderGraphOptionsView({
    entries,
    activeTypes: state.activeTypes,
    enabledCount,
    graphPrefs: state.graphPrefs,
    focusDepth: getFocusDepth(),
    focusSummary,
    focusDepthDisabled
  });
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
  els.typeFilters.querySelector("[data-reset-arm]")?.addEventListener("click", async () => {
    const confirmed = await confirmAction({
      title: "Réinitialiser la vue",
      message: "Réactiver les types, fermer les panneaux, vider la recherche et relancer le layout automatique.",
      details: "Le projet et les fichiers importés restent conservés.",
      tone: "danger",
      confirmLabel: "Réinitialiser",
      confirmIcon: "restart_alt"
    });
    if (!confirmed) return;
    closeFilterMenu();
    state.graphController?.reset?.({ resetPanels: true }) || resetView();
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
  els.quickTypeFilters.innerHTML = renderQuickTypeFiltersView(entries, state.activeTypes);
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
  openContextPanel();
  updateVisibleGraph();
  scheduleGraphResize();
  if (moveCamera) fitFocusedSelection(id);
  updateDeepLink();
  state.appStore?.dispatch({ type: "state:patch", scope: "selection", patch: { selection: { selectedId: id, selectedLinkKey: null, activeTab: state.activeTab } } });
  if (!state.bridgeApplying) state.windowBridge?.publish("selection:set", { id, moveCamera: false, activeTab: state.activeTab });
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
  openContextPanel();
  updateVisibleGraph();
  scheduleGraphResize();
  if (moveCamera) fitFocusedSelection(node.entityId || node.id);
  updateDeepLink(node.commentId);
  state.appStore?.dispatch({ type: "state:patch", scope: "selection", patch: { selection: { selectedId: node.entityId, selectedLinkKey: null, activeTab: state.activeTab, commentId: node.commentId } } });
  if (!state.bridgeApplying) state.windowBridge?.publish("selection:set", { id: node.entityId, moveCamera: false, activeTab: state.activeTab, commentId: node.commentId });
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
  state.appStore?.dispatch({ type: "state:patch", scope: "selection", patch: { selection: { selectedId: null, selectedLinkKey: state.selectedLinkKey, activeTab: state.activeTab } } });
}

function exitGraphFocus() {
  if (!state.graphPrefs.focusMode || state.focusSuppressed || (!state.selectedId && !state.selectedLinkKey && !state.searchMatchedIds?.size)) return;
  state.focusSuppressed = true;
  state.hoveredLinkKey = null;
  updateVisibleGraph();
  renderAnalysis();
}

function applyInitialDeepLink() {
  const request = getInitialDeepLinkRequest(window.location.search, state.entities);
  if (!request) return;
  state.activeTab = request.activeTab;
  state.highlightedCommentId = request.commentId;
  selectNode(request.entityId, false);
  state.highlightedCommentId = request.commentId;
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
  return createSelectionDeepLinkUrl(window.location.href, { entityId, tab, commentId });
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
  const kicker = TYPE_CONFIG[entity.type]?.singular || TYPE_LABELS[entity.type] || "Sélection";
  const badgeColor = TYPE_CONFIG[entity.type]?.color || "#7dd3fc";
  els.panelKicker.textContent = kicker;
  els.panelTitle.textContent = entity.label;
  state.panelManager?.update("context", { title: entity.label, badge: { label: kicker, color: badgeColor } });
  openContextPanel();
  if (state.activeTab === "overview") renderOverview(entity);
  if (state.activeTab === "discussion") renderDiscussion(entity);
}

function getOverviewDiscussionEntity() {
  const manifest = state.projectManifest || {};
  return {
    id: getOverviewContextId(),
    type: "overview",
    label: manifest.titre || manifest.id || "Vue d’ensemble",
    summary: manifest.description || ""
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
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === "discussion"));
  const entity = getOverviewDiscussionEntity();
  els.panelKicker.textContent = "Vue d’ensemble";
  els.panelTitle.textContent = entity.label;
  state.panelManager?.update("context", { title: entity.label, badge: { label: "Vue d’ensemble", color: "var(--accent)" } });
  openContextPanel();
  renderDiscussion(entity);
  updateDeepLink();
  scheduleGraphResize();
}

function renderOverviewMetaDetails() {
  destroyContentEditor();
  const manifest = state.projectManifest || {};
  if (state.editMode) {
    renderOverviewEditForm();
    return;
  }
  const generatedAt = formatManifestDate(manifest.date_generation);
  const fileCount = Array.isArray(manifest.fichiers) ? manifest.fichiers.length : state.files.size;
  els.panelContent.innerHTML = renderOverviewDetailsView({
    manifest,
    datasetId: state.datasetId,
    generatedAt,
    fileCount
  });
  els.panelContent.querySelector("#overview-edit-toggle")?.addEventListener("change", (event) => {
    state.editMode = event.target.checked;
    renderOverviewMetaDetails();
  });
}

function renderOverviewEditForm() {
  const manifest = state.projectManifest || {};
  const generatedAt = formatManifestDate(manifest.date_generation);
  const fileCount = Array.isArray(manifest.fichiers) ? manifest.fichiers.length : state.files.size;
  els.panelContent.innerHTML = renderOverviewEditView({
    manifest,
    datasetId: state.datasetId,
    generatedAt,
    fileCount
  });
  els.panelContent.querySelector("#overview-edit-toggle")?.addEventListener("change", (event) => {
    state.editMode = event.target.checked;
    renderOverviewMetaDetails();
  });
  els.panelContent.querySelector("#overview-description-toggle")?.addEventListener("change", (event) => {
    const enabled = event.target.checked;
    const card = event.target.closest(".edit-option-card");
    const description = els.panelContent.querySelector("#overview-description");
    card?.classList.toggle("is-enabled", enabled);
    if (description) {
      description.disabled = !enabled;
      if (enabled) description.focus();
    }
  });
  els.panelContent.querySelector("#apply-overview-adjust")?.addEventListener("click", () => {
    const title = els.panelContent.querySelector("#overview-title")?.value.trim();
    const descriptionEnabled = Boolean(els.panelContent.querySelector("#overview-description-toggle")?.checked);
    const description = descriptionEnabled ? els.panelContent.querySelector("#overview-description")?.value.trim() || "" : "";
    state.projectManifest ||= {};
    if (title) state.projectManifest.titre = title;
    if (description) state.projectManifest.description = description;
    else delete state.projectManifest.description;
    updateManifestFile();
    saveSession();
    renderProjectSwitcher();
    renderAnalysis();
    state.editMode = false;
    renderOverviewMetaDetails();
    showToast("Détails du projet enregistrés");
  });
  els.panelContent.querySelector("#cancel-overview-adjust")?.addEventListener("click", () => {
    state.editMode = false;
    renderOverviewMetaDetails();
  });
}

function renderOverview(entity) {
  destroyContentEditor();
  const renderFormat = getEntityRenderFormat(entity);
  if (renderFormat === "html" && isMoodleHtmlEntity(entity)) ensureMoodleHtmlSupport();
  if (state.editMode) {
    renderEditForm(entity);
    return;
  }
  const relatedHtml = renderInlineRelations(entity, {
    links: state.graph.links.filter((link) => getId(link.source) === entity.id || getId(link.target) === entity.id),
    entities: state.entities
  });
  const summary = getVisibleEntitySummary(entity, { isMoodleHtmlEntity });
  els.panelContent.innerHTML = renderEntityReadView({
    entity,
    summaryHtml: summary ? renderSummaryCallout(entity, summary) : "",
    contentHtml: renderContentWithEntityLinks(entity.body, entity.path, renderFormat),
    relatedHtml
  });
  els.panelContent.querySelector("#edit-toggle").addEventListener("change", (event) => {
    state.editMode = event.target.checked;
    renderRightPanel();
  });
  els.panelContent.querySelector("[data-copy-entity-link]")?.addEventListener("click", () => copyDeepLink({ entityId: entity.id }));
  highlightRenderedSearchMatches();
  decorateSmartLinks(els.panelContent);
  applySyntaxHighlighting(els.panelContent);
  bindInlineEntityClicks();
}

function isSummaryOptionEnabled(entity) {
  return Boolean(getVisibleEntitySummary(entity, { isMoodleHtmlEntity }));
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
  els.panelContent.innerHTML = state.discussionRenderer.renderPanel(entity);
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
  const contentFormat = getEntityEditorFormat(entity, looksLikeHtml);
  const editorMode = getInitialEditorMode(entity, looksLikeHtml);
  const summaryEnabled = isSummaryOptionEnabled(entity);
  const summaryStyle = normalizeSummaryStyle(entity.summary_style);
  const graphImageEnabled = Boolean(entity.graph_image_enabled && entity.graph_image);
  const graphImageValue = entity.graph_image || "";
  els.panelContent.innerHTML = renderEditFormView({
    entity,
    contentFormat,
    editorMode,
    summaryEnabled,
    summaryStyle,
    graphImageEnabled,
    graphImageValue
  });
  els.panelContent.querySelector("#edit-toggle").addEventListener("change", (event) => {
    if (event.target.checked) return;
    persistEditForm(entity, { exitEdit: true });
  });
  els.panelContent.querySelector("#summary-toggle")?.addEventListener("change", (event) => {
    const enabled = event.target.checked;
    setSummaryOptionEnabled(els.panelContent, enabled);
    markEditDirty();
    scheduleEditAutosave(entity);
  });
  els.panelContent.querySelectorAll("[data-summary-style]").forEach((button) => {
    button.addEventListener("click", () => {
      setSummaryStyleSelection(els.panelContent, button, summaryStyleLabel(button.dataset.summaryStyle));
      markEditDirty();
      scheduleEditAutosave(entity);
    });
  });
  els.panelContent.querySelector("#graph-image-toggle")?.addEventListener("change", (event) => {
    setGraphImageOptionEnabled(els.panelContent, event.target.checked);
    markEditDirty();
    scheduleEditAutosave(entity);
  });
  els.panelContent.querySelector("#graph-image-file")?.addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;
    const extension = getImageExtensionFromBlob(file);
    const path = `assets/uploads/${crypto.randomUUID()}.${extension}`;
    state.files.set(path, { path, dataUrl: await blobToDataUrl(file), binary: true });
    const relativePath = getRelativePackPath(entity.path, path);
    setGraphImageValue(els.panelContent, relativePath);
    markEditDirty();
    scheduleEditAutosave(entity);
  });
  els.panelContent.querySelector("#clear-graph-image")?.addEventListener("click", () => {
    setGraphImageValue(els.panelContent, "");
    markEditDirty();
    scheduleEditAutosave(entity);
  });
  els.panelContent.querySelectorAll("[data-editor-mode]").forEach((button) => {
    button.addEventListener("click", () => switchEditorMode(entity, button.dataset.editorMode));
  });
  setupContentEditor(entity);
  const surface = els.panelContent.querySelector(".edit-surface");
  surface?.addEventListener("input", (event) => {
    markEditDirty({ body: event.target?.id === "adjust-body" });
    if (getEditorMode() === "preview" || getEditorFormat() === "html") updateEditorPreview(entity);
    scheduleEditAutosave(entity);
  });
  surface?.addEventListener("change", (event) => {
    if (!event.target?.closest("[data-editor-mode]")) markEditDirty();
    scheduleEditAutosave(entity);
  });
  els.panelContent.querySelector("#download-current").addEventListener("click", exportSelected);
}

function markEditDirty(options = {}) {
  markEditorSurfaceDirty(els.panelContent.querySelector(".edit-surface"), options);
}

function isBodyEditDirty() {
  return isEditorBodyDirty(els.panelContent.querySelector(".edit-surface"));
}

function scheduleEditAutosave(entity) {
  state.editAutosaveTimer = scheduleEditorAutosave(
    state.editAutosaveTimer,
    () => persistEditForm(entity, { rebuild: false, silent: true })
  );
}

function readEditFormValues(entity) {
  const summaryEnabledNow = Boolean(els.panelContent.querySelector("#summary-toggle")?.checked);
  const graphImageEnabledNow = Boolean(els.panelContent.querySelector("#graph-image-toggle")?.checked);
  const graphImage = graphImageEnabledNow ? els.panelContent.querySelector("#graph-image-source")?.value.trim() || "" : "";
  const edited = isBodyEditDirty()
    ? getEditedBodyAndFormat()
    : {
      body: entity.body || "",
      format: getEntityEditorFormat(entity)
    };
  return createEditFormValues({
    entity,
    label: els.panelContent.querySelector("#adjust-label")?.value || "",
    summary: els.panelContent.querySelector("#adjust-summary")?.value || "",
    summaryEnabled: summaryEnabledNow,
    summaryStyle: els.panelContent.querySelector("[data-summary-style].active")?.dataset.summaryStyle,
    graphImageEnabled: graphImageEnabledNow,
    graphImage,
    edited
  });
}

function persistEditForm(entity, options = {}) {
  if (!entity || !els.panelContent.querySelector(".edit-surface")) return false;
  clearTimeout(state.editAutosaveTimer);
  const previousSignature = getEntityEditSignature(entity);
  Object.assign(entity, readEditFormValues(entity));
  const nextSignature = getEntityEditSignature(entity);
  if (previousSignature !== nextSignature) {
    updateFileFromEntity(entity);
    entity.imageURL = entity.graph_image_enabled
      ? resolveGraphImage(entity.graph_image, entity.path)
      : getFirstMarkdownImage(entity.body, entity.path);
    if (options.rebuild !== false) rebuildGraph();
  }
  if (options.exitEdit) {
    state.editMode = false;
    renderRightPanel();
  }
  return previousSignature !== nextSignature;
}

function switchEditorMode(entity, mode) {
  const current = isBodyEditDirty()
    ? getEditedBodyAndFormat()
    : {
      body: entity.body || "",
      format: getEntityEditorFormat(entity, looksLikeHtml)
    };
  destroyContentEditor();
  const next = getNextEditorState({
    mode,
    current,
    toHtml: markdownToEditableHtml,
    toMarkdown: htmlToMarkdown
  });
  setEditorMode(next.mode, next.format);
  const fallback = els.panelContent.querySelector("#adjust-body");
  if (fallback) {
    fallback.value = next.body;
    fallback.scrollTop = 0;
    fallback.scrollLeft = 0;
  }
  setupContentEditor(entity);
  resetEditorScroll();
}

function setupContentEditor(entity) {
  const mode = getEditorMode();
  const format = getEditorFormat();
  const mount = els.panelContent.querySelector("#content-editor");
  const fallback = els.panelContent.querySelector("#adjust-body");
  const initialBody = fallback?.value ?? entity.body ?? "";
  const previewShell = els.panelContent.querySelector(".html-preview-shell");
  mount?.classList.add("hidden");
  fallback?.classList.add("content-editor-fallback");
  fallback.hidden = true;
  previewShell?.classList.add("hidden");
  if (mode === "preview") {
    state.contentEditorAssetMap = new Map();
    previewShell?.classList.remove("hidden");
    updateEditorPreview(entity);
    resetEditorScroll();
    return;
  }
  if (mode === "html" || mode === "markdown") {
    fallback?.classList.remove("content-editor-fallback");
    fallback.hidden = false;
    state.contentEditorAssetMap = new Map();
    resetEditorScroll();
    return;
  }
  if (!mount || !window.toastui?.Editor) {
    mount?.classList.add("hidden");
    fallback?.classList.remove("content-editor-fallback");
    fallback?.classList.remove("hidden");
    fallback.hidden = false;
    return;
  }
  mount.classList.remove("hidden");
  fallback.classList.remove("hidden");
  fallback.classList.add("content-editor-fallback");
  fallback.hidden = true;
  state.contentEditorAssetMap = new Map();
  const editorMarkdown = resolveEditorMarkdownAssets(format === "html" ? htmlToMarkdown(initialBody) : initialBody, entity.path);
  state.contentEditor = new window.toastui.Editor({
    el: mount,
    height: "520px",
    theme: document.documentElement.dataset.theme === "light" ? undefined : "dark",
    initialEditType: "wysiwyg",
    previewStyle: "vertical",
    initialValue: editorMarkdown,
    language: "fr-FR",
    usageStatistics: false,
    hideModeSwitch: true,
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
  state.contentEditor.on?.("change", () => {
    markEditDirty({ body: true });
    scheduleEditAutosave(entity);
  });
  resetEditorScroll();
}

function updateEditorPreview(entity) {
  const preview = els.panelContent.querySelector("#html-preview");
  if (!preview) return;
  const edited = getEditedBodyAndFormat();
  if (isMoodleHtmlEntity(entity) || edited.format === "html") ensureMoodleHtmlSupport();
  preview.innerHTML = renderContentWithEntityLinks(edited.body, entity.path, edited.format);
  decorateSmartLinks(preview);
  applySyntaxHighlighting(preview);
  bindInlineEntityClicks();
}

function applySyntaxHighlighting(root = els.panelContent) {
  applyEditorSyntaxHighlighting(root, window.Prism);
}

function getEditedBodyAndFormat() {
  const mode = getEditorMode();
  const format = getEditorFormat();
  const fallbackBody = els.panelContent.querySelector("#adjust-body")?.value ?? "";
  return getEditedBodyAndFormatValue({
    mode,
    format,
    visualBody: state.contentEditor?.getMarkdown() ?? fallbackBody,
    fallbackBody,
    assetMap: state.contentEditorAssetMap
  });
}

function getEditorMode() {
  return normalizeEditorMode(els.panelContent.querySelector("#editor-mode")?.value);
}

function getEditorFormat() {
  return normalizeEditorFormat(els.panelContent.querySelector("#editor-format")?.value);
}

function setEditorMode(mode, format) {
  const viewState = getEditorModeViewState(mode, format);
  const modeInput = els.panelContent.querySelector("#editor-mode");
  const formatInput = els.panelContent.querySelector("#editor-format");
  const card = els.panelContent.querySelector(".edit-editor-card");
  const badge = els.panelContent.querySelector(".editor-format-badge");
  if (modeInput) modeInput.value = viewState.mode;
  if (formatInput) formatInput.value = viewState.format;
  card?.classList.remove("is-visual-mode", "is-markdown-mode", "is-html-mode", "is-preview-mode");
  card?.classList.add(viewState.modeClass);
  card?.setAttribute("data-editor-format", viewState.format);
  if (badge) badge.textContent = viewState.formatBadge;
  els.panelContent.querySelectorAll("[data-editor-mode]").forEach((button) => {
    const active = button.dataset.editorMode === viewState.mode;
    button.classList.toggle("active", active);
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function resetEditorScroll() {
  resetEditorScrollPositions(els.panelContent, requestAnimationFrame);
}

function destroyContentEditor() {
  Object.assign(state, destroyEditorState(state.contentEditor));
}

function getAnalysisGraphScope() {
  if (state.visibleGraph.nodes.length || !state.graph.nodes.length || !state.activeTypes.size) {
    return state.visibleGraph;
  }
  return state.graph;
}

function renderGraphQualityCard(focusNodes, selected, selectedLink, scopeLinks) {
  const metrics = computeGraphQualityMetrics(focusNodes, scopeLinks);
  const scopeLabel = selected
    ? "Sélection"
    : selectedLink
      ? "Chemin"
      : "Vue active";
  return renderGraphQualityCardView({
    metrics,
    scopeLabel,
    formatCompactNumber,
    formatGraphNumber
  });
}

function renderAnalysis() {
  const selected = state.entities.get(state.selectedId);
  const selectedLink = state.selectedLinkKey ? state.graph.links.find((link) => getLinkKey(link) === state.selectedLinkKey) : null;
  const graphScope = getAnalysisGraphScope();
  const relatedIds = state.selectedId ? getSelectedPathIds() : new Set();
  const linkPath = selectedLink ? getSelectedLinkPath() : { nodeIds: new Set(), linkKeys: new Set() };
  const linkPathIds = linkPath.nodeIds;
  const visibleNodeById = new Map(graphScope.nodes.map((node) => [node.id, node]));
  const relatedNodes = [...graphScope.nodes].filter((node) => relatedIds.has(node.id) && node.id !== state.selectedId);
  renderInsightBreadcrumb(selected);
  const focusNodes = selected
    ? [visibleNodeById.get(selected.id), ...relatedNodes].filter(Boolean)
    : selectedLink
      ? [...graphScope.nodes].filter((node) => linkPathIds.has(node.id))
      : [...graphScope.nodes];
  const graphQualityCard = renderGraphQualityCard(focusNodes, selected, selectedLink, graphScope.links);
  const linkedCount = selected
    ? state.graph.links.filter((link) => getId(link.source) === selected.id || getId(link.target) === selected.id).length
    : state.graph.links.length;
  if (selected) {
    const metadata = getEntityMetadataEntries(selected, relatedNodes.length, linkedCount, {
      modelSchema: state.modelSchema,
      commentsByEntity: state.comments
    });
    const selectedSummary = getVisibleEntitySummary(selected);
    els.kpiGrid.classList.add("project-metadata");
    els.kpiGrid.innerHTML = `
      ${graphQualityCard}
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
        ${selectedSummary ? `<p>${escapeHtml(selectedSummary)}</p>` : ""}
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
      ${graphQualityCard}
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
        ${manifest.description ? `<p>${escapeHtml(manifest.description)}</p>` : ""}
        <div class="project-tags">
          ${manifest.version ? `<span>Version ${escapeHtml(manifest.version)}</span>` : ""}
          ${generatedAt ? `<span>${escapeHtml(generatedAt)}</span>` : ""}
        </div>
      </div>
    `;
    els.kpiGrid.classList.add("project-metadata");
    els.kpiGrid.innerHTML = `
      ${graphQualityCard}
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
  return getEntityReactionsView(entityId, {
    commentsByEntity: state.comments,
    entityReactions: state.entityReactions,
    authUid: state.authUid
  });
}

function renderInsightBreadcrumb(selected) {
  const container = document.querySelector("#insight-breadcrumb");
  if (!container) return;
  const entities = getBreadcrumbEntities(selected, {
    entities: state.entities,
    links: state.graph.links,
    typeConfig: TYPE_CONFIG
  });
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

function renderTypeDistributionChart(nodes) {
  renderTypeDistributionChartView({
    nodes,
    canvas: document.querySelector("#type-distribution-chart"),
    legend: document.querySelector("#type-distribution-legend"),
    chartState: state.charts,
    chartCtor: window.Chart,
    allNodeCount: state.graph.nodes.length
  });
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
  const card = els.emojiPickerPopover?.querySelector(".emoji-picker-card");
  state.emojiPickerPositionCleanup?.();
  state.emojiPickerPositionCleanup = anchor && card ? overlays.position(anchor, card, { placement: "auto", distance: 8 }) : null;
  state.emojiPickerController?.focusFirst();
}

function openEntityEmojiPicker(entityId, anchor) {
  state.emojiPickerTarget = { entityId, entityReaction: true };
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
  downloadBlob(new Blob([entity.rawText || serializeEntity(entity, jsyaml.dump.bind(jsyaml))], { type: "text/markdown;charset=utf-8" }), `${safeFileName(entity.label)}.md`);
}

async function exportAll() {
  const zip = new JSZip();
  const projectName = safeFileName(state.projectManifest?.titre || state.projectManifest?.id || "prospectre");
  const projectRoot = zip.folder(projectName);
  const files = getExportFiles({
    files: state.files,
    entities: state.entities,
    modelSchema: state.modelSchema
  });
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

function updateFileFromEntity(entity) {
  const file = state.files.get(entity.path);
  if (!file) return;
  updateMarkdownFileFromEntity(file, entity, {
    parseMarkdownFile,
    normalizeSummaryStyle,
    dumpYaml: jsyaml.dump.bind(jsyaml)
  });
  entity.rawText = file.text;
  saveSession();
}

function updateManifestFile() {
  if (!state.projectManifest) return;
  state.projectManifest.modele = state.modelSchema;
  const manifestFile = state.files.get("manifest.json");
  if (manifestFile) {
    manifestFile.text = JSON.stringify(state.projectManifest, null, 2);
  } else {
    state.files.set("manifest.json", {
      path: "manifest.json",
      text: JSON.stringify(state.projectManifest, null, 2)
    });
  }
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
  const entityCounts = new Map();
  for (const entity of state.entities.values()) {
    entityCounts.set(entity.type, (entityCounts.get(entity.type) || 0) + 1);
  }
  els.schemaAdminContent.innerHTML = renderSchemaTypesView({
    schema: state.schemaDraft,
    entityCounts,
    entityCount: getSchemaEntityCount(state.schemaDraft)
  });
}

function renderSchemaFields() {
  const selectedType = getSelectedSchemaType(state.schemaDraft, state.schemaSelectedType);
  if (!selectedType) {
    els.schemaAdminContent.innerHTML = `<p class="empty-state">Créez d’abord un type d’élément.</p>`;
    return;
  }
  state.schemaSelectedType = selectedType.id;
  const selectedField = selectedType.fields.find((field) => field.key === state.schemaSelectedField) || selectedType.fields[0] || null;
  state.schemaSelectedField = selectedField?.key || "";
  els.schemaAdminContent.innerHTML = renderSchemaFieldsView({
    schema: state.schemaDraft,
    selectedType,
    selectedField,
    fieldKindLabel
  });
}

function renderSchemaTransfer() {
  const report = getSchemaCompatibilityReport(state.schemaDraft);
  els.schemaAdminContent.innerHTML = renderSchemaTransferView(report);
}

function handleSchemaAdminInput(event) {
  if (!state.schemaDraft) return;
  const typeId = event.target.dataset.schemaType;
  if (typeId) {
    const value = event.target.type === "checkbox"
      ? event.target.checked
      : event.target.type === "number" ? Number(event.target.value) : event.target.value;
    const type = applySchemaTypeInput(state.schemaDraft, typeId, event.target.dataset.schemaProp, value);
    if (!type) return;
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
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    const field = applySchemaFieldInput(state.schemaDraft, state.schemaSelectedType, state.schemaSelectedField, fieldProp, value);
    if (!field) return;
    if (fieldProp === "kind") {
      renderSchemaFields();
    }
    return;
  }
  if (event.target.matches("[data-field-values]")) {
    const field = getSelectedSchemaField();
    if (field) field.values = parseSchemaFieldValues(event.target.value);
  }
}

async function handleSchemaAdminClick(event) {
  const button = event.target.closest("button");
  if (!button || !state.schemaDraft) return;
  if (button.dataset.selectField) {
    state.schemaSelectedField = button.dataset.selectField;
    renderSchemaFields();
  } else if (button.hasAttribute("data-add-type")) {
    addSchemaType();
  } else if (button.dataset.deleteType) {
    await deleteSchemaType(button.dataset.deleteType, button);
  } else if (button.hasAttribute("data-add-field")) {
    addSchemaField();
  } else if (button.dataset.deleteField) {
    await deleteSchemaField(button.dataset.deleteField, button);
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
  return reorderSchemaTypesValue(state.schemaDraft, sourceId, targetId);
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
  state.schemaDraft.types.push(createSchemaType({
    id: normalizedId,
    label,
    order: state.schemaDraft.types.length
  }));
  renderSchemaTypes();
}

async function deleteSchemaType(typeId, anchor = null) {
  const used = [...state.entities.values()].filter((entity) => entity.type === typeId).length;
  if (used) {
    showToast(`Suppression impossible : ${used} élément${used > 1 ? "s utilisent" : " utilise"} ce type`);
    return;
  }
  const confirmed = await confirmAction({
    title: "Supprimer ce type",
    message: "Ce type sera retiré du schéma du modèle.",
    details: "Cette action est limitée au schéma en cours d'édition.",
    anchor,
    confirmLabel: "Supprimer",
    confirmIcon: "delete",
    tone: "danger"
  });
  if (!confirmed) return;
  removeSchemaType(state.schemaDraft, typeId);
  renderSchemaTypes();
}

function addSchemaField() {
  const type = getSelectedSchemaType(state.schemaDraft, state.schemaSelectedType);
  if (!type) return;
  const label = window.prompt("Libellé du champ");
  if (!label?.trim()) return;
  const key = safeSchemaId(window.prompt("Clé YAML stable", safeSchemaId(label)));
  if (!key || type.fields.some((field) => field.key === key)) {
    showToast("Clé YAML invalide ou déjà utilisée");
    return;
  }
  addSchemaFieldValue(state.schemaDraft, state.schemaSelectedType, createSchemaField({ key, label }));
  state.schemaSelectedField = key;
  renderSchemaFields();
}

async function deleteSchemaField(fieldKey, anchor = null) {
  const type = state.schemaDraft.types.find((item) => item.id === state.schemaSelectedType);
  if (!type || fieldKey === "titre") {
    showToast("Le champ titre est obligatoire");
    return;
  }
  const confirmed = await confirmAction({
    title: "Supprimer ce champ",
    message: "Le champ sera retiré du schéma.",
    details: "Les données déjà présentes dans les fiches ne seront pas effacées.",
    anchor,
    confirmLabel: "Supprimer",
    confirmIcon: "delete",
    tone: "danger"
  });
  if (!confirmed) return;
  state.schemaSelectedField = removeSchemaField(state.schemaDraft, state.schemaSelectedType, fieldKey);
  renderSchemaFields();
}

function getSelectedSchemaField() {
  return state.schemaDraft ? getSelectedSchemaFieldValue(state.schemaDraft, state.schemaSelectedType, state.schemaSelectedField) : null;
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

async function resetSchemaDraft(event) {
  const confirmed = await confirmAction({
    title: "Réinitialiser le schéma",
    message: "Les types et champs du modèle reviendront aux valeurs par défaut.",
    details: "Le contenu des fiches du projet actif n'est pas supprimé.",
    anchor: event?.currentTarget || null,
    confirmLabel: "Réinitialiser",
    confirmIcon: "restart_alt",
    tone: "danger"
  });
  if (!confirmed) return;
  state.schemaDraft = structuredClone(DEFAULT_MODEL_SCHEMA);
  state.schemaSelectedType = DEFAULT_MODEL_SCHEMA.types[0]?.id || "";
  state.schemaSelectedField = DEFAULT_MODEL_SCHEMA.types[0]?.fields[0]?.key || "";
  renderSchemaAdmin();
}

function getSchemaCompatibilityReport(schema) {
  return getSchemaCompatibilityReportValue(schema, state.entities, {
    hiddenNodeTypes: HIDDEN_NODE_TYPES,
    parseMarkdownFile
  });
}

function getSchemaEntityCount(schema) {
  return getSchemaEntityCountValue(schema, state.entities);
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

function hideRightPanel() {
  if (state.panelManager?.getLayout?.().context?.open) {
    state.panelManager.close("context");
    return;
  }
  closeContextPanelState();
}

function toggleDrawer() {
  state.panelManager?.toggleCollapsed("insights");
  const icon = document.querySelector("#toggle-drawer i");
  const collapsed = Boolean(state.panelManager?.getPreferences?.("insights")?.collapsed);
  if (icon) icon.textContent = collapsed ? "expand_less" : "expand_more";
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
  closeActivityPanel();
  const open = Boolean(state.panelManager?.getLayout?.().profile?.open);
  if (open) closeProfile();
  else state.panelManager?.open("profile");
}

function closeProfile() {
  state.panelManager?.close("profile");
  closeProfileState();
}

function closeProfileState() {
  els.profileMenu?.classList.add("hidden");
  document.querySelector("#app").classList.remove("profile-open");
  pauseGamificationVisual();
}

function handleProfileTabClick(event) {
  const button = event.target.closest("[data-profile-tab]");
  if (!button) return;
  selectProfileTab(button.dataset.profileTab);
}

function selectProfileTab(tab = "settings") {
  const selected = tab === "portability" ? "portability" : "settings";
  document.querySelectorAll("[data-profile-tab]").forEach((button) => {
    const active = button.dataset.profileTab === selected;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll("[data-profile-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.profilePanel !== selected);
  });
}

function handleRichImageLoad(event) {
  updateRichImageState(event.target, "is-loaded");
}

function handleRichImageError(event) {
  updateRichImageState(event.target, "is-broken");
}

function updateRichImageState(target, stateClass) {
  if (!(target instanceof HTMLImageElement)) return;
  const frame = target.closest(".rich-image-frame");
  if (!frame) return;
  frame.classList.remove("is-loading", "is-loaded", "is-broken");
  frame.classList.add(stateClass);
}

function openActivityPanel() {
  closeProfile();
  const open = Boolean(state.panelManager?.getLayout?.().activity?.open);
  if (open) closeActivityPanel();
  else state.panelManager?.open("activity");
}

function closeActivityPanel() {
  state.panelManager?.close("activity");
  closeActivityPanelState();
}

function closeActivityPanelState() {
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
    ? `<div class="activity-list ps-meta-list">${items.map(renderActivityItem).join("")}</div>`
    : `<p class="empty-state">${wantsRead ? "Aucune activité consultée." : "Aucune nouvelle activité."}</p>`;
  els.activityContent.querySelectorAll("[data-activity-id]").forEach((button) => {
    button.addEventListener("click", () => openActivityItem(button.dataset.activityId));
  });
}

function renderActivityItem(item) {
  const comment = findComment(item.commentId);
  const reactions = comment ? getCommentReactions(comment) : [];
  return renderActivityItemView(item, {
    renderAvatar: avatarMarkup,
    renderRelativeTime: relativeTimeMarkup,
    renderReaction: reactionEmojiMarkup,
    reactions
  });
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
    openContextPanel();
    updateVisibleGraph();
  }
  closeActivityPanel();
}

function renderTrashActivity() {
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
  const confirmed = await confirmAction({
    title: "Réinitialisation complète",
    message: "PROSPECTRE va repartir sur une identité locale neuve et le projet par défaut.",
    details: "Les préférences, sessions locales, commentaires, cache du projet actif, vue du graphe et paramètres de connexion seront effacés de ce navigateur.",
    anchor: document.querySelector("#clear-local"),
    confirmLabel: "Tout réinitialiser",
    confirmIcon: "restart_alt",
    tone: "danger"
  });
  if (!confirmed) return;
  try {
    if (state.provider?.authApi && state.provider?.auth) {
      await state.provider.authApi.signOut(state.provider.auth);
    }
  } catch {
    // Le nettoyage local doit rester possible même si Firebase est indisponible.
  }
  await state.provider?.disconnect?.();
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  [
    SESSION_KEY,
    PROFILE_KEY,
    ANONYMOUS_PROFILE_KEY,
    GOOGLE_PROFILE_KEY,
    COMMENTS_KEY,
    DRAFTS_KEY,
    ACTIVITY_READ_KEY,
    THEME_KEY,
    REALTIME_KEY,
    PROJECT_SESSIONS_KEY,
    GRAPH_LAYOUT_KEY
  ].forEach((key) => key && localStorage.removeItem(key));
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("prospectre.")) localStorage.removeItem(key);
  }
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith("prospectre.")) sessionStorage.removeItem(key);
  }
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState(null, "", cleanUrl);
  window.location.replace(cleanUrl);
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
  if (!document.querySelector("[data-profile-tab].active")) selectProfileTab("settings");
}

function renderGamificationCard() {
  if (!els.gamificationCard) return;
  const online = state.realtimeStatus === "firebase";
  const globalScore = Number(state.gamification.scores?.global?.totalHearts || 0);
  const projectScore = Number(state.gamification.scores?.project?.projectHearts || 0);
  const cycle = state.gamification.cycle;
  const active = isGamificationActive();
  const viewModel = getGamificationViewModel({
    online,
    active,
    globalScore,
    projectScore,
    cycle,
    cycleSeconds: HEART_CYCLE_SECONDS
  });
  if (state.gamification.lastRenderSignature !== viewModel.signature) {
    state.gamification.lastRenderSignature = viewModel.signature;
    els.gamificationCard.innerHTML = renderGamificationCardView({
      ...viewModel,
      cycle,
      cycleSeconds: HEART_CYCLE_SECONDS
    });
  }
  updateHeartCounters({ globalScore, projectScore, cyclePoints: cycle.points });
  syncGamificationVisual({ online, active, progress: viewModel.progress, cyclePoints: cycle.points });
}

function handleWidgetExternalAction(event) {
  const menuButton = event.target.closest("[data-widget-menu]");
  if (menuButton) {
    event.preventDefault();
    event.stopPropagation();
    const actions = menuButton.closest(".heart-actions");
    const menu = actions?.querySelector(".heart-menu-popover");
    const open = Boolean(menu?.hidden);
    document.querySelectorAll(".heart-menu-popover").forEach((item) => {
      item.hidden = true;
      item.previousElementSibling?.setAttribute("aria-expanded", "false");
    });
    if (menu) {
      menu.hidden = !open;
      menuButton.setAttribute("aria-expanded", String(open));
    }
    return;
  }
  const button = event.target.closest("[data-external-widget]");
  if (!button) {
    if (!event.target.closest(".heart-actions")) {
      document.querySelectorAll(".heart-menu-popover").forEach((item) => {
        item.hidden = true;
        item.previousElementSibling?.setAttribute("aria-expanded", "false");
      });
    }
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const widgetId = button.dataset.externalWidget;
  if (!widgetId) return;
  document.querySelectorAll(".heart-menu-popover").forEach((item) => {
    item.hidden = true;
    item.previousElementSibling?.setAttribute("aria-expanded", "false");
  });
  state.windowBridge?.openExternal({ kind: "panel", panelId: widgetId, title: "PROSPECTRE — Coprésence" });
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
  const layout = state.panelManager?.getLayout?.() || {};
  const visibleInPanel = Boolean(layout.profile?.open || layout.gamification?.open || state.externalWindow?.panelId === "gamification");
  const shouldRun = Boolean(online && reactor && visibleInPanel && !document.hidden);
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
  els.profileIdentity.innerHTML = renderProfileIdentityView({
    profile: state.profile,
    identity,
    avatarHtml: avatarMarkup(state.profile, "width:34px;height:34px;")
  });
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

function applyTheme(theme, options = {}) {
  const resolved = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : theme;
  document.documentElement.dataset.theme = resolved;
  state.appStore?.dispatch({ type: "state:patch", scope: "theme", patch: { theme: resolved } });
  if (options.broadcast !== false) state.windowBridge?.publish("theme:set", { theme });
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

function resetView(options = {}) {
  hideRightPanel();
  closeFilterMenu();
  closeGraphSearch();
  closeGraphHelp();
  if (options.resetPanels !== false) state.panelManager?.resetLayout?.();
  applyGraphToolbarPrefs(normalizeGraphToolbarPrefs({ mode: "dock", edge: "left", x: 10, y: 92 }));
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

function toggleGraphHelp() {
  const open = els.graphHelpPopover?.classList.contains("hidden");
  if (open) {
    closeProjectMenu();
    closeFilterMenu();
    closeGraphSearch();
  }
  els.graphHelpPopover?.classList.toggle("hidden", !open);
  els.graphHelpToggle?.setAttribute("aria-expanded", String(open));
  syncToolbarActiveStates();
  if (open) requestAnimationFrame(() => positionToolbarPopover(els.graphHelpPopover, els.graphHelpToggle));
}

function closeGraphHelp() {
  els.graphHelpPopover?.classList.add("hidden");
  els.graphHelpToggle?.setAttribute("aria-expanded", "false");
  syncToolbarActiveStates();
}

function clearSelection() {
  if (!state.selectedId && !state.panelManager?.getLayout?.().context?.open) return;
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
  closeGraphHelp();
  closeProjectMenu();
  els.graphSearchPopover?.classList.remove("hidden");
  els.graphSearchToggle?.setAttribute("aria-expanded", "true");
  syncToolbarActiveStates();
  requestAnimationFrame(() => {
    positionToolbarPopover(els.graphSearchPopover, els.graphSearchToggle);
    els.search?.focus();
  });
  renderSearchResults();
}

function closeGraphSearch() {
  els.graphSearchPopover?.classList.add("hidden");
  els.graphSearchToggle?.setAttribute("aria-expanded", "false");
  syncToolbarActiveStates();
}

function positionOpenToolbarPopover() {
  if (els.typeFilters && !els.typeFilters.classList.contains("hidden")) positionToolbarPopover(els.typeFilters, els.filterMenuToggle);
  if (els.graphSearchPopover && !els.graphSearchPopover.classList.contains("hidden")) positionToolbarPopover(els.graphSearchPopover, els.graphSearchToggle);
  if (els.graphHelpPopover && !els.graphHelpPopover.classList.contains("hidden")) positionToolbarPopover(els.graphHelpPopover, els.graphHelpToggle);
}

function positionToolbarPopover(popover, anchor) {
  if (!popover || popover.classList.contains("hidden")) return;
  const toolbar = els.graphToolbar || document.querySelector(".graph-toolbar");
  const anchorRect = anchor?.getBoundingClientRect() || toolbar?.getBoundingClientRect();
  if (!anchorRect) return;
  const toolbarEdge = toolbar?.dataset.edge || "left";
  const popoverRect = popover.getBoundingClientRect();
  const gap = 10;
  const minMargin = 10;
  const maxLeft = window.innerWidth - popoverRect.width - minMargin;
  const maxTop = window.innerHeight - popoverRect.height - minMargin;
  const candidates = {
    right: {
      placement: "right",
      left: anchorRect.right + gap,
      top: anchorRect.top + (anchorRect.height - popoverRect.height) / 2
    },
    left: {
      placement: "left",
      left: anchorRect.left - popoverRect.width - gap,
      top: anchorRect.top + (anchorRect.height - popoverRect.height) / 2
    },
    bottom: {
      placement: "bottom",
      left: anchorRect.left + (anchorRect.width - popoverRect.width) / 2,
      top: anchorRect.bottom + gap
    },
    top: {
      placement: "top",
      left: anchorRect.left + (anchorRect.width - popoverRect.width) / 2,
      top: anchorRect.top - popoverRect.height - gap
    }
  };
  const orderByEdge = {
    left: ["right", "left", "bottom", "top"],
    right: ["left", "right", "bottom", "top"],
    top: ["bottom", "top", "right", "left"],
    bottom: ["top", "bottom", "right", "left"]
  };
  const order = orderByEdge[toolbarEdge] || orderByEdge.left;
  const fits = (candidate) => (
    candidate.left >= minMargin &&
    candidate.top >= minMargin &&
    candidate.left + popoverRect.width <= window.innerWidth - minMargin &&
    candidate.top + popoverRect.height <= window.innerHeight - minMargin
  );
  const selected = order.map((key) => candidates[key]).find(fits) || candidates[order[0]];
  const left = Math.max(minMargin, Math.min(maxLeft, selected.left));
  const top = Math.max(minMargin, Math.min(maxTop, selected.top));
  popover.dataset.placement = selected.placement;
  popover.style.left = `${Math.round(left)}px`;
  popover.style.top = `${Math.round(top)}px`;
}

function buildSearchIndex() {
  const docs = buildSearchDocuments(state.graph.nodes);
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
  return fallbackSearchDocuments(state.searchDocs, value, SEARCH_RESULT_LIMIT);
}

function renderSearchResults() {
  if (!els.graphSearchResults || !els.graphSearchStatus) return;
  const view = renderSearchResultsView({
    searchTerm: state.searchTerm,
    results: state.searchResults,
    activeIndex: state.searchActiveIndex,
    entities: state.entities,
    typeConfig: TYPE_CONFIG
  });
  els.graphSearchStatus.textContent = view.status;
  els.graphSearchResults.innerHTML = view.html;
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
  const camera = state.graphView.camera();
  const fit = computeCameraFitForNodes(nodes, camera.position, getGraphAspectRatio());
  if (!fit) return;
  state.graphView.cameraPosition(fit.target, fit.center, options.duration || 620);
}

function getGraphAspectRatio() {
  const rect = els.graphStage.getBoundingClientRect();
  return Math.max(0.7, Math.min(2.4, rect.width / Math.max(1, rect.height)));
}

function resizeGraph() {
  if (!state.graphView) return;
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
  return getImageExtensionFromBlobValue(blob, PACK_ASSET_EXTENSIONS);
}

function getLinkDistance(link) {
  return getLinkDistanceValue(link, state.graph.nodes);
}

function getLinkTargetColor(link) {
  return getLinkTargetColorValue(link, {
    entities: state.entities,
    typeConfig: TYPE_CONFIG
  });
}

function getLinkKey(link) {
  return getLinkKeyValue(link);
}

function isTextInputActive() {
  const element = document.activeElement;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(element?.tagName) || element?.isContentEditable;
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
  return minimalPresenceValue(profile, { selectedNodeId: state.selectedId });
}

function getIdentityState() {
  return getIdentityStateValue({
    authProvider: state.authProvider,
    isAdmin: state.isAdmin,
    authEmail: state.authEmail,
    realtimeStatus: state.realtimeStatus
  });
}

function avatarMarkup(profile, extraStyle = "") {
  const resolved = resolveAvatarProfile(profile);
  return avatarMarkupView(resolved, extraStyle);
}

function resolveAvatarProfile(profile) {
  return resolveAvatarProfileValue(profile, {
    currentProfile: state.profile,
    authUid: state.authUid
  });
}

function getProjectSessionKey(manifest = state.projectManifest) {
  return getProjectSessionKeyValue({ manifest, datasetId: state.datasetId });
}

function getStoredLayouts() {
  return loadJson(GRAPH_LAYOUT_KEY, {});
}

function restoreGraphLayout() {
  const layout = getStoredLayouts()[getProjectSessionKey()] || {};
  applyStoredGraphLayout(state.graph.nodes, layout);
}

function persistNodePosition(node) {
  const layouts = getStoredLayouts();
  persistGraphNodePosition(layouts, getProjectSessionKey(), node);
  localStorage.setItem(GRAPH_LAYOUT_KEY, JSON.stringify(layouts));
}

function clearPersistedNodeLayout(nodeId) {
  const layouts = getStoredLayouts();
  clearGraphNodePosition(layouts, getProjectSessionKey(), nodeId);
  localStorage.setItem(GRAPH_LAYOUT_KEY, JSON.stringify(layouts));
}

function applyNodePosition(node) {
  applyNodePositionToSource(state.graph.nodes, node);
}

function releaseNodeFreeformPosition(node) {
  const nodeId = node?.id;
  if (!nodeId || node.type === "contribution") return;
  clearPersistedNodeLayout(nodeId);
  const targets = [node, state.graph.nodes.find((item) => item.id === nodeId), state.visibleGraph.nodes.find((item) => item.id === nodeId)];
  for (const target of targets) {
    if (!target) continue;
    target.fx = undefined;
    target.fy = undefined;
    target.fz = undefined;
  }
  state.graphView?.d3ReheatSimulation?.();
  updateVisibleGraph({ skipPositionSync: true });
  showToast("Position libre relâchée");
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
  const snapshot = createSessionSnapshot({
    projectManifest: state.projectManifest,
    datasetId: state.datasetId,
    projectManifestUrl: state.projectManifestUrl,
    files: state.files
  });
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

function getAllComments() {
  return Object.values(state.comments).flat();
}

function findComment(commentId) {
  return getAllComments().find((comment) => comment.id === commentId);
}

function isComposerActive() {
  return ["comment-input", "reply-input"].includes(document.activeElement?.id);
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
  return relativeTimeMarkupView(timestamp, tag, { dayjs: window.dayjs });
}

function formatRelativeTime(timestamp) {
  return formatRelativeTimeView(timestamp, { dayjs: window.dayjs });
}

function showToast(message) {
  if (!els.toast) return;
  els.toast.innerHTML = renderToast(message);
  els.toast.classList.remove("hidden");
  els.toast.querySelector(".toast-close")?.addEventListener("click", hideToast, { once: true });
  els.toast.querySelector(".toast-progress")?.addEventListener("animationend", hideToast, { once: true });
  clearTimeout(state.toastTimer);
}

function hideToast() {
  clearTimeout(state.toastTimer);
  els.toast?.classList.add("hidden");
}
