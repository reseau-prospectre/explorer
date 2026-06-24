export function createChromeController({
  els,
  state,
  themeKey,
  overviewContextPrefix,
  isTextInputActive,
  setupGraphToolbar,
  syncToolbarActiveStates,
  setupNativeEmojiPicker,
  toggleInsightsPanel,
  fitVisibleGraph,
  zoomCamera,
  openGraphExternalWindow,
  toggleGraphFullscreen,
  hideRightPanel,
  showDropOverlay,
  exportAll,
  exportSelected,
  openSchemaAdmin,
  closeSchemaAdmin,
  saveSchemaDraft,
  resetSchemaDraft,
  toggleAvatars,
  toggleDrawer,
  openActivityPanel,
  closeActivityPanel,
  clearLocalData,
  toggleGoogleAccount,
  toggleRealtimeMode,
  closeEmojiPicker,
  closeLinkPreview,
  closeLinkEmbed,
  applyTheme,
  renderThemeChoice,
  importUserFiles,
  runGraphSearch,
  handleGraphSearchKeydown,
  clearSearch,
  handleSmartLinkClick,
  handleSmartLinkHover,
  handleSmartLinkFocus,
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
} = {}) {
  function mount() {
    els.mobileMenuToggle?.addEventListener("click", toggleMobileMenu);
    els.filterMenuToggle?.addEventListener("click", toggleFilterMenu);
    els.mobileMenu?.addEventListener("click", handleMobileMenuClick);
    document.addEventListener("pointerdown", handleDocumentPointerDown);
    document.addEventListener("keydown", handleDocumentKeydown);
    window.addEventListener("resize", handleResize);
    els.graphHelpToggle?.addEventListener("click", toggleGraphHelp);
    setupGraphToolbar?.();
    document.querySelector("#fit-view")?.addEventListener("click", () => state.graphController?.fit?.() || fitVisibleGraph?.());
    document.querySelector("#zoom-in")?.addEventListener("click", () => zoomCamera?.(0.78));
    document.querySelector("#zoom-out")?.addEventListener("click", () => zoomCamera?.(1.22));
    els.insightsToggle?.addEventListener("click", toggleInsightsPanel);
    els.openGraphWindow?.addEventListener("click", () => state.graphController?.externalize?.() || openGraphExternalWindow?.());
    els.fullscreenGraph?.addEventListener("click", () => state.graphController?.fullscreen?.() || toggleGraphFullscreen?.());
    document.querySelector("#close-right-panel")?.addEventListener("click", () => hideRightPanel?.());
    els.graphSearchToggle?.addEventListener("click", () => toggleGraphSearch());
    els.projectSwitcherToggle?.addEventListener("click", toggleProjectMenu);
    document.querySelector("#open-import")?.addEventListener("click", showDropOverlay);
    document.querySelector("#export-all")?.addEventListener("click", exportAll);
    document.querySelector("#export-current")?.addEventListener("click", exportSelected);
    document.querySelector("#open-schema-admin")?.addEventListener("click", () => openSchemaAdmin?.());
    document.querySelector("#close-schema-admin")?.addEventListener("click", closeSchemaAdmin);
    document.querySelector("#save-schema")?.addEventListener("click", saveSchemaDraft);
    document.querySelector("#reset-schema")?.addEventListener("click", resetSchemaDraft);
    state.schemaAdminController?.bindControls?.();
    document.querySelector("#toggle-avatars")?.addEventListener("click", toggleAvatars);
    document.querySelector("#toggle-drawer")?.addEventListener("click", toggleDrawer);
    els.activityButton?.addEventListener("click", openActivityPanel);
    document.querySelector("#close-activity")?.addEventListener("click", closeActivityPanel);
    state.profileController?.bindControls?.();
    document.addEventListener("click", (event) => state.gamificationController?.handleWidgetAction?.(event));
    document.querySelector("#clear-local")?.addEventListener("click", clearLocalData);
    els.googleLogin?.addEventListener("click", toggleGoogleAccount);
    els.realtimeSwitch?.addEventListener("change", (event) => toggleRealtimeMode?.(event.target.checked));
    document.querySelector("#close-emoji-picker")?.addEventListener("click", closeEmojiPicker);
    setupNativeEmojiPicker?.();
    document.querySelectorAll("[data-theme-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        localStorage.setItem(themeKey, JSON.stringify(button.dataset.themeChoice));
        applyTheme?.(button.dataset.themeChoice);
        renderThemeChoice?.();
      });
    });
    els.packInput?.addEventListener("change", (event) => importUserFiles?.([...event.target.files]));
    els.search?.addEventListener("input", (event) => runGraphSearch?.(event.target.value));
    els.search?.addEventListener("keydown", handleGraphSearchKeydown);
    els.clearSearch?.addEventListener("click", clearSearch);
    document.addEventListener("click", handleSmartLinkClick);
    document.addEventListener("pointerover", handleSmartLinkHover);
    document.addEventListener("focusin", handleSmartLinkFocus);
    document.querySelector("#close-link-embed")?.addEventListener("click", closeLinkEmbed);
    bindTabs();
    bindActivityTabs();
    bindDragAndDrop();
    renderTypeFilters?.();
    renderProfileButton?.();
    renderConnectionStatus?.();
  }

  function handleMobileMenuClick(event) {
    const button = event.target.closest("button");
    if (button && !button.hasAttribute("data-expand-presence")) closeMobileMenu();
  }

  function handleDocumentPointerDown(event) {
    if (els.topbar?.classList.contains("menu-open") && !els.topbar.contains(event.target)) closeMobileMenu();
    if (els.projectSwitcherMenu && !event.target.closest(".project-switcher-wrap")) closeProjectMenu();
    if (els.graphSearchPopover && !event.target.closest("#graph-search-popover") && !event.target.closest("#graph-search-toggle")) closeGraphSearch();
    if (els.typeFilters && !event.target.closest("#type-filters") && !event.target.closest("#filter-menu-toggle")) closeFilterMenu();
    if (els.graphHelpPopover && !event.target.closest("#graph-help-popover") && !event.target.closest("#graph-help-toggle")) closeGraphHelp();
    if (!event.target.closest("#emoji-picker-popover") && !event.target.closest("[data-reaction-picker]")) closeEmojiPicker?.();
    if (!event.target.closest("#link-preview-popover") && !event.target.closest("[data-smart-link]")) closeLinkPreview?.();
  }

  function handleDocumentKeydown(event) {
    if (event.key === "Escape") {
      closeMobileMenu();
      closeProjectMenu();
      closeGraphSearch();
      closeFilterMenu();
      closeGraphHelp();
      closeEmojiPicker?.();
      closeSchemaAdmin?.();
      closeLinkPreview?.();
      closeLinkEmbed?.();
      return;
    }
    if ((event.key === "/" && !isTextInputActive?.()) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) {
      event.preventDefault();
      openGraphSearch();
    }
  }

  function handleResize() {
    if (window.innerWidth > 900) closeMobileMenu();
    state.presenceController?.renderStrip?.();
    closeEmojiPicker?.();
    positionOpenToolbarPopover();
  }

  function bindTabs() {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        state.activeTab = tab.dataset.tab;
        state.replyTo = null;
        document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
        if (!state.selectedId && state.currentDiscussionEntityId?.startsWith(`${overviewContextPrefix}:`)) {
          if (state.activeTab === "overview") renderOverviewMetaDetails?.();
          else renderDiscussion?.(getOverviewDiscussionEntity?.());
        } else {
          renderRightPanel?.();
        }
        updateDeepLink?.();
      });
    });
  }

  function bindActivityTabs() {
    document.querySelectorAll("[data-activity-tab]").forEach((tab) => {
      tab.addEventListener("click", () => {
        state.activityTab = tab.dataset.activityTab;
        document.querySelectorAll("[data-activity-tab]").forEach((item) => item.classList.toggle("active", item === tab));
        renderActivityPanel?.();
      });
    });
  }

  function bindDragAndDrop() {
    document.addEventListener("dragenter", (event) => {
      if (!isFileDrag?.(event)) return;
      event.preventDefault();
      showDropOverlay?.();
    });
    document.addEventListener("dragover", (event) => {
      if (isFileDrag?.(event)) event.preventDefault();
    });
    document.addEventListener("drop", async (event) => {
      if (!isFileDrag?.(event)) return;
      event.preventDefault();
      const files = [...event.dataTransfer.files];
      els.dropOverlay?.classList.add("hidden");
      await importUserFiles?.(files);
    });
    els.dropOverlay?.addEventListener("click", (event) => {
      if (event.target === els.dropOverlay) els.dropOverlay.classList.add("hidden");
    });
  }

  function toggleMobileMenu() {
    const open = !els.topbar?.classList.contains("menu-open");
    els.topbar?.classList.toggle("menu-open", open);
    els.mobileMenuToggle?.setAttribute("aria-expanded", String(open));
    els.mobileMenuToggle?.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    const icon = els.mobileMenuToggle?.querySelector("i");
    if (icon) icon.textContent = open ? "close" : "menu";
  }

  function closeMobileMenu() {
    if (!els.topbar?.classList.contains("menu-open")) return;
    els.topbar.classList.remove("menu-open");
    els.mobileMenuToggle?.setAttribute("aria-expanded", "false");
    els.mobileMenuToggle?.setAttribute("aria-label", "Ouvrir le menu");
    const icon = els.mobileMenuToggle?.querySelector("i");
    if (icon) icon.textContent = "menu";
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
    syncToolbarActiveStates?.();
    if (open) requestAnimationFrame(() => positionToolbarPopover(els.typeFilters, els.filterMenuToggle));
  }

  function closeFilterMenu() {
    els.typeFilters?.classList.add("hidden");
    els.filterMenuToggle?.setAttribute("aria-expanded", "false");
    syncToolbarActiveStates?.();
  }

  function toggleProjectMenu() {
    state.projectSwitcherController?.toggleMenu?.();
  }

  function closeProjectMenu() {
    state.projectSwitcherController?.closeMenu?.();
  }

  function toggleGraphSearch() {
    state.searchController?.toggle?.();
  }

  function openGraphSearch() {
    state.searchController?.open?.();
  }

  function closeGraphSearch() {
    state.searchController?.close?.();
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
    syncToolbarActiveStates?.();
    if (open) requestAnimationFrame(() => positionToolbarPopover(els.graphHelpPopover, els.graphHelpToggle));
  }

  function closeGraphHelp() {
    els.graphHelpPopover?.classList.add("hidden");
    els.graphHelpToggle?.setAttribute("aria-expanded", "false");
    syncToolbarActiveStates?.();
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

  return {
    mount,
    toggleMobileMenu,
    closeMobileMenu,
    toggleFilterMenu,
    closeFilterMenu,
    toggleProjectMenu,
    closeProjectMenu,
    toggleGraphSearch,
    openGraphSearch,
    closeGraphSearch,
    toggleGraphHelp,
    closeGraphHelp,
    positionOpenToolbarPopover,
    positionToolbarPopover
  };
}
