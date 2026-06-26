export function createControllerActions({
  state,
  els,
  typeConfig,
  defaultProjectManifestUrl,
  recentProjectsKey,
  graphPrefsKey,
  graphToolbarPrefsKey,
  fitPadding,
  resetFitPadding,
  focusFitPadding,
  initialFitDelay,
  loadJson,
  createRecentProjectList,
  createProjectNavigationHref,
  sameProjectUrlValue,
  createGraphToolbarController,
  normalizeGraphToolbarPrefs,
  createGraphController,
  showToast,
  applyTheme,
  setupRelativeTimes,
  applyGraphToolbarPrefs,
  windowRef = window,
  documentRef = document,
  storage = localStorage
}) {
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
      storageKey: graphToolbarPrefsKey,
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
      fitPadding,
      resetFitPadding,
      focusFitPadding,
      initialFitDelay
    });
    state.graphController.mount();
  }

  function openGraphExternalWindow() {
    state.windowBridge?.openExternal({ kind: "graph", title: "PROSPECTRE — Graphe" });
    showToast("Graphe ouvert en fenêtre externe");
  }

  async function toggleGraphFullscreen() {
    try {
      if (documentRef.fullscreenElement) {
        await documentRef.exitFullscreen();
        return;
      }
      await (els.graphStage || documentRef.documentElement).requestFullscreen();
      setTimeout(() => state.graphController.fit(), 120);
    } catch {
      showToast("Plein écran indisponible");
    }
  }

  function openContextPanel() {
    state.adaptivePanelsController.openContext();
  }

  function sameProjectUrl(a, b) {
    return sameProjectUrlValue(a, b, windowRef.location.href);
  }

  function updateProjectUrl(manifestUrl) {
    windowRef.history.replaceState(null, "", createProjectNavigationHref(windowRef.location.href, manifestUrl, {
      defaultManifestUrl: defaultProjectManifestUrl
    }));
  }

  function registerRecentProject(manifest) {
    const recent = loadJson(recentProjectsKey, []);
    storage.setItem(recentProjectsKey, JSON.stringify(createRecentProjectList(recent, manifest)));
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
    await state.lifecycleController.reconnectRealtimeForDataset();
  }

  async function extractZipEntries(zip) {
    return state.projectController.extractZipEntries(zip);
  }

  function loadFiles(files, message, options = {}) {
    state.lifecycleController.loadFiles(files, message, options);
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
    storage.setItem(graphPrefsKey, JSON.stringify(state.graphPrefs));
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

  function closeProfile() {
    state.profileController.close();
  }

  function openActivityPanel() {
    state.activityController.openPanel();
  }

  function closeActivityPanel() {
    state.activityController.closePanel();
  }

  function renderActivityButton() {
    state.activityController.renderButton();
  }

  function renderActivityPanel() {
    state.activityController.renderPanel();
  }

  async function clearLocalData() {
    await state.lifecycleController.clearLocalData();
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

  function renderConnectionStatus() {
    state.realtimeController.renderConnectionStatus();
  }

  function rebuildGraph() {
    state.lifecycleController.rebuildGraph();
  }

  function resetView(options = {}) {
    state.lifecycleController.resetView(options);
  }

  function setupRelativeTimesAction() {
    setupRelativeTimes();
  }

  function applyThemeAction(theme, options = {}) {
    applyTheme(theme, options);
  }

  function applyGraphToolbarPrefsAction(prefs) {
    applyGraphToolbarPrefs(normalizeGraphToolbarPrefs(prefs));
  }

  return {
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
    applyGraphToolbarPrefs: applyGraphToolbarPrefsAction,
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
    applyTheme: applyThemeAction,
    renderConnectionStatus,
    rebuildGraph,
    resetView,
    setupRelativeTimes: setupRelativeTimesAction
  };
}
