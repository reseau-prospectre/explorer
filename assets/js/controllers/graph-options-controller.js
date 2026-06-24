import {
  renderGraphOptionsView,
  renderQuickTypeFiltersView
} from "../ui/graph-options-view.js";

export function createGraphOptionsController({
  els,
  state,
  typeConfig,
  contributionFilter,
  getFocusDepth,
  persistGraphPrefs,
  updateVisibleGraph,
  closeFilterMenu,
  resetView,
  confirmAction
}) {
  function renderTypeFilters() {
    els.typeFilters.innerHTML = "";
    const entries = Object.entries(typeConfig);
    if (state.realtimeStatus === "firebase") {
      if (!state.contributionFilterInitialized) {
        state.activeTypes.add("contribution");
        state.contributionFilterInitialized = true;
      }
      entries.push(["contribution", contributionFilter]);
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
        toggleType(button.dataset.typeFilter);
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

  function toggleType(type) {
    if (state.activeTypes.has(type)) state.activeTypes.delete(type);
    else state.activeTypes.add(type);
    if (!state.activeTypes.size) state.activeTypes.add(type);
    renderTypeFilters();
    updateVisibleGraph();
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
        toggleType(button.dataset.quickTypeFilter);
      });
    });
  }

  return {
    renderTypeFilters,
    getFocusSummary,
    updateFocusDepthLabel,
    renderQuickTypeFilters
  };
}
