import { loadJson } from "../core/utils.js";

export function createRealtimeController({
  state,
  els,
  providerClasses,
  realtimeKey,
  gamificationKey,
  overviewContextPrefix,
  getAnonymousProfile,
  persistProfile,
  groupCommentsByEntity,
  getInitials,
  getLinkKey,
  getOverviewDiscussionEntity,
  isComposerActive,
  resetGamificationCycle,
  persistComments,
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
  renderCurrentPresenceSummary,
  renderProfileButton,
  renderProfileControls,
  canAdministerSchema,
  closeSchemaAdmin,
  showToast,
  storage = localStorage,
  windowRef = window,
  documentRef = document
}) {
  const { LocalRealtimeProvider, FirebaseRealtimeProvider } = providerClasses;

  async function setupPresence() {
    state.providerVersion += 1;
    const useRealtime = hasFirebaseConfig() && loadJson(realtimeKey, false);
    state.provider = createProvider(useRealtime);
    bindProvider(state.provider);
    await state.provider.connect({ userProfile: state.profile });
    windowRef.setInterval(() => {
      if (state.realtimeStatus === "firebase") {
        state.provider.updatePresence({ selectedNodeId: state.selectedId || null });
      }
    }, 30000);
  }

  function bindProvider(provider) {
    const version = state.providerVersion;
    provider.onPresence((presence) => {
      if (version !== state.providerVersion || provider !== state.provider) return;
      state.presence = normalizePresenceList(presence);
      renderPresence();
      renderPresenceStrip();
      if (state.activeTab === "discussion" && !isComposerActive()) {
        if (state.currentDiscussionEntityId?.startsWith(`${overviewContextPrefix}:`)) renderDiscussion(getOverviewDiscussionEntity());
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
        if (state.currentDiscussionEntityId?.startsWith(`${overviewContextPrefix}:`)) renderDiscussion(getOverviewDiscussionEntity());
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
      storage.setItem(gamificationKey, JSON.stringify(state.gamification.scores));
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

  function createProvider(useFirebase) {
    const config = windowRef.APP_CONFIG?.realtime || {};
    const firebaseReady = useFirebase && config.provider === "firebase" && config.firebase?.apiKey && config.firebase?.databaseURL;
    return firebaseReady ? new FirebaseRealtimeProvider(config) : new LocalRealtimeProvider();
  }

  async function activate(control = documentRef.querySelector("#toggle-avatars")) {
    if (!hasFirebaseConfig()) {
      showToast("Coprésence indisponible");
      renderConnectionStatus();
      return;
    }
    const toolbarButton = documentRef.querySelector("#toggle-avatars");
    const controls = [control, toolbarButton, els.realtimeSwitch].filter(Boolean);
    controls.forEach((item) => { item.disabled = true; });
    try {
      showToast("Activation de la présence…");
      state.providerVersion += 1;
      state.provider = createProvider(true);
      bindProvider(state.provider);
      await state.provider.connect({ userProfile: state.profile });
      storage.setItem(realtimeKey, JSON.stringify(state.realtimeStatus === "firebase"));
      resetGamificationCycle();
      rebuildGraph();
    } catch {
      showToast("Activation de la coprésence indisponible");
    } finally {
      controls.forEach((item) => { item.disabled = false; });
      toolbarButton?.classList.toggle("active", state.realtimeStatus === "firebase");
      renderConnectionStatus();
    }
  }

  async function deactivate() {
    if (state.authProvider === "google") {
      const anonymousProfile = getAnonymousProfile();
      await state.provider?.signOutGoogle?.(anonymousProfile);
      state.profile = anonymousProfile;
    }
    await state.provider?.disconnect?.();
    state.realtimeStatus = "local";
    storage.setItem(realtimeKey, JSON.stringify(false));
    state.authUid = null;
    state.authEmail = null;
    state.authProvider = "local";
    state.isAdmin = false;
    state.providerVersion += 1;
    state.provider = createProvider(false);
    bindProvider(state.provider);
    await state.provider.connect({ userProfile: state.profile });
    resetGamificationCycle();
    state.avatarsVisible = true;
    renderConnectionStatus();
    rebuildGraph();
    renderPresence();
    renderRightPanel();
  }

  async function toggleMode(enabled, control = documentRef.querySelector("#toggle-avatars")) {
    if (enabled) {
      await activate(control);
    } else {
      await deactivate();
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
        await activate(documentRef.querySelector("#toggle-avatars"));
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
    const config = windowRef.APP_CONFIG?.realtime || {};
    return config.provider === "firebase" && config.firebase?.apiKey && config.firebase?.databaseURL;
  }

  function currentPresenceSummary() {
    if (!els.presenceSummary) return;
    const selected = state.entities.get(state.selectedId);
    const selectedLink = state.selectedLinkKey ? state.graph.links.find((link) => getLinkKey(link) === state.selectedLinkKey) : null;
    renderCurrentPresenceSummary(selected, selectedLink);
  }

  function toggleAvatars(event) {
    event?.preventDefault?.();
    toggleMode(state.realtimeStatus !== "firebase");
  }

  function renderConnectionStatus() {
    const online = state.presence.filter((item) => Date.now() - item.lastSeen < 45000).length || 1;
    els.realtimeMode.textContent = state.realtimeStatus === "firebase" ? "Coprésence" : "Local";
    els.presenceCount.textContent = String(online);
    const button = documentRef.querySelector("#toggle-avatars");
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
    const schemaButton = documentRef.querySelector("#open-schema-admin");
    if (schemaButton) {
      schemaButton.disabled = !canAdministerSchema();
      schemaButton.title = canAdministerSchema() ? "" : "Droits administrateur requis";
    }
    if (!canAdministerSchema()) closeSchemaAdmin();
    documentRef.querySelector("#realtime-dot")?.classList.toggle("online", state.realtimeStatus === "firebase");
    documentRef.querySelector("#realtime-dot")?.classList.toggle("offline", state.realtimeStatus !== "firebase");
    renderTypeFilters();
    renderActivityButton();
    renderGamificationCard();
    renderProfileIdentity();
  }

  return {
    setupPresence,
    bindProvider,
    normalizePresenceList,
    createProvider,
    activate,
    deactivate,
    toggleMode,
    toggleGoogleAccount,
    connectGoogleAccount,
    disconnectGoogleAccount,
    hasFirebaseConfig,
    currentPresenceSummary,
    toggleAvatars,
    renderConnectionStatus
  };
}
