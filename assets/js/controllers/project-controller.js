import { loadJson, parseJson, safeFileName, shortLabel } from "../core/utils.js";
import { getFileExtension } from "../services/export-model.js";
import {
  createImportedFilesPlan,
  createRemoteSingleFileManifest as createRemoteSingleFileManifestValue,
  createRemoteResourceHref,
  ensureUniqueMoodleNamespace as ensureUniqueMoodleNamespaceValue,
  getLaunchRequestFromSearch,
  getRemoteFileName as getRemoteFileNameValue,
  mergeProjectManifestWithMoodlePack as mergeProjectManifestWithMoodlePackValue,
  resolveProjectRestore
} from "../services/project-launch.js";

export function createProjectController({
  state,
  els,
  defaultProjectManifestUrl,
  knownProjectManifests,
  defaultModelSchema,
  typeConfig,
  packAssetExtensions,
  packAssetMimeTypes,
  sessionKey,
  projectSessionsKey,
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
  closeGraphSearch,
  closeFilterMenu,
  hideRightPanel,
  destroyContentEditor,
  resetGraphInteractionState,
  clearSearchState,
  updateSearchControl,
  renderSearchResults,
  renderProjectSwitcher,
  renderTypeFilters,
  renderAnalysis,
  renderPresence,
  renderPresenceStrip,
  showToast,
  setLoadingPhase,
  zipCtor = window.JSZip,
  fetchRef = fetch,
  windowRef = window,
  consoleRef = console
}) {
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
      await loadProject(defaultProjectManifestUrl, { updateUrl: false });
    } catch (error) {
      setLoadingPhase?.("error", { message: "Projet indisponible", scope: "project" });
      if (requested.kind === "default") throw error;
      consoleRef.warn("Ressource demandée indisponible, retour au projet par défaut.", error);
      showToast("Ressource demandée indisponible · retour au projet par défaut");
      await loadProject(defaultProjectManifestUrl, { updateUrl: true });
    }
  }

  function getUrlLaunchRequest() {
    return getLaunchRequestFromSearch(windowRef.location.search, {
      defaultManifestUrl: defaultProjectManifestUrl,
      knownManifests: knownProjectManifests
    });
  }

  async function discoverAvailableProjectManifests() {
    const discovered = await Promise.all(knownProjectManifests.map(async (entry) => {
      if (!entry.url) return null;
      try {
        const response = await fetchRef(entry.url, { cache: "no-store" });
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
        consoleRef.info(`Pack local absent ou indisponible: ${entry.url}`, error);
        return null;
      }
    }));
    state.availableProjectManifests = discovered.filter(Boolean);
    renderProjectSwitcher();
    return state.availableProjectManifests;
  }

  async function loadProject(manifestUrl, options = {}) {
    beginProjectSwitch(manifestUrl);
    setLoadingPhase?.("project-loading", { message: "Chargement du manifeste…", progress: 0, scope: "project" });
    showToast("Chargement du manifeste…", { tone: "loading", progress: 0, duration: 7200 });
    const manifestResponse = await fetchRef(manifestUrl, { cache: "no-store" });
    if (!manifestResponse.ok) throw new Error(`Manifest indisponible (${manifestResponse.status})`);
    const manifest = await manifestResponse.json();
    const baseUrl = new URL(".", new URL(manifestUrl, windowRef.location.href)).href;
    state.projectManifestUrl = manifestUrl;
    state.projectManifest = manifest;
    state.projectBaseUrl = baseUrl;
    applyModelSchema(manifest.modele || defaultModelSchema, { resetFilters: true });
    renderProjectSwitcher();
    renderTypeFilters();
    const canonicalFiles = await loadManifestFiles(manifest, baseUrl, (loaded, total, path) => {
      const pct = total ? Math.round((loaded / total) * 100) : 0;
      setLoadingPhase?.("project-loading", {
        message: `Chargement du projet… ${pct}%`,
        progress: pct,
        scope: "project"
      });
      showToast(`Chargement du projet… ${pct}% · ${loaded}/${total} fichiers${path ? ` · ${shortLabel(path, 34)}` : ""}`, {
        tone: "loading",
        progress: pct,
        duration: 7200
      });
    });
    const sessions = loadJson(projectSessionsKey, {});
    const saved = sessions[getProjectSessionKey(manifest)] || loadJson(sessionKey, null);
    const restore = resolveProjectRestore(manifest, canonicalFiles, saved);
    state.projectManifest = restore.manifest;
    if (options.updateUrl !== false) updateProjectUrl(manifestUrl);
    loadFiles(restore.files, restore.message, { resetFilters: true });
    setLoadingPhase?.("ready", { message: restore.message, progress: 100, scope: "project" });
    schedulePostLoadAnalysis();
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
    const absoluteUrl = new URL(resourceUrl, windowRef.location.href).href;
    const fileName = getRemoteFileName(absoluteUrl);
    const extension = getFileExtension(fileName);
    setLoadingPhase?.("project-loading", { message: "Chargement distant…", progress: null, scope: "project" });
    showToast(`Chargement distant… ${shortLabel(fileName || absoluteUrl, 42)}`, { tone: "loading", duration: 7200 });
    if (extension === "json" || /manifest\.json(?:$|[?#])/i.test(absoluteUrl)) {
      await loadProject(absoluteUrl, options);
      return;
    }
    const response = await fetchRef(absoluteUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`Ressource distante indisponible (${response.status})`);
    if (extension === "zip") {
      const files = await extractZipEntries(await zipCtor.loadAsync(await response.blob()));
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
    setLoadingPhase?.("ready", { message: "Référentiel Moodle distant chargé", progress: 100, scope: "project" });
    schedulePostLoadAnalysis();
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
    setLoadingPhase?.("ready", { message: importedManifest ? "Pack distant chargé" : "Fiche distante chargée", progress: 100, scope: "project" });
    schedulePostLoadAnalysis();
    if (state.realtimeStatus === "firebase") await reconnectRealtimeForDataset();
  }

  function createRemoteSingleFileManifest(files, options = {}) {
    return createRemoteSingleFileManifestValue(files, {
      ...options,
      safeFileName,
      defaultModelSchema
    });
  }

  function updateRemoteResourceUrl(resourceUrl) {
    const href = createRemoteResourceHref(windowRef.location.href, resourceUrl);
    if (href) windowRef.history.replaceState(null, "", href);
  }

  function getRemoteFileName(resourceUrl) {
    return getRemoteFileNameValue(resourceUrl, windowRef.location.href);
  }

  function beginProjectSwitch(manifestUrl) {
    setLoadingPhase?.("project-loading", { message: "Préparation du shell…", progress: null, scope: "project" });
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
    for (const key of Object.keys(typeConfig)) delete typeConfig[key];
    state.searchDocs = [];
    state.searchIndex = null;
    state.projectManifestUrl = manifestUrl;
    state.projectManifest = { titre: "Chargement…", version: "" };
    updateSearchControl();
    renderSearchResults();
    renderProjectSwitcher();
    renderTypeFilters();
    state.graphView?.graphData({ nodes: [], links: [] });
    renderPresence();
    renderPresenceStrip();
    renderAnalysisLoadingSkeleton();
  }

  function schedulePostLoadAnalysis() {
    const render = () => renderAnalysis();
    if (typeof windowRef.requestAnimationFrame === "function") {
      windowRef.requestAnimationFrame(() => windowRef.setTimeout(render, 140));
      return;
    }
    windowRef.setTimeout(render, 140);
  }

  function renderAnalysisLoadingSkeleton() {
    if (!els.timeline || !els.kpiGrid || !els.entityTable || !els.presenceSummary) return;
    els.timeline.innerHTML = `
      <div class="context-card project-context-card ps-card ps-surface ps-skeleton-layout" aria-busy="true">
        <span class="ps-skeleton ps-skeleton--heading"></span>
        <span class="ps-skeleton ps-skeleton--text"></span>
        <span class="ps-skeleton ps-skeleton--text" style="width:72%"></span>
      </div>
    `;
    els.kpiGrid.classList.add("project-metadata");
    els.kpiGrid.innerHTML = Array.from({ length: 2 }, () => `
      <article class="project-meta-card ps-card ps-surface ps-skeleton-layout" aria-busy="true">
        <span class="ps-skeleton ps-skeleton--heading"></span>
        <span class="ps-skeleton ps-skeleton--text"></span>
        <span class="ps-skeleton ps-skeleton--text" style="width:64%"></span>
      </article>
    `).join("");
    els.entityTable.innerHTML = `
      <div class="chart-card ps-card ps-surface ps-skeleton-layout" aria-busy="true">
        <span class="ps-skeleton ps-skeleton--circle"></span>
        <span class="ps-skeleton ps-skeleton--text"></span>
        <span class="ps-skeleton ps-skeleton--text" style="width:58%"></span>
      </div>
      <div class="ps-skeleton-layout" aria-busy="true">
        <span class="ps-skeleton ps-skeleton-row"></span>
        <span class="ps-skeleton ps-skeleton-row"></span>
        <span class="ps-skeleton ps-skeleton-row"></span>
      </div>
    `;
    els.presenceSummary.innerHTML = `
      <article class="presence-summary-card ps-card ps-surface ps-skeleton-layout" aria-busy="true">
        <span class="ps-skeleton ps-skeleton--heading"></span>
        <span class="ps-skeleton ps-skeleton--text"></span>
      </article>
    `;
  }

  async function loadManifestFiles(manifest, baseUrl, onProgress = null) {
    const paths = [...new Set((manifest.fichiers || []).filter((path) => {
      const extension = getFileExtension(path);
      return extension === "md" || packAssetExtensions.has(extension);
    }))];
    let loaded = 0;
    onProgress?.(loaded, paths.length, "");
    const results = await Promise.all(paths.map(async (path) => {
      const response = await fetchRef(new URL(path, baseUrl), { cache: "no-store" });
      if (!response.ok) throw new Error(`Fichier absent du projet : ${path}`);
      const file = packAssetExtensions.has(getFileExtension(path))
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
        imported.push(...await extractZipEntries(await zipCtor.loadAsync(file)));
      } else if (file.name.toLowerCase().endsWith(".csv")) {
        if (await importMoodleCsvFile(file)) return;
      } else if (file.name.toLowerCase().endsWith(".md")) {
        imported.push({ path: file.name, text: await file.text() });
      } else if (packAssetExtensions.has(getFileExtension(file.name))) {
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
      defaultModelSchema,
      mergeModelSchemas
    });
  }

  async function extractZipEntries(zip) {
    const entries = Object.values(zip.files).filter((item) => !item.dir);
    const roots = entries.map((entry) => entry.name.split("/")[0]).filter(Boolean);
    const commonRoot = roots.length && roots.every((root) => root === roots[0]) ? `${roots[0]}/` : "";
    const files = [];
    for (const entry of entries) {
      const path = commonRoot ? entry.name.slice(commonRoot.length) : entry.name;
      const extension = getFileExtension(path);
      if (packAssetExtensions.has(extension)) {
        files.push({
          path,
          dataUrl: `data:${packAssetMimeTypes[extension]};base64,${await entry.async("base64")}`,
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

  return {
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
    renderAnalysisLoadingSkeleton,
    importUserFiles,
    importMoodleCsvFile,
    ensureUniqueMoodleNamespace,
    mergeProjectManifestWithMoodlePack,
    extractZipEntries
  };
}
