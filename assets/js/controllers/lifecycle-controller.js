import { makeDatasetId } from "../core/utils.js";

export function createLifecycleController({
  state,
  els,
  storageKeys,
  typeConfig,
  defaultModelSchema,
  graphToolbarDefaultPrefs,
  resetFitPadding,
  applyModelSchema,
  buildGraph,
  parseEntities,
  createRealtimeProvider,
  bindRealtimeProvider,
  resetGamificationCycle,
  hideRightPanel,
  closeFilterMenu,
  closeGraphSearch,
  closeGraphHelp,
  applyGraphToolbarPrefs,
  renderProjectSwitcher,
  renderAnalysis,
  renderRightPanel,
  renderTypeFilters,
  updateVisibleGraph,
  showToast,
  confirmAction,
  storage = localStorage,
  sessionStorageRef = sessionStorage,
  windowRef = window,
  documentRef = document
}) {
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

  function loadFiles(files, message, options = {}) {
    files.forEach((file) => state.files.set(file.path, file));
    applyModelSchema(state.projectManifest?.modele || defaultModelSchema, { resetFilters: options.resetFilters === true });
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
    if (!isProjectLoading()) renderAnalysis();
    if (state.selectedId) renderRightPanel();
    state.graphController.scheduleInitialFit();
    showToast(`${message} · ${state.graph.nodes.length} éléments`);
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
    closeGraphSearch();
    closeGraphHelp();
    if (options.resetPanels !== false) state.panelManager?.resetLayout?.();
    applyGraphToolbarPrefs(graphToolbarDefaultPrefs);
    state.sessionController.resetGraphInteractionState();
    state.activeTypes = new Set(Object.keys(typeConfig));
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
    state.graphController.fit(800, resetFitPadding);
  }

  async function clearLocalData() {
    const confirmed = await confirmAction({
      title: "Réinitialisation complète",
      message: "PROSPECTRE va repartir sur une identité locale neuve et le projet par défaut.",
      details: "Les préférences, sessions locales, commentaires, cache du projet actif, vue du graphe et paramètres de connexion seront effacés de ce navigateur.",
      anchor: documentRef.querySelector("#clear-local"),
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
    Object.values(storageKeys).forEach((key) => storage.removeItem(key));
    for (const key of Object.keys(storage)) {
      if (key.startsWith("prospectre.")) storage.removeItem(key);
    }
    for (const key of Object.keys(sessionStorageRef)) {
      if (key.startsWith("prospectre.")) sessionStorageRef.removeItem(key);
    }
    resetView({ resetPanels: true });
    const cleanUrl = `${windowRef.location.origin}${windowRef.location.pathname}`;
    windowRef.history.replaceState(null, "", cleanUrl);
    windowRef.location.replace(cleanUrl);
  }

  function isProjectLoading() {
    return state.loadingPhase?.phase === "project-loading";
  }

  return {
    reconnectRealtimeForDataset,
    loadFiles,
    rebuildGraph,
    resetView,
    clearLocalData
  };
}
