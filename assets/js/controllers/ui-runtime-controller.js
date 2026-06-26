export function createUiRuntimeController({
  els,
  state,
  renderToast,
  relativeTimeMarkupView,
  formatRelativeTimeView,
  updateVisibleGraph,
  resolvePalette,
  dayjsRef = () => window.dayjs,
  documentRef = document,
  windowRef = window
} = {}) {
  const knownPhases = new Set(["boot", "project-loading", "ready", "transition", "error"]);

  function setupGlobalTooltips() {
    const show = (target) => {
      const source = target?.querySelector?.(":scope > .tooltip");
      if (!source?.textContent.trim()) return;
      hideGlobalTooltip();
      const tooltip = documentRef.createElement("div");
      tooltip.className = "global-tooltip";
      tooltip.textContent = source.textContent.trim();
      documentRef.body.append(tooltip);
      const rect = target.getBoundingClientRect();
      const tipRect = tooltip.getBoundingClientRect();
      const prefersLeft = source.classList.contains("left");
      const prefersTop = source.classList.contains("top");
      let left = prefersLeft ? rect.left - tipRect.width - 8 : rect.left + (rect.width - tipRect.width) / 2;
      let top = prefersTop ? rect.top - tipRect.height - 8 : rect.bottom + 8;
      if (source.classList.contains("bottom")) top = rect.bottom + 8;
      left = Math.max(8, Math.min(windowRef.innerWidth - tipRect.width - 8, left));
      top = Math.max(8, Math.min(windowRef.innerHeight - tipRect.height - 8, top));
      tooltip.style.left = `${Math.round(left)}px`;
      tooltip.style.top = `${Math.round(top)}px`;
      state.globalTooltip = tooltip;
    };
    documentRef.addEventListener("pointerover", (event) => {
      const target = event.target.closest("button, .edit-toggle, .presence-top-chip");
      if (target && !target.contains(event.relatedTarget)) show(target);
    });
    documentRef.addEventListener("pointerout", (event) => {
      const target = event.target.closest("button, .edit-toggle, .presence-top-chip");
      if (target && !target.contains(event.relatedTarget)) hideGlobalTooltip();
    });
    documentRef.addEventListener("focusin", (event) => show(event.target.closest("button, .edit-toggle, .presence-top-chip")));
    documentRef.addEventListener("focusout", hideGlobalTooltip);
  }

  function hideGlobalTooltip() {
    state.globalTooltip?.remove();
    state.globalTooltip = null;
  }

  function applyTheme(theme, options = {}) {
    const resolved = theme === "system"
      ? (windowRef.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
      : theme;
    documentRef.documentElement.dataset.theme = resolved;
    state.appStore?.dispatch({ type: "state:patch", scope: "theme", patch: { theme: resolved } });
    if (options.broadcast !== false) state.windowBridge?.publish("theme:set", { theme });
    if (state.graphView) updateVisibleGraph?.();
  }

  function applyPalette(preference = { mode: "random" }, options = {}) {
    const resolved = resolvePalette?.(preference) || { mode: "random", presetId: "random", colors: [] };
    const root = documentRef.documentElement;
    root.dataset.palette = resolved.presetId || resolved.mode || "random";
    root.dataset.paletteMode = resolved.mode || "random";
    resolved.colors.forEach((color, index) => {
      root.style.setProperty(`--ps-palette-${index + 1}`, color);
    });
    state.palette = {
      mode: resolved.mode,
      presetId: resolved.presetId,
      label: resolved.label,
      colors: [...resolved.colors]
    };
    state.appStore?.dispatch({ type: "state:patch", scope: "theme", patch: { palette: state.palette } });
    if (options.broadcast !== false) state.windowBridge?.publish("palette:set", state.palette);
  }

  function setupRelativeTimes() {
    windowRef.setInterval(updateRelativeTimes, 30000);
  }

  function updateRelativeTimes(root = documentRef) {
    root.querySelectorAll("[data-relative-time]").forEach((element) => {
      element.textContent = formatRelativeTime(Number(element.dataset.relativeTime));
    });
  }

  function relativeTimeMarkup(timestamp, tag = "span") {
    return relativeTimeMarkupView(timestamp, tag, { dayjs: dayjsRef() });
  }

  function formatRelativeTime(timestamp) {
    return formatRelativeTimeView(timestamp, { dayjs: dayjsRef() });
  }

  function showToast(message, options = {}) {
    if (!els.toast) return;
    const tone = options.tone || inferToastTone(message);
    els.toast.className = `toast ps-toast ps-toast--${tone}`;
    els.toast.innerHTML = renderToast(message, { ...options, tone });
    els.toast.classList.remove("hidden");
    els.toast.querySelector(".toast-close")?.addEventListener("click", hideToast, { once: true });
    els.toast.querySelector(".toast-progress")?.addEventListener("animationend", hideToast, { once: true });
    clearTimeout(state.toastTimer);
    const duration = options.duration ?? (tone === "loading" ? 6200 : 4200);
    state.toastTimer = windowRef.setTimeout(hideToast, duration);
  }

  function hideToast() {
    clearTimeout(state.toastTimer);
    els.toast?.classList.add("hidden");
  }

  function reportLoading(scope, detail = "") {
    const suffix = detail ? ` · ${detail}` : "";
    showToast(`Initialisation · ${scope}${suffix}`, { tone: "loading", icon: "progress_activity" });
  }

  function setLoadingPhase(phase = "ready", options = {}) {
    const normalized = knownPhases.has(phase) ? phase : "ready";
    const busy = normalized !== "ready" && normalized !== "error";
    const root = documentRef.documentElement;
    const shell = documentRef.querySelector("#app");
    root.dataset.appPhase = normalized;
    if (shell) {
      shell.dataset.appPhase = normalized;
      shell.setAttribute("aria-busy", String(busy));
    }
    state.loadingPhase = {
      phase: normalized,
      message: options.message || "",
      progress: normalizeProgress(options.progress),
      scope: options.scope || "app"
    };
    state.appStore?.dispatch({
      type: "state:patch",
      scope: "ui",
      patch: { loadingPhase: state.loadingPhase }
    });
  }

  function normalizeProgress(progress) {
    if (progress == null || Number.isNaN(Number(progress))) return null;
    return Math.max(0, Math.min(100, Math.round(Number(progress))));
  }

  function inferToastTone(message = "") {
    return /erreur|impossible|indisponible|incomplet|annul/i.test(message)
      ? "danger"
      : /chargement|initialisation|activation|import|export/i.test(message)
        ? "loading"
        : "info";
  }

  return {
    setupGlobalTooltips,
    hideGlobalTooltip,
    applyTheme,
    applyPalette,
    setupRelativeTimes,
    updateRelativeTimes,
    relativeTimeMarkup,
    formatRelativeTime,
    showToast,
    reportLoading,
    setLoadingPhase,
    hideToast
  };
}
