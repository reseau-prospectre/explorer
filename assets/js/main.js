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
  loadJson,
  makeDatasetId,
} from "./core/utils.js";
import { createProfileStore } from "./core/profile.js";
import { createProjectModel } from "./model/project.js";
import {
  mergeModelSchemas
} from "./model/schema.js";
import {
  getLinkDistance as getLinkDistanceValue,
  getLinkKey as getLinkKeyValue,
  getLinkTargetColor as getLinkTargetColorValue,
  getScoreBoost
} from "./graph/link-model.js";
import { createNodeRenderer } from "./graph/node-renderer.js";
import {
  getImageExtensionFromBlob as getImageExtensionFromBlobValue
} from "./services/export-model.js";
import {
  getIdentityState as getIdentityStateValue,
  minimalPresence as minimalPresenceValue,
  resolveAvatarProfile as resolveAvatarProfileValue
} from "./services/identity-model.js";
import {
  createProjectNavigationHref,
  createRecentProjectList,
  sameProjectUrl as sameProjectUrlValue
} from "./services/project-launch.js";
import { createRealtimeProviders } from "./services/realtime.js";
import {
  groupCommentsByEntity
} from "./services/session-model.js";
import { createMarkdownRenderer } from "./ui/markdown.js";
import {
  normalizeSummaryStyle
} from "./ui/editor-view.js";
import {
  getVisibleEntitySummary
} from "./ui/entity-view.js";
import { createAnalysisRenderer } from "./ui/analysis-view.js?v=20260625-toolbar-liquid-3";
import {
  emojiToId,
  reactionEmojiMarkup,
  renderEntityReactionBlock
} from "./ui/reactions-view.js";
import {
  formatRelativeTime as formatRelativeTimeView,
  relativeTimeMarkup as relativeTimeMarkupView
} from "./ui/relative-time-view.js";
import {
  decorateSmartLinks,
  renderSmartText
} from "./ui/smart-link-view.js";
import {
  avatarMarkup as avatarMarkupView,
  resolveAvatarAssetURL
} from "./ui/profile-view.js?v=20260626-liquid-consolidation-1";
import { renderToast } from "./ui/toast-view.js?v=20260624-atomic-feedback-2";
import { bootstrapProspectre } from "./app/bootstrap.js";
import { createAdaptivePanelsController } from "./controllers/adaptive-panels-controller.js?v=20260625-panel-rails-3";
import { createActivityController } from "./controllers/activity-controller.js";
import { createChromeController } from "./controllers/chrome-controller.js?v=20260625-toolbar-liquid-4";
import { createGraphOptionsController } from "./controllers/graph-options-controller.js";
import {
  createGraphToolbarController,
  GRAPH_TOOLBAR_PREFS_KEY,
  normalizeGraphToolbarPrefs
} from "./ui/graph-toolbar.js?v=20260625-toolbar-liquid-4";
import {
  createDiscussionRenderer,
  QUICK_REACTIONS
} from "./controllers/comments-controller.js";
import { createCommentInteractionsController } from "./controllers/comment-interactions-controller.js";
import { createEntityPanelController } from "./controllers/entity-panel-controller.js";
import { createEditorFormController } from "./controllers/editor-form-controller.js";
import { createExportController } from "./controllers/export-controller.js";
import { createGraphController } from "./controllers/graph-controller.js";
import { createGraphSceneController } from "./controllers/graph-scene-controller.js";
import {
  createEmptyHeartCycle,
  createGamificationController
} from "./controllers/gamification-controller.js";
import { createPresenceController } from "./controllers/presence-controller.js?v=20260626-liquid-consolidation-1";
import { createProfileController } from "./controllers/profile-controller.js";
import { createProjectController } from "./controllers/project-controller.js?v=20260626-liquid-consolidation-1";
import { createProjectSwitcherController } from "./controllers/project-switcher-controller.js?v=20260626-liquid-consolidation-1";
import { createRealtimeController } from "./controllers/realtime-controller.js";
import { createSearchController } from "./controllers/search-controller.js";
import { createSelectionController } from "./controllers/selection-controller.js";
import { createSchemaAdminController } from "./controllers/schema-admin-controller.js";
import { createSessionController } from "./controllers/session-controller.js";
import { createSmartLinkController } from "./controllers/smart-link-controller.js";
import { createUiRuntimeController } from "./controllers/ui-runtime-controller.js?v=20260624-atomic-feedback-2";
import { overlays } from "./ui/overlay-manager.js";
import { confirmAction, requestChoice } from "./ui/confirm-dialog.js?v=20260626-liquid-consolidation-1";
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
state.sessionController = createSessionController({
  state,
  storageKeys: STORAGE_KEYS,
  updateVisibleGraph,
  showToast
});
state.presenceController = createPresenceController({
  els,
  state,
  avatarMarkup,
  selectNode,
  showToast
});
state.selectionController = createSelectionController({
  els,
  state,
  renderRightPanel,
  renderAnalysis,
  openContextPanel,
  updateVisibleGraph,
  scheduleGraphResize: () => state.graphController.scheduleResize(),
  fitFocusedSelection: (fallbackId) => state.graphController.fitFocusedSelection(fallbackId),
  focusSelectedLinkPath: (sourceId, targetId) => state.graphController.focusSelectedLinkPath(sourceId, targetId),
  getLinkKey,
  showToast
});
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
state.commentInteractionsController = createCommentInteractionsController({
  els,
  state,
  heartPoints: HEART_POINTS,
  overviewContextPrefix: OVERVIEW_CONTEXT_PREFIX,
  overlays,
  escapeHtml,
  recordHeartEvent,
  persistEntityReactions: () => state.sessionController.persistEntityReactions(),
  renderAnalysis,
  renderDiscussion,
  renderRightPanel,
  getOverviewDiscussionEntity,
  isComposerActive,
  showToast,
  clearDraft,
  findComment
});
state.analysisRenderer = createAnalysisRenderer({
  els,
  state,
  typeConfig: TYPE_CONFIG,
  getLinkKey,
  getSelectedPathIds,
  getSelectedLinkPath,
  getOverviewContextId,
  getOverviewDiscussionEntity,
  getVisibleEntitySummary,
  getEntityReactions,
  renderPresenceChips,
  activateRealtime,
  reactToEntity,
  openEntityEmojiPicker,
  openOverviewDiscussion,
  selectNode,
  selectContributionNode,
  selectOverview,
  renderRightPanel,
  updateDeepLink,
  followUser
});
state.schemaAdminController = createSchemaAdminController({
  els,
  state,
  defaultModelSchema: DEFAULT_MODEL_SCHEMA,
  hiddenNodeTypes: HIDDEN_NODE_TYPES,
  parseMarkdownFile: (...args) => parseMarkdownFile(...args),
  applyModelSchema: (...args) => applyModelSchema(...args),
  saveSession: () => state.sessionController.saveSession(),
  rebuildGraph,
  renderTypeFilters,
  downloadBlob,
  confirmAction,
  exportAll,
  showToast
});
state.gamificationController = createGamificationController({
  els,
  state,
  cycleSeconds: HEART_CYCLE_SECONDS,
  idleLimit: HEART_IDLE_LIMIT,
  clickCap: HEART_CLICK_CAP,
  points: HEART_POINTS,
  panelManager: () => state.panelManager,
  getScores: () => ({
    globalScore: Number(state.gamification.scores.global?.totalHearts || 0),
    projectScore: Number(state.gamification.scores.project?.projectHearts || 0)
  }),
  showToast,
  windowBridge: () => state.windowBridge,
  externalWindowRef: () => state.externalWindow
});
state.profileController = createProfileController({
  els,
  state,
  themeKey: THEME_KEY,
  loadJson,
  persistProfile,
  getIdentityState,
  avatarMarkup,
  closeActivityPanel,
  pauseGamificationVisual,
  renderGamificationCard,
  renderPresence,
  renderPresenceStrip,
  renderDiscussion
});
state.searchController = createSearchController({
  els,
  state,
  typeConfig: TYPE_CONFIG,
  resultLimit: SEARCH_RESULT_LIMIT,
  closeFilterMenu,
  closeGraphHelp: () => state.chromeController.closeGraphHelp(),
  closeProjectMenu,
  positionToolbarPopover: (popover, anchor) => state.chromeController.positionToolbarPopover(popover, anchor),
  syncToolbarActiveStates,
  updateVisibleGraph,
  renderRightPanel,
  selectNode
});
state.smartLinkController = createSmartLinkController({
  els,
  state,
  heartPoints: HEART_POINTS,
  recordHeartEvent,
  showToast
});
state.activityController = createActivityController({
  els,
  state,
  visibleActivityTypes: VISIBLE_ACTIVITY_TYPES,
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
  reactionEmojiMarkup
});
state.graphOptionsController = createGraphOptionsController({
  els,
  state,
  typeConfig: TYPE_CONFIG,
  contributionFilter: CONTRIBUTION_FILTER,
  getFocusDepth,
  persistGraphPrefs,
  updateVisibleGraph,
  closeFilterMenu,
  resetView,
  confirmAction
});
  state.projectSwitcherController = createProjectSwitcherController({
  els,
  state,
  defaultProjectManifestUrl: DEFAULT_PROJECT_MANIFEST_URL,
  knownProjectManifests: KNOWN_PROJECT_MANIFESTS,
  recentProjectsKey: RECENT_PROJECTS_KEY,
  loadJson,
  sameProjectUrl,
  loadProject,
  reconnectRealtimeForDataset,
  closeFilterMenu,
  closeGraphSearch: () => state.chromeController.closeGraphSearch(),
  closeGraphHelp: () => state.chromeController.closeGraphHelp(),
  showToast
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

state.realtimeController = createRealtimeController({
  state,
  els,
  providerClasses: { LocalRealtimeProvider, FirebaseRealtimeProvider },
  realtimeKey: REALTIME_KEY,
  gamificationKey: GAMIFICATION_KEY,
  overviewContextPrefix: OVERVIEW_CONTEXT_PREFIX,
  getAnonymousProfile,
  persistProfile,
  groupCommentsByEntity,
  getInitials,
  getLinkKey,
  getOverviewDiscussionEntity,
  isComposerActive,
  resetGamificationCycle,
  persistComments: () => state.sessionController.persistComments(),
  persistActivityRead,
  rebuildGraph,
  renderPresence,
  renderPresenceStrip,
  renderDiscussion,
  renderRightPanel,
  renderAnalysis,
  renderActivityPanel,
  renderActivityButton,
  renderGamificationCard,
  renderTypeFilters,
  renderProfileIdentity,
  renderCurrentPresenceSummary: renderPresenceSummary,
  renderProfileButton,
  renderProfileControls,
  canAdministerSchema: () => state.schemaAdminController.canAdminister(),
  closeSchemaAdmin: () => state.schemaAdminController.closeAdmin(),
  showToast
});

const {
  getFirstMarkdownImage,
  resolveGraphImage,
  renderContentWithEntityLinks,
  renderMarkdownWithEntityLinks,
  resolveEditorMarkdownAssets,
  resolvePackAssetUrl
} = createMarkdownRenderer({ state });

state.editorFormController = createEditorFormController({
  els,
  state,
  isSummaryOptionEnabled,
  getImageExtensionFromBlob,
  blobToDataUrl,
  resolveEditorMarkdownAssets,
  updateFileFromEntity,
  resolveGraphImage,
  getFirstMarkdownImage,
  rebuildGraph,
  renderRightPanel,
  exportSelected,
  isMoodleHtmlEntity,
  ensureMoodleHtmlSupport,
  renderContentWithEntityLinks,
  decorateSmartLinks,
  bindInlineEntityClicks
});

state.entityPanelController = createEntityPanelController({
  els,
  state,
  typeConfig: TYPE_CONFIG,
  typeLabels: TYPE_LABELS,
  overviewContextPrefix: OVERVIEW_CONTEXT_PREFIX,
  openContextPanel,
  destroyContentEditor,
  isMoodleHtmlEntity,
  ensureMoodleHtmlSupport,
  updateManifestFile,
  saveSession: () => state.sessionController.saveSession(),
  renderProjectSwitcher,
  renderAnalysis,
  showToast,
  scheduleGraphResize: () => state.graphController.scheduleResize(),
  updateDeepLink,
  renderContentWithEntityLinks,
  copyDeepLink,
  decorateSmartLinks,
  applySyntaxHighlighting,
  renderEditForm,
  selectNode,
  addComment,
  saveDraft,
  activateRealtime,
  followUser,
  startReply,
  deleteComment,
  reactToComment,
  openEmojiPicker,
  reactToEntity,
  openEntityEmojiPicker,
  cssEscape
});

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

state.projectController = createProjectController({
  state,
  els,
  defaultProjectManifestUrl: DEFAULT_PROJECT_MANIFEST_URL,
  knownProjectManifests: KNOWN_PROJECT_MANIFESTS,
  defaultModelSchema: DEFAULT_MODEL_SCHEMA,
  typeConfig: TYPE_CONFIG,
  packAssetExtensions: PACK_ASSET_EXTENSIONS,
  packAssetMimeTypes: PACK_ASSET_MIME_TYPES,
  sessionKey: SESSION_KEY,
  projectSessionsKey: PROJECT_SESSIONS_KEY,
  applyModelSchema,
  blobToDataUrl,
  confirmAction,
  requestChoice,
  convertMoodleCompetencyCsv,
  isLikelyMoodleCompetencyCsv,
  mergeModelSchemas,
  parseMarkdownFile,
  loadFiles,
  reconnectRealtimeForDataset,
  getProjectSessionKey,
  updateProjectUrl,
  registerRecentProject,
  closeProjectMenu,
  closeGraphSearch: () => state.chromeController.closeGraphSearch(),
  closeFilterMenu,
  hideRightPanel,
  destroyContentEditor,
  resetGraphInteractionState: () => state.sessionController.resetGraphInteractionState(),
  clearSearchState: () => state.searchController.clearState(),
  updateSearchControl: () => state.searchController.updateControl(),
  renderSearchResults: () => state.searchController.renderResults(),
  renderProjectSwitcher,
  renderTypeFilters,
  renderAnalysis,
  renderPresence,
  renderPresenceStrip,
  showToast,
  zipCtor: JSZip
});

state.exportController = createExportController({
  state,
  parseMarkdownFile,
  normalizeSummaryStyle,
  dumpYaml: jsyaml.dump.bind(jsyaml),
  zipCtor: JSZip,
  showToast,
  saveSession: () => state.sessionController.saveSession()
});

state.chromeController = createChromeController({
  els,
  state,
  themeKey: THEME_KEY,
  overviewContextPrefix: OVERVIEW_CONTEXT_PREFIX,
  isTextInputActive,
  setupGraphToolbar,
  syncToolbarActiveStates,
  setupNativeEmojiPicker,
  toggleInsightsPanel,
  fitVisibleGraph: (duration, padding) => state.graphController.fit(duration, padding),
  zoomCamera: (factor) => state.graphController.zoom(factor),
  openGraphExternalWindow,
  toggleGraphFullscreen,
  hideRightPanel,
  showDropOverlay,
  exportAll,
  exportSelected,
  openSchemaAdmin: (view) => state.schemaAdminController.openAdmin(view),
  closeSchemaAdmin: () => state.schemaAdminController.closeAdmin(),
  saveSchemaDraft: () => state.schemaAdminController.saveDraft(),
  resetSchemaDraft: (event) => state.schemaAdminController.resetDraft(event),
  toggleAvatars,
  toggleDrawer,
  openActivityPanel,
  closeActivityPanel,
  clearLocalData,
  toggleGoogleAccount,
  toggleRealtimeMode,
  closeEmojiPicker,
  closeLinkPreview: () => state.smartLinkController.closePreview(),
  closeLinkEmbed: () => state.smartLinkController.closeEmbed(),
  applyTheme,
  renderThemeChoice,
  importUserFiles,
  runGraphSearch: (value) => state.searchController.run(value),
  handleGraphSearchKeydown: (event) => state.searchController.handleKeydown(event),
  clearSearch: () => state.searchController.clear(),
  handleSmartLinkClick: (event) => state.smartLinkController.handleClick(event),
  handleSmartLinkHover: (event) => state.smartLinkController.handleHover(event),
  handleSmartLinkFocus: (event) => state.smartLinkController.handleFocus(event),
  renderOverviewMetaDetails,
  renderDiscussion,
  getOverviewDiscussionEntity,
  renderRightPanel,
  updateDeepLink,
  renderActivityPanel,
  isFileDrag,
  renderTypeFilters,
  renderProfileButton,
  renderConnectionStatus
});

state.adaptivePanelsController = createAdaptivePanelsController({
  els,
  state,
  syncToolbarActiveStates,
  positionOpenToolbarPopover: () => state.chromeController.positionOpenToolbarPopover(),
  renderProfileControls,
  renderActivityPanel,
  renderGamificationCard,
  renderAnalysis,
  updateVisibleGraph,
  updateDeepLink,
  scheduleGraphResize: () => state.graphController.scheduleResize()
});

state.graphSceneController = createGraphSceneController({
  els,
  state,
  defaultGraphPrefs: DEFAULT_GRAPH_PREFS,
  linkFocusMaxLinks: LINK_FOCUS_MAX_LINKS,
  makeNodeObject,
  getLinkKey,
  getLinkTargetColor,
  getLinkDistance,
  selectNode,
  selectContributionNode,
  selectLink,
  exitGraphFocus,
  applyNodePosition: (node) => state.sessionController.applyNodePosition(node),
  persistNodePosition: (node) => state.sessionController.persistNodePosition(node),
  releaseNodeFreeformPosition: (node) => state.sessionController.releaseNodeFreeformPosition(node),
  updateFocusDepthLabel,
  renderPresence,
  renderPresenceStrip,
  renderAnalysis,
  resizeGraph: () => state.graphController.resize()
});

state.uiRuntimeController = createUiRuntimeController({
  els,
  state,
  renderToast,
  relativeTimeMarkupView,
  formatRelativeTimeView,
  updateVisibleGraph
});

init();

async function init() {
  if (!window.ForceGraph3D || !window.JSZip || !window.jsyaml || !window.marked || !window.DOMPurify || !window.Papa) {
    showToast("Chargement incomplet. Vérifiez la connexion.");
    return;
  }
  reportLoading("noyau applicatif");
  bootstrapV3Runtime();
  applyTheme(loadJson(THEME_KEY, "system"));
  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    if (loadJson(THEME_KEY, "system") === "system") applyTheme("system");
  });
  reportLoading("contrôleurs interface");
  setupControls();
  setupGamification();
  setupGlobalTooltips();
  setupRelativeTimes();
  reportLoading("panneaux et graphe");
  setupPanelManager();
  setupGraphController();
  setupGraph();
  reportLoading("projet et contenus");
  const projectDiscovery = discoverAvailableProjectManifests();
  await loadDefaultProject();
  await projectDiscovery;
  applyInitialDeepLink();
  reportLoading("coprésence");
  await setupPresence();
  const adminView = new URLSearchParams(window.location.search).get("admin");
  if (["modele", "champs", "transfert"].includes(adminView)) {
    state.schemaAdminController.openAdmin(adminView === "champs" ? "fields" : adminView === "transfert" ? "transfer" : "types");
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
    state.graphController.fit();
  }
  if (type === "state:request") {
    state.windowBridge?.publish("state:hydrate", state.windowBridge.getState());
  }
}

function setupGlobalTooltips() {
  state.uiRuntimeController.setupGlobalTooltips();
}

function hideGlobalTooltip() {
  state.uiRuntimeController.hideGlobalTooltip();
}

function reportLoading(scope, detail = "") {
  const suffix = detail ? ` · ${detail}` : "";
  showToast(`Initialisation · ${scope}${suffix}`, { tone: "loading", icon: "progress_activity" });
}

function setupControls() {
  state.chromeController.mount();
}

function setupGamification() {
  state.gamificationController.mount();
}

function recordHeartEvent(type, points = 0, options = {}) {
  state.gamificationController.recordHeartEvent(type, points, options);
}

function resetGamificationCycle() {
  state.gamificationController.resetCycle();
}

function toggleMobileMenu() {
  state.chromeController.toggleMobileMenu();
}

function toggleFilterMenu() {
  state.chromeController.toggleFilterMenu();
}

function closeFilterMenu() {
  state.chromeController.closeFilterMenu();
}

function closeMobileMenu() {
  state.chromeController.closeMobileMenu();
}

function toggleProjectMenu() {
  state.chromeController.toggleProjectMenu();
}

function closeProjectMenu() {
  state.chromeController.closeProjectMenu();
}

function renderProjectSwitcher() {
  state.projectSwitcherController.renderSwitcher();
}

function setupPanelManager() {
  state.adaptivePanelsController.mount();
}

function renderContextPanelBody() {
  return state.adaptivePanelsController.renderContextPanelBody();
}

function renderInsightsPanelBody(_context, { panel } = {}) {
  return state.adaptivePanelsController.renderInsightsPanelBody(_context, { panel });
}

function renderProfilePanelBody() {
  return state.adaptivePanelsController.renderProfilePanelBody();
}

function renderActivityPanelBody() {
  return state.adaptivePanelsController.renderActivityPanelBody();
}

function renderGamificationPanelBody() {
  return state.adaptivePanelsController.renderGamificationPanelBody();
}

function syncAdaptivePanelLayout(layout = state.panelManager?.getLayout?.() || {}) {
  state.adaptivePanelsController.syncLayout(layout);
}

function toggleInsightsPanel() {
  state.adaptivePanelsController.toggleInsights();
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
    onChange: () => state.chromeController.positionOpenToolbarPopover()
  });
  state.graphToolbarController.mount();
}

function setupGraphController() {
  state.graphController = createGraphController({
    state,
    els,
    resetView,
    openExternal: openGraphExternalWindow,
    requestFullscreen: toggleGraphFullscreen,
    panelManager: state.panelManager,
    renderPresence,
    positionOpenToolbarPopover: () => state.chromeController.positionOpenToolbarPopover(),
    fitPadding: FIT_PADDING,
    resetFitPadding: RESET_FIT_PADDING,
    focusFitPadding: FOCUS_FIT_PADDING,
    initialFitDelay: INITIAL_FIT_DELAY
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
    setTimeout(() => state.graphController.fit(), 120);
  } catch {
    showToast("Plein écran indisponible");
  }
}

function openContextPanel() {
  state.adaptivePanelsController.openContext();
}

function closeContextPanelState() {
  state.adaptivePanelsController.closeContextState();
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
  state.graphSceneController.setup();
}

function graphHoverLabel(node) {
  return state.graphSceneController.graphHoverLabel(node);
}

async function setupPresence() {
  await state.realtimeController.setupPresence();
}

function bindRealtimeProvider(provider) {
  state.realtimeController.bindProvider(provider);
}

function normalizePresenceList(presence) {
  return state.realtimeController.normalizePresenceList(presence);
}

function renderCurrentPresenceSummary() {
  state.realtimeController.currentPresenceSummary();
}

function createRealtimeProvider(useFirebase) {
  return state.realtimeController.createProvider(useFirebase);
}

async function loadDefaultProject() {
  await state.projectController.loadDefaultProject();
}

function getUrlLaunchRequest() {
  return state.projectController.getUrlLaunchRequest();
}

async function discoverAvailableProjectManifests() {
  return state.projectController.discoverAvailableProjectManifests();
}

async function loadProject(manifestUrl, options = {}) {
  await state.projectController.loadProject(manifestUrl, options);
}

async function loadRemoteResource(resourceUrl, options = {}) {
  await state.projectController.loadRemoteResource(resourceUrl, options);
}

async function loadRemoteMoodlePack(pack, options = {}) {
  await state.projectController.loadRemoteMoodlePack(pack, options);
}

async function loadRemoteImportedFiles(files, options = {}) {
  await state.projectController.loadRemoteImportedFiles(files, options);
}

function createRemoteSingleFileManifest(files, options = {}) {
  return state.projectController.createRemoteSingleFileManifest(files, options);
}

function updateRemoteResourceUrl(resourceUrl) {
  state.projectController.updateRemoteResourceUrl(resourceUrl);
}

function getRemoteFileName(resourceUrl) {
  return state.projectController.getRemoteFileName(resourceUrl);
}

function beginProjectSwitch(manifestUrl) {
  state.projectController.beginProjectSwitch(manifestUrl);
}

async function loadManifestFiles(manifest, baseUrl, onProgress = null) {
  return state.projectController.loadManifestFiles(manifest, baseUrl, onProgress);
}

async function importUserFiles(fileList) {
  await state.projectController.importUserFiles(fileList);
}

async function importMoodleCsvFile(file) {
  return state.projectController.importMoodleCsvFile(file);
}

function ensureUniqueMoodleNamespace(text, fileName, pack) {
  return state.projectController.ensureUniqueMoodleNamespace(text, fileName, pack);
}

function mergeProjectManifestWithMoodlePack(currentManifest, importedManifest, importedFiles) {
  return state.projectController.mergeProjectManifestWithMoodlePack(currentManifest, importedManifest, importedFiles);
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
  return state.projectController.extractZipEntries(zip);
}

function loadFiles(files, message, options = {}) {
  files.forEach((file) => state.files.set(file.path, file));
  applyModelSchema(state.projectManifest?.modele || DEFAULT_MODEL_SCHEMA, { resetFilters: options.resetFilters === true });
  state.entities = parseEntities([...state.files.values()]);
  state.datasetId = makeDatasetId([...state.entities.keys()].join("|"));
  state.gamification.scores = { ...state.gamification.scores, project: null };
  resetGamificationCycle();
  state.graph = buildGraph(state.entities);
  state.sessionController.restoreGraphLayout();
  if (state.selectedId && !state.entities.has(state.selectedId)) hideRightPanel();
  state.searchController.buildIndex();
  state.sessionController.saveSession();
  updateVisibleGraph();
  renderProjectSwitcher();
  renderAnalysis();
  if (state.selectedId) renderRightPanel();
  state.graphController.scheduleInitialFit();
  showToast(`${message} · ${state.graph.nodes.length} éléments`);
}

function updateVisibleGraph(options = {}) {
  state.graphSceneController.updateVisibleGraph(options);
}

function syncGraphPositionsFromView() {
  state.graphSceneController.syncGraphPositionsFromView();
}

function getSelectedPathIds(selectedLinkPaths = getSelectedLinkPath(), selectedNodePaths = getSelectedNodePath()) {
  return state.graphSceneController.getSelectedPathIds(selectedLinkPaths, selectedNodePaths);
}

function getSelectedNodePath() {
  return state.graphSceneController.getSelectedNodePath();
}

function getSelectedLinkPath() {
  return state.graphSceneController.getSelectedLinkPath();
}

function getFocusDepth() {
  return state.graphSceneController.getFocusDepth();
}

function isLinkHighlighted(link) {
  return state.graphSceneController.isLinkHighlighted(link);
}

function isGraphFocusActive() {
  return state.graphSceneController.isGraphFocusActive();
}

function hasAnimatedSelection() {
  return state.graphSceneController.hasAnimatedSelection();
}

function getGraphLinkColor(link) {
  return state.graphSceneController.getGraphLinkColor(link);
}

function getGraphLinkWidth(link) {
  return state.graphSceneController.getGraphLinkWidth(link);
}

function getGraphLinkParticles(link) {
  return state.graphSceneController.getGraphLinkParticles(link);
}

function refreshGraphLinkStyles() {
  state.graphSceneController.refreshGraphLinkStyles();
}

function softenGraphMotion() {
  state.graphSceneController.softenGraphMotion();
}

function renderTypeFilters() {
  state.graphOptionsController.renderTypeFilters();
}

function getFocusSummary() {
  return state.graphOptionsController.getFocusSummary();
}

function updateFocusDepthLabel() {
  state.graphOptionsController.updateFocusDepthLabel();
}

function persistGraphPrefs() {
  localStorage.setItem(GRAPH_PREFS_KEY, JSON.stringify(state.graphPrefs));
}

function selectNode(id, moveCamera = false) {
  state.selectionController.selectNode(id, moveCamera);
}

function selectOverview() {
  state.sessionController.resetGraphInteractionState();
  state.provider?.updatePresence({ selectedNodeId: null });
  renderRightPanel();
  renderAnalysis();
  updateVisibleGraph();
  state.graphController.scheduleResize();
  updateDeepLink();
  state.appStore?.dispatch({ type: "state:patch", scope: "selection", patch: { selection: { selectedId: null, selectedLinkKey: null, activeTab: state.activeTab } } });
  if (!state.bridgeApplying) state.windowBridge?.publish("selection:set", { id: null, moveCamera: false, activeTab: state.activeTab });
}

function selectContributionNode(node, moveCamera = false) {
  state.selectionController.selectContributionNode(node, moveCamera);
}

function selectLink(link) {
  state.selectionController.selectLink(link);
}

function exitGraphFocus() {
  state.selectionController.exitGraphFocus();
}

function applyInitialDeepLink() {
  state.selectionController.applyInitialDeepLink();
}

function buildDeepLink({ entityId = state.selectedId, tab = state.activeTab, commentId = null } = {}) {
  return state.selectionController.buildDeepLink({ entityId, tab, commentId });
}

function updateDeepLink(commentId = state.highlightedCommentId) {
  state.selectionController.updateDeepLink(commentId);
}

async function copyDeepLink(options = {}) {
  await state.selectionController.copyDeepLink(options);
}

function renderRightPanel() {
  state.entityPanelController.renderRightPanel();
}

function getOverviewDiscussionEntity() {
  return state.entityPanelController.getOverviewDiscussionEntity();
}

function getOverviewContextId() {
  return state.entityPanelController.getOverviewContextId();
}

function openOverviewDiscussion() {
  state.entityPanelController.openOverviewDiscussion();
}

function renderOverviewMetaDetails() {
  state.entityPanelController.renderOverviewMetaDetails();
}

function renderOverviewEditForm() {
  state.entityPanelController.renderOverviewEditForm();
}

function renderOverview(entity) {
  state.entityPanelController.renderOverview(entity);
}

function isSummaryOptionEnabled(entity) {
  return state.entityPanelController.isSummaryOptionEnabled(entity);
}

function bindInlineEntityClicks() {
  state.entityPanelController.bindInlineEntityClicks();
}

function highlightRenderedSearchMatches() {
  state.entityPanelController.highlightRenderedSearchMatches();
}

function renderDiscussion(entity = state.entities.get(state.selectedId)) {
  state.entityPanelController.renderDiscussion(entity);
}


function renderEditForm(entity) {
  state.editorFormController.renderEditForm(entity);
}

function markEditDirty(options = {}) {
  state.editorFormController.markEditDirty(options);
}

function isBodyEditDirty() {
  return state.editorFormController.isBodyEditDirty();
}

function scheduleEditAutosave(entity) {
  state.editorFormController.scheduleEditAutosave(entity);
}

function readEditFormValues(entity) {
  return state.editorFormController.readEditFormValues(entity);
}

function persistEditForm(entity, options = {}) {
  return state.editorFormController.persistEditForm(entity, options);
}

function switchEditorMode(entity, mode) {
  state.editorFormController.switchEditorMode(entity, mode);
}

function setupContentEditor(entity) {
  state.editorFormController.setupContentEditor(entity);
}

function updateEditorPreview(entity) {
  state.editorFormController.updateEditorPreview(entity);
}

function applySyntaxHighlighting(root = els.panelContent) {
  state.editorFormController.applySyntaxHighlighting(root);
}

function getEditedBodyAndFormat() {
  return state.editorFormController.getEditedBodyAndFormat();
}

function getEditorMode() {
  return state.editorFormController.getEditorMode();
}

function getEditorFormat() {
  return state.editorFormController.getEditorFormat();
}

function setEditorMode(mode, format) {
  state.editorFormController.setEditorMode(mode, format);
}

function resetEditorScroll() {
  state.editorFormController.resetEditorScroll();
}

function destroyContentEditor() {
  state.editorFormController?.destroyContentEditor?.();
}

function getAnalysisGraphScope() {
  return state.analysisRenderer.getGraphScope();
}

function renderAnalysis() {
  state.analysisRenderer.renderAnalysis();
}

function renderPresenceSummary(selected, selectedLink) {
  state.analysisRenderer.renderPresenceSummary(selected, selectedLink);
}

function getEntityReactions(entityId) {
  return state.commentInteractionsController.getEntityReactions(entityId);
}

function renderPresence() {
  state.presenceController.renderPresence();
}

function renderPresenceStrip() {
  state.presenceController.renderPresenceStrip();
}

function renderPresenceChips(users, limit = 5) {
  return state.presenceController.renderPresenceChips(users, limit);
}

function followUser(clientId) {
  state.presenceController.followUser(clientId);
}

async function reactToComment(entityId, commentId, reaction) {
  await state.commentInteractionsController.reactToComment(entityId, commentId, reaction);
}

async function reactToEntity(entityId, reaction) {
  await state.commentInteractionsController.reactToEntity(entityId, reaction);
}

function toggleLocalEntityReaction(entityId, reaction) {
  state.commentInteractionsController.toggleLocalEntityReaction(entityId, reaction);
}

function openEmojiPicker(entityId, commentId, anchor) {
  state.commentInteractionsController.openEmojiPicker(entityId, commentId, anchor);
}

function openEntityEmojiPicker(entityId, anchor) {
  state.commentInteractionsController.openEntityEmojiPicker(entityId, anchor);
}

function closeEmojiPicker() {
  state.commentInteractionsController.closeEmojiPicker();
}

function setupNativeEmojiPicker() {
  state.commentInteractionsController.setupNativeEmojiPicker();
}

function selectEmojiReaction(reaction) {
  state.commentInteractionsController.selectEmojiReaction(reaction);
}

function getCommentReactions(comment) {
  return state.commentInteractionsController.getCommentReactions(comment);
}

async function addComment() {
  await state.commentInteractionsController.addComment();
}

function startReply(commentId) {
  state.commentInteractionsController.startReply(commentId);
}

function getThreadRootId(commentId) {
  return state.commentInteractionsController.getThreadRootId(commentId);
}

function deleteComment(entityId, commentId) {
  state.commentInteractionsController.deleteComment(entityId, commentId);
}

function exportSelected() {
  state.exportController.exportSelected();
}

async function exportAll() {
  await state.exportController.exportAll();
}

function updateFileFromEntity(entity) {
  state.exportController.updateFileFromEntity(entity);
}

function updateManifestFile() {
  state.exportController.updateManifestFile();
}

function downloadBlob(blob, filename) {
  state.exportController.downloadBlob(blob, filename);
}

function blobToDataUrl(blob) {
  return state.exportController.blobToDataUrl(blob);
}

function showDropOverlay() {
  els.dropOverlay.classList.remove("hidden");
}

function isFileDrag(event) {
  return [...(event.dataTransfer?.types || [])].includes("Files");
}

function canAdministerSchema() {
  return state.schemaAdminController.canAdminister();
}

function hideRightPanel() {
  state.adaptivePanelsController.hideRightPanel();
}

function toggleDrawer() {
  state.adaptivePanelsController.toggleDrawer();
}

function toggleAvatars(event) {
  state.realtimeController.toggleAvatars(event);
}

async function activateRealtime(button) {
  await state.realtimeController.activate(button);
}

async function deactivateRealtime() {
  await state.realtimeController.deactivate();
}

async function toggleRealtimeMode(enabled, control = null) {
  await state.realtimeController.toggleMode(enabled, control);
}

async function toggleGoogleAccount() {
  await state.realtimeController.toggleGoogleAccount();
}

async function connectGoogleAccount() {
  await state.realtimeController.connectGoogleAccount();
}

async function disconnectGoogleAccount() {
  await state.realtimeController.disconnectGoogleAccount();
}

function hasFirebaseConfig() {
  return state.realtimeController.hasFirebaseConfig();
}

function openProfile() {
  state.profileController.open();
}

function closeProfile() {
  state.profileController.close();
}

function closeProfileState() {
  state.profileController.closeState();
}

function openActivityPanel() {
  state.activityController.openPanel();
}

function closeActivityPanel() {
  state.activityController.closePanel();
}

function closeActivityPanelState() {
  state.activityController.closeState();
}

function renderActivityButton() {
  state.activityController.renderButton();
}

function renderActivityPanel() {
  state.activityController.renderPanel();
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
  resetView({ resetPanels: true });
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState(null, "", cleanUrl);
  window.location.replace(cleanUrl);
}

function renderProfileButton() {
  state.profileController.renderButton();
}

function renderProfileControls() {
  state.profileController.renderControls();
}

function renderGamificationCard() {
  state.gamificationController.renderCard();
}

function pauseGamificationVisual() {
  state.gamificationController.pauseVisual();
}

function renderProfileIdentity() {
  state.profileController.renderIdentity();
}

function renderThemeChoice() {
  state.profileController.renderThemeChoice();
}

function applyTheme(theme, options = {}) {
  state.uiRuntimeController.applyTheme(theme, options);
}

function renderConnectionStatus() {
  state.realtimeController.renderConnectionStatus();
}

function rebuildGraph() {
  state.graph = buildGraph(state.entities);
  state.sessionController.restoreGraphLayout();
  state.searchController.buildIndex();
  updateVisibleGraph();
  renderAnalysis();
}

function resetView(options = {}) {
  hideRightPanel();
  closeFilterMenu();
  state.chromeController.closeGraphSearch();
  state.chromeController.closeGraphHelp();
  if (options.resetPanels !== false) state.panelManager?.resetLayout?.();
  applyGraphToolbarPrefs(normalizeGraphToolbarPrefs({ mode: "dock", edge: "left", x: 10, y: 92 }));
  state.sessionController.resetGraphInteractionState();
  state.activeTypes = new Set(Object.keys(TYPE_CONFIG));
  if (state.realtimeStatus === "firebase") state.activeTypes.add("contribution");
  state.searchController.clearState();
  state.sessionController.clearPersistedLayout();
  state.sessionController.releaseGraphLayout();
  state.graph = buildGraph(state.entities);
  state.visibleGraph = { nodes: [], links: [] };
  state.searchController.updateControl();
  state.searchController.renderResults();
  renderTypeFilters();
  updateVisibleGraph({ skipPositionSync: true });
  renderAnalysis();
  state.graphView.d3ReheatSimulation?.();
  state.graphController.fit(800, RESET_FIT_PADDING);
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
  return state.sessionController.getProjectSessionKey(manifest);
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
  return state.sessionController.getDraft(entityId, parentId);
}

function saveDraft(entityId, parentId, value) {
  state.sessionController.saveDraft(entityId, parentId, value);
}

function clearDraft(entityId, parentId) {
  state.sessionController.clearDraft(entityId, parentId);
}

function persistActivityRead() {
  state.sessionController.persistActivityRead();
}

function setupRelativeTimes() {
  state.uiRuntimeController.setupRelativeTimes();
}

function updateRelativeTimes(root = document) {
  state.uiRuntimeController.updateRelativeTimes(root);
}

function relativeTimeMarkup(timestamp, tag = "span") {
  return state.uiRuntimeController.relativeTimeMarkup(timestamp, tag);
}

function formatRelativeTime(timestamp) {
  return state.uiRuntimeController.formatRelativeTime(timestamp);
}

function showToast(message, options = {}) {
  state.uiRuntimeController.showToast(message, options);
}

function hideToast() {
  state.uiRuntimeController.hideToast();
}
