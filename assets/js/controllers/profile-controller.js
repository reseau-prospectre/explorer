import {
  applyAvatarElement,
  renderProfileIdentity as renderProfileIdentityView
} from "../ui/profile-view.js";
import { renderPanelSkeleton } from "../ui/panel-skeletons.js?v=20260626-v315-granular-skeletons-1";

const CUSTOM_PALETTE_FIELDS = Object.freeze([
  {
    label: "C1",
    title: "Accent principal",
    hint: "Actions principales, focus visible, boutons actifs et repères dominants de l'interface."
  },
  {
    label: "C2",
    title: "Accent secondaire",
    hint: "Transitions, reflets glass, barres de progression et variantes de l'accent principal."
  },
  {
    label: "C3",
    title: "Accent tertiaire",
    hint: "Glows, fonds immersifs, états sélectionnés et nuances de profondeur."
  },
  {
    label: "C4",
    title: "Succès",
    hint: "États positifs, validations, indicateurs disponibles et signaux de coprésence actifs."
  },
  {
    label: "C5",
    title: "Danger",
    hint: "Alertes, erreurs, réinitialisations et actions destructives qui doivent rester visibles."
  },
  {
    label: "C6",
    title: "Attention",
    hint: "États intermédiaires, avertissements, scores moyens et informations à surveiller."
  },
  {
    label: "C7",
    title: "Accent libre",
    hint: "Variation complémentaire pour les fonds, skeletons, scrollbars et détails décoratifs."
  }
]);

export function createProfileController({
  els,
  state,
  themeKey,
  paletteKey,
  palettePresets,
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
    els.paletteOptions?.addEventListener("click", handlePaletteChoice);
    els.paletteCustom?.addEventListener("input", handleCustomPaletteInput);
    els.paletteReset?.addEventListener("click", resetPalette);
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
    renderControlsNow();
  }

  function renderControlsNow() {
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
    renderPaletteChoice();
    if (!documentRef.querySelector("[data-profile-tab].active")) selectTab("settings");
  }

  function renderLoadingShell() {
    if (els.gamificationCard) els.gamificationCard.innerHTML = renderPanelSkeleton("gamification");
    if (els.profileIdentity) els.profileIdentity.innerHTML = renderPanelSkeleton("profile");
    if (els.paletteOptions) {
      els.paletteOptions.innerHTML = Array.from({ length: 8 }, () => `
        <span class="palette-option ps-surface ps-skeletonize" aria-hidden="true"><span></span></span>
      `).join("");
    }
    if (els.paletteCustom) els.paletteCustom.innerHTML = "";
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

  function renderPaletteChoice() {
    if (!els.paletteOptions) return;
    const preference = normalizePalettePreference(loadJson(paletteKey, null));
    state.palettePreference = preference;
    const activeId = preference.mode === "preset" ? preference.presetId : preference.mode;
    const options = [
      { id: "random", label: "Random", colors: state.palette?.colors || palettePresets[0].colors, mode: "random" },
      ...palettePresets.map((preset) => ({ ...preset, mode: "preset" })),
      { id: "custom", label: "Custom", colors: preference.mode === "custom" ? preference.colors : state.palette?.colors || palettePresets[0].colors, mode: "custom" }
    ];
    els.paletteOptions.innerHTML = options.map((option) => `
      <button class="palette-option ps-surface${activeId === option.id ? " is-active" : ""}" type="button" data-palette-mode="${option.mode}" data-palette-id="${option.id}" aria-pressed="${activeId === option.id}">
        <span class="palette-option__swatch" style="background:${palettePreviewGradient(option.colors)}"></span>
        <span>${option.label}</span>
      </button>
    `).join("");
    renderCustomPalette(preference);
  }

  function renderCustomPalette(preference = state.palettePreference) {
    if (!els.paletteCustom) return;
    const custom = preference.mode === "custom" ? preference.colors : state.palette?.colors || palettePresets[0].colors;
    const isOpen = preference.mode === "custom";
    els.paletteCustom.classList.remove("hidden");
    els.paletteCustom.classList.toggle("is-open", isOpen);
    els.paletteCustom.setAttribute("aria-hidden", String(!isOpen));
    els.paletteCustom.innerHTML = custom.map((color, index) => {
      const inputId = `palette-color-${index + 1}`;
      const field = CUSTOM_PALETTE_FIELDS[index] || {
        label: `C${index + 1}`,
        title: `Couleur ${index + 1}`,
        hint: "Couleur personnalisée de l'interface."
      };
      return `
      <div class="palette-color ps-field">
        <span class="palette-color__head">
          <label class="palette-color__label" for="${inputId}">${field.label}</label>
          <button class="palette-color__info graph-quality-info" style="--grade-color:${color}" type="button" aria-label="${field.title}">
            <i>info</i>
            <span class="tooltip top max">${field.hint}</span>
          </button>
        </span>
        <input id="${inputId}" class="ps-input" type="color" data-palette-color="${index}" value="${color}" aria-label="${field.title}">
      </div>
    `;
    }).join("");
  }

  function handlePaletteChoice(event) {
    const button = event.target.closest("[data-palette-mode]");
    if (!button) return;
    const mode = button.dataset.paletteMode;
    const preference = mode === "preset"
      ? { mode: "preset", presetId: button.dataset.paletteId }
      : mode === "custom"
        ? { mode: "custom", colors: state.palette?.colors || palettePresets[0].colors }
        : { mode: "random" };
    savePalette(preference);
  }

  function handleCustomPaletteInput(event) {
    const input = event.target.closest("[data-palette-color]");
    if (!input) return;
    const current = normalizePalettePreference(loadJson(paletteKey, null));
    const colors = current.mode === "custom" ? [...current.colors] : [...(state.palette?.colors || palettePresets[0].colors)];
    colors[Number(input.dataset.paletteColor)] = input.value;
    savePalette({ mode: "custom", colors }, { render: false });
  }

  function resetPalette() {
    localStorage.removeItem(paletteKey);
    savePalette({ mode: "random" }, { persist: false });
  }

  function savePalette(preference, options = {}) {
    const normalized = normalizePalettePreference(preference);
    state.palettePreference = normalized;
    if (options.persist !== false && normalized.mode !== "random") {
      localStorage.setItem(paletteKey, JSON.stringify(normalized));
    } else if (normalized.mode === "random") {
      localStorage.removeItem(paletteKey);
    }
    state.uiRuntimeController.applyPalette(normalized);
    if (options.render !== false) renderPaletteChoice();
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
    renderControlsNow,
    renderLoadingShell,
    renderIdentity,
    renderThemeChoice,
    renderPaletteChoice,
    scheduleSave,
    save
  };
}
