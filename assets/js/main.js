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
import { createAnalysisRenderer } from "./ui/analysis-view.js?v=20260626-v315-granular-skeletons-1";
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
import {
  PALETTE_PRESETS,
  normalizePalettePreference,
  palettePreviewGradient,
  resolvePalette
} from "./ui/palette-model.js?v=20260626-v311-palette-1";
import { renderToast } from "./ui/toast-view.js?v=20260626-v313-motion-shell-1";
import { bootstrapProspectre } from "./app/bootstrap.js";
import { createAdaptivePanelsController } from "./controllers/adaptive-panels-controller.js?v=20260626-v315-granular-skeletons-1";
import { createActivityController } from "./controllers/activity-controller.js";
import { createChromeController } from "./controllers/chrome-controller.js?v=20260625-toolbar-liquid-4";
import { createControllerActions } from "./controllers/controller-actions.js";
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
import { createEntityPanelController } from "./controllers/entity-panel-controller.js?v=20260626-v315-granular-skeletons-1";
import { createEditorFormController } from "./controllers/editor-form-controller.js";
import { createExportController } from "./controllers/export-controller.js";
import { createGraphController } from "./controllers/graph-controller.js";
import { createLifecycleController } from "./controllers/lifecycle-controller.js?v=20260626-v314-load-sequence-1";
import { createGraphSceneController } from "./controllers/graph-scene-controller.js?v=20260626-v314-load-sequence-1";
import {
  createEmptyHeartCycle,
  createGamificationController
} from "./controllers/gamification-controller.js?v=20260626-v315-granular-skeletons-1";
import { createPresenceController } from "./controllers/presence-controller.js?v=20260626-liquid-consolidation-1";
import { createProfileController } from "./controllers/profile-controller.js?v=20260626-v315-granular-skeletons-1";
import { createProjectController } from "./controllers/project-controller.js?v=20260626-v314-load-sequence-1";
import { createProjectSwitcherController } from "./controllers/project-switcher-controller.js?v=20260626-v313-motion-shell-1";
import { createRealtimeController } from "./controllers/realtime-controller.js";
import { createSearchController } from "./controllers/search-controller.js";
import { createSelectionController } from "./controllers/selection-controller.js";
import { createSchemaAdminController } from "./controllers/schema-admin-controller.js";
import { createSessionController } from "./controllers/session-controller.js";
import { createSmartLinkController } from "./controllers/smart-link-controller.js";
import { createUiRuntimeController } from "./controllers/ui-runtime-controller.js?v=20260626-v313-motion-shell-1";
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
  paletteOptions: document.querySelector("#palette-options"),
  paletteCustom: document.querySelector("#palette-custom"),
  paletteReset: document.querySelector("#palette-reset"),
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
  palettePreference: normalizePalettePreference(loadJson(STORAGE_KEYS.palette, null)),
  palette: null,
  loadingPhase: { phase: "boot", message: "Initialisation", progress: null, scope: "app" },
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

const {
  setupGlobalTooltips,
  hideGlobalTooltip,
  reportLoading,
  setupControls,
  setupGamification,
  recordHeartEvent,
  resetGamificationCycle,
  toggleMobileMenu,
  toggleFilterMenu,
  closeFilterMenu,
  closeMobileMenu,
  toggleProjectMenu,
  closeProjectMenu,
  renderProjectSwitcher,
  setupPanelManager,
  renderContextPanelBody,
  renderInsightsPanelBody,
  renderProfilePanelBody,
  renderActivityPanelBody,
  renderGamificationPanelBody,
  toggleInsightsPanel,
  syncToolbarActiveStates,
  setupGraphToolbar,
  setupGraphController,
  applyGraphToolbarPrefs,
  openGraphExternalWindow,
  toggleGraphFullscreen,
  openContextPanel,
  sameProjectUrl,
  updateProjectUrl,
  registerRecentProject,
  setupGraph,
  graphHoverLabel,
  setupPresence,
  bindRealtimeProvider,
  normalizePresenceList,
  renderCurrentPresenceSummary,
  createRealtimeProvider,
  loadDefaultProject,
  getUrlLaunchRequest,
  discoverAvailableProjectManifests,
  loadProject,
  loadRemoteResource,
  loadRemoteMoodlePack,
  loadRemoteImportedFiles,
  createRemoteSingleFileManifest,
  updateRemoteResourceUrl,
  getRemoteFileName,
  beginProjectSwitch,
  loadManifestFiles,
  importUserFiles,
  importMoodleCsvFile,
  ensureUniqueMoodleNamespace,
  mergeProjectManifestWithMoodlePack,
  reconnectRealtimeForDataset,
  extractZipEntries,
  loadFiles,
  updateVisibleGraph,
  syncGraphPositionsFromView,
  getSelectedPathIds,
  getSelectedNodePath,
  getSelectedLinkPath,
  getFocusDepth,
  isLinkHighlighted,
  isGraphFocusActive,
  hasAnimatedSelection,
  getGraphLinkColor,
  getGraphLinkWidth,
  getGraphLinkParticles,
  refreshGraphLinkStyles,
  softenGraphMotion,
  renderTypeFilters,
  getFocusSummary,
  updateFocusDepthLabel,
  persistGraphPrefs,
  selectNode,
  selectOverview,
  selectContributionNode,
  selectLink,
  exitGraphFocus,
  applyInitialDeepLink,
  buildDeepLink,
  updateDeepLink,
  copyDeepLink,
  renderRightPanel,
  getOverviewDiscussionEntity,
  getOverviewContextId,
  openOverviewDiscussion,
  renderOverviewMetaDetails,
  renderOverviewEditForm,
  renderOverview,
  isSummaryOptionEnabled,
  bindInlineEntityClicks,
  highlightRenderedSearchMatches,
  renderDiscussion,
  renderEditForm,
  markEditDirty,
  isBodyEditDirty,
  scheduleEditAutosave,
  readEditFormValues,
  persistEditForm,
  switchEditorMode,
  setupContentEditor,
  updateEditorPreview,
  applySyntaxHighlighting,
  getEditedBodyAndFormat,
  getEditorMode,
  getEditorFormat,
  setEditorMode,
  resetEditorScroll,
  destroyContentEditor,
  renderAnalysis,
  renderPresenceSummary,
  getEntityReactions,
  renderPresence,
  renderPresenceStrip,
  renderPresenceChips,
  followUser,
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
  deleteComment,
  exportSelected,
  exportAll,
  updateFileFromEntity,
  updateManifestFile,
  downloadBlob,
  blobToDataUrl,
  showDropOverlay,
  isFileDrag,
  canAdministerSchema,
  hideRightPanel,
  toggleDrawer,
  toggleAvatars,
  activateRealtime,
  toggleRealtimeMode,
  toggleGoogleAccount,
  connectGoogleAccount,
  disconnectGoogleAccount,
  hasFirebaseConfig,
  closeProfile,
  openActivityPanel,
  closeActivityPanel,
  renderActivityButton,
  renderActivityPanel,
  clearLocalData,
  renderProfileButton,
  renderProfileControls,
  renderGamificationCard,
  pauseGamificationVisual,
  renderProfileIdentity,
  renderThemeChoice,
  applyTheme,
  renderConnectionStatus,
  rebuildGraph,
  resetView,
  setupRelativeTimes
} = createControllerActions({
  state,
  els,
  typeConfig: TYPE_CONFIG,
  defaultProjectManifestUrl: DEFAULT_PROJECT_MANIFEST_URL,
  recentProjectsKey: RECENT_PROJECTS_KEY,
  graphPrefsKey: GRAPH_PREFS_KEY,
  graphToolbarPrefsKey: GRAPH_TOOLBAR_PREFS_KEY,
  fitPadding: FIT_PADDING,
  resetFitPadding: RESET_FIT_PADDING,
  focusFitPadding: FOCUS_FIT_PADDING,
  initialFitDelay: INITIAL_FIT_DELAY,
  loadJson,
  createRecentProjectList,
  createProjectNavigationHref,
  sameProjectUrlValue,
  createGraphToolbarController,
  normalizeGraphToolbarPrefs,
  createGraphController,
  showToast,
  applyTheme: (theme, options = {}) => state.uiRuntimeController.applyTheme(theme, options),
  setupRelativeTimes: () => state.uiRuntimeController.setupRelativeTimes(),
  applyGraphToolbarPrefs: (prefs) => state.graphToolbarController?.apply(prefs)
});

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
  paletteKey: STORAGE_KEYS.palette,
  palettePresets: PALETTE_PRESETS,
  loadJson,
  normalizePalettePreference,
  palettePreviewGradient,
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
  setLoadingPhase: (phase, options) => state.uiRuntimeController.setLoadingPhase(phase, options),
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
  cssEscape,
  windowRef: window
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

state.lifecycleController = createLifecycleController({
  state,
  els,
  storageKeys: STORAGE_KEYS,
  typeConfig: TYPE_CONFIG,
  defaultModelSchema: DEFAULT_MODEL_SCHEMA,
  graphToolbarDefaultPrefs: normalizeGraphToolbarPrefs({ mode: "dock", edge: "left", x: 10, y: 92 }),
  resetFitPadding: RESET_FIT_PADDING,
  applyModelSchema,
  buildGraph,
  parseEntities,
  createRealtimeProvider,
  bindRealtimeProvider,
  resetGamificationCycle,
  hideRightPanel,
  closeFilterMenu,
  closeGraphSearch: () => state.chromeController.closeGraphSearch(),
  closeGraphHelp: () => state.chromeController.closeGraphHelp(),
  applyGraphToolbarPrefs,
  renderProjectSwitcher,
  renderAnalysis,
  renderRightPanel,
  renderTypeFilters,
  updateVisibleGraph,
  showToast,
  confirmAction
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
  setLoadingPhase: (phase, options) => state.uiRuntimeController.setLoadingPhase(phase, options),
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
  updateVisibleGraph,
  resolvePalette
});

init();

async function init() {
  if (!window.ForceGraph3D || !window.JSZip || !window.jsyaml || !window.marked || !window.DOMPurify || !window.Papa) {
    state.uiRuntimeController.setLoadingPhase("error", { message: "Chargement incomplet", scope: "app" });
    showToast("Chargement incomplet. Vérifiez la connexion.");
    return;
  }
  state.uiRuntimeController.setLoadingPhase("boot", { message: "Initialisation du shell", scope: "app" });
  reportLoading("noyau applicatif");
  bootstrapV3Runtime();
  applyTheme(loadJson(THEME_KEY, "system"));
  state.uiRuntimeController.applyPalette(state.palettePreference);
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
  state.uiRuntimeController.setLoadingPhase("project-loading", { message: "Chargement du projet", progress: 0, scope: "project" });
  const projectDiscovery = discoverAvailableProjectManifests();
  await loadDefaultProject();
  await projectDiscovery;
  applyInitialDeepLink();
  state.uiRuntimeController.setLoadingPhase("ready", { message: "Interface prête", progress: 100, scope: "app" });
  const adminView = new URLSearchParams(window.location.search).get("admin");
  if (["modele", "champs", "transfert"].includes(adminView)) {
    state.schemaAdminController.openAdmin(adminView === "champs" ? "fields" : adminView === "transfert" ? "transfer" : "types");
  }
  scheduleDeferredPresenceSetup();
}

function scheduleDeferredPresenceSetup() {
  const run = async () => {
    try {
      await setupPresence();
    } catch (error) {
      console.warn("Initialisation coprésence différée indisponible.", error);
    }
  };
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 2200 });
    return;
  }
  window.requestAnimationFrame(() => window.setTimeout(run, 450));
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
