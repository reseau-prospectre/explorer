import {
  applyAvatarElement,
  renderProfileIdentity as renderProfileIdentityView
} from "../ui/profile-view.js";

export function createProfileController({
  els,
  state,
  themeKey,
  loadJson,
  persistProfile,
  getIdentityState,
  avatarMarkup,
  closeActivityPanel,
  pauseGamificationVisual,
  renderGamificationCard,
  renderPresence,
  renderPresenceStrip,
  renderDiscussion,
  documentRef = document,
  setTimeoutRef = setTimeout,
  clearTimeoutRef = clearTimeout
}) {
  function bindControls() {
    documentRef.querySelector("#profile-button")?.addEventListener("click", open);
    documentRef.querySelector("#close-profile")?.addEventListener("click", close);
    els.profileOptionsTabs?.addEventListener("click", handleTabClick);
    documentRef.addEventListener("load", handleRichImageLoad, true);
    documentRef.addEventListener("error", handleRichImageError, true);
    els.profileName?.addEventListener("input", scheduleSave);
    els.profileInitial?.addEventListener("input", scheduleSave);
    els.profileColor?.addEventListener("input", (event) => {
      state.profile.color = event.target.value;
      applyAvatarElement(els.profileColorPreview, state.profile);
    });
    els.profileColor?.addEventListener("change", save);
    documentRef.querySelectorAll("[name='avatar-mode']").forEach((input) => {
      input.addEventListener("change", save);
    });
  }

  function open() {
    closeActivityPanel();
    const openPanel = Boolean(state.panelManager?.getLayout?.().profile?.open);
    if (openPanel) close();
    else state.panelManager?.open("profile");
  }

  function close() {
    state.panelManager?.close("profile");
    closeState();
  }

  function closeState() {
    els.profileMenu?.classList.add("hidden");
    documentRef.querySelector("#app")?.classList.remove("profile-open");
    pauseGamificationVisual();
  }

  function handleTabClick(event) {
    const button = event.target.closest("[data-profile-tab]");
    if (!button) return;
    selectTab(button.dataset.profileTab);
  }

  function selectTab(tab = "settings") {
    const selected = tab === "portability" ? "portability" : "settings";
    documentRef.querySelectorAll("[data-profile-tab]").forEach((button) => {
      const active = button.dataset.profileTab === selected;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    documentRef.querySelectorAll("[data-profile-panel]").forEach((panel) => {
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

  function scheduleSave() {
    clearTimeoutRef(state.profileSaveTimer);
    state.profileSaveTimer = setTimeoutRef(save, 650);
  }

  function save() {
    state.profile.displayName = els.profileName.value.trim() || "Anonyme";
    state.profile.avatar = els.profileInitial.value.trim().slice(0, 2) || "A";
    state.profile.color = els.profileColor?.value || state.profile.color;
    state.profile.avatarMode = documentRef.querySelector("[name='avatar-mode']:checked")?.value || "initials";
    state.profile.photoURL = state.profile.avatarMode === "google" ? state.profile.googlePhotoURL || null : null;
    state.profile.userCustomized = true;
    persistProfile(state.profile, state.authProvider === "google" ? "google" : "anonymous");
    renderButton();
    renderIdentity();
    applyAvatarElement(els.profileColorPreview, state.profile);
    state.provider?.syncProfile(state.profile);
    renderPresence();
    renderPresenceStrip();
    if (state.activeTab === "discussion") renderDiscussion();
  }

  function renderButton() {
    applyAvatarElement(els.profileAvatar, state.profile);
  }

  function renderControls() {
    els.profileName.value = state.profile.displayName;
    els.profileInitial.value = state.profile.avatar;
    if (els.profileColor) els.profileColor.value = state.profile.color;
    const googleChoice = documentRef.querySelector("[name='avatar-mode'][value='google']");
    const initialsChoice = documentRef.querySelector("[name='avatar-mode'][value='initials']");
    const canUseGooglePhoto = Boolean(state.profile.googlePhotoURL && state.authProvider === "google");
    documentRef.querySelector(".avatar-choice")?.classList.toggle("hidden", !canUseGooglePhoto);
    documentRef.querySelector("#avatar-photo-choice")?.classList.toggle("hidden", !canUseGooglePhoto);
    if (googleChoice) googleChoice.checked = canUseGooglePhoto && state.profile.avatarMode === "google";
    if (initialsChoice) initialsChoice.checked = !googleChoice?.checked;
    applyAvatarElement(els.profileColorPreview, state.profile);
    renderGamificationCard();
    renderIdentity();
    renderThemeChoice();
    if (!documentRef.querySelector("[data-profile-tab].active")) selectTab("settings");
  }

  function renderIdentity() {
    if (!els.profileIdentity) return;
    const identity = getIdentityState();
    els.profileIdentity.innerHTML = renderProfileIdentityView({
      profile: state.profile,
      identity,
      avatarHtml: avatarMarkup(state.profile, "width:34px;height:34px;")
    });
    const initialsPreview = documentRef.querySelector("#avatar-choice-initials");
    if (initialsPreview) {
      initialsPreview.textContent = state.profile.avatar;
      initialsPreview.style.background = state.profile.color;
    }
    const photoPreview = documentRef.querySelector("#avatar-choice-photo");
    if (photoPreview) applyAvatarElement(photoPreview, {
      ...state.profile,
      photoURL: state.profile.googlePhotoURL || null
    });
  }

  function renderThemeChoice() {
    const theme = loadJson(themeKey, "system");
    documentRef.querySelectorAll("[data-theme-choice]").forEach((button) => {
      button.classList.toggle("active", button.dataset.themeChoice === theme);
      button.setAttribute("aria-pressed", String(button.dataset.themeChoice === theme));
    });
  }

  return {
    bindControls,
    open,
    close,
    closeState,
    handleTabClick,
    selectTab,
    handleRichImageLoad,
    handleRichImageError,
    renderButton,
    renderControls,
    renderIdentity,
    renderThemeChoice,
    scheduleSave,
    save
  };
}
