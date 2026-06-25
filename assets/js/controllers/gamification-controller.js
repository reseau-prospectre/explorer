import {
  getGamificationViewModel,
  renderGamificationCard as renderGamificationCardView
} from "../ui/gamification-view.js";

export function createGamificationController({
  els,
  state,
  cycleSeconds,
  idleLimit = 60000,
  clickCap = 60,
  points = {},
  panelManager,
  getScores,
  showToast,
  windowBridge,
  externalWindowRef = () => state.externalWindow,
  documentRef = document,
  windowRef = window,
  performanceRef = performance,
  requestAnimationFrameRef = (callback) => windowRef.requestAnimationFrame(callback),
  cancelAnimationFrameRef = (frame) => windowRef.cancelAnimationFrame(frame)
}) {
  function mount() {
    const markActivity = () => {
      state.gamification.lastInteractionAt = Date.now();
    };
    documentRef.addEventListener("pointerdown", (event) => {
      markActivity();
      if (event.target.closest("#app")) recordHeartEvent("click", points.click);
    }, { capture: true });
    documentRef.addEventListener("keydown", markActivity, { capture: true });
    documentRef.addEventListener("wheel", markActivity, { capture: true, passive: true });
    documentRef.addEventListener("visibilitychange", () => {
      if (documentRef.hidden) pauseVisual();
      else renderCard();
    });
    clearInterval(state.gamification.tickTimer);
    state.gamification.tickTimer = windowRef.setInterval(tickCycle, 1000);
  }

  function renderCard() {
    if (!els.gamificationCard) return;
    const online = state.realtimeStatus === "firebase";
    const active = isActive();
    const cycle = state.gamification.cycle;
    const { globalScore, projectScore } = getScores();
    const viewModel = getGamificationViewModel({
      online,
      active,
      globalScore,
      projectScore,
      cycle,
      cycleSeconds
    });
    if (state.gamification.lastRenderSignature !== viewModel.signature) {
      state.gamification.lastRenderSignature = viewModel.signature;
      els.gamificationCard.innerHTML = renderGamificationCardView({
        ...viewModel,
        cycle,
        cycleSeconds
      });
    }
    updateCounters({ globalScore, projectScore, cyclePoints: cycle.points });
    syncVisual({ online, active, progress: viewModel.progress, cyclePoints: cycle.points });
  }

  function handleWidgetAction(event) {
    const menuButton = event.target.closest("[data-widget-menu]");
    if (menuButton) {
      event.preventDefault();
      event.stopPropagation();
      const actions = menuButton.closest(".heart-actions");
      const menu = actions?.querySelector(".heart-menu-popover");
      const open = Boolean(menu?.hidden);
      closeWidgetMenus();
      if (menu) {
        menu.hidden = !open;
        menuButton.setAttribute("aria-expanded", String(open));
      }
      return;
    }
    const button = event.target.closest("[data-external-widget]");
    if (!button) {
      if (!event.target.closest(".heart-actions")) closeWidgetMenus();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const widgetId = button.dataset.externalWidget;
    if (!widgetId) return;
    closeWidgetMenus();
    windowBridge()?.openExternal({ kind: "panel", panelId: widgetId, title: "PROSPECTRE — Coprésence" });
  }

  function closeWidgetMenus() {
    documentRef.querySelectorAll(".heart-menu-popover").forEach((item) => {
      item.hidden = true;
      item.previousElementSibling?.setAttribute("aria-expanded", "false");
    });
  }

  function updateCounters(values) {
    animateCounter("global", values.globalScore);
    animateCounter("project", values.projectScore);
    animateCounter("cycle", values.cyclePoints);
  }

  function animateCounter(name, target) {
    const element = els.gamificationCard?.querySelector(`[data-heart-counter="${name}"]`);
    if (!element) return;
    const key = name === "global" ? "totalHearts" : name === "project" ? "projectHearts" : "cycleHearts";
    const start = Number(state.gamification.shownTotals[key] || 0);
    const end = Number(target || 0);
    state.gamification.shownTotals[key] = end;
    if (start === end) {
      element.textContent = String(end);
      return;
    }
    const started = performanceRef.now();
    const duration = 520;
    const step = (now) => {
      if (!documentRef.body.contains(element)) return;
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      element.textContent = String(Math.round(start + (end - start) * eased));
      if (t < 1) requestAnimationFrameRef(step);
    };
    requestAnimationFrameRef(step);
  }

  function syncVisual({ online, active, progress, cyclePoints }) {
    const reactor = els.gamificationCard?.querySelector(".heart-reactor");
    const layout = panelManager()?.getLayout?.() || {};
    const visibleInPanel = Boolean(layout.profile?.open || layout.gamification?.open || externalWindowRef()?.panelId === "gamification");
    const shouldRun = Boolean(online && reactor && visibleInPanel && !documentRef.hidden);
    if (!shouldRun) {
      pauseVisual();
      return;
    }
    if (!state.gamification.view || state.gamification.view.element !== reactor) {
      state.gamification.view?.destroy();
      state.gamification.view = new GamificationHeartView(reactor, {
        requestAnimationFrameRef,
        cancelAnimationFrameRef
      });
    }
    state.gamification.view.update({ active, progress, intensity: 0.72 + Math.min(0.5, cyclePoints / 420) });
    state.gamification.view.start();
  }

  function pauseVisual() {
    state.gamification.view?.stop();
  }

  function isActive() {
    return state.realtimeStatus === "firebase"
      && !documentRef.hidden
      && Date.now() - state.gamification.lastInteractionAt <= idleLimit;
  }

  function tickCycle() {
    if (!isActive()) {
      renderCard();
      return;
    }
    recordHeartEvent("second", points.second, { skipRender: true });
    state.gamification.cycle.activeSeconds += 1;
    if (state.gamification.cycle.activeSeconds >= cycleSeconds) {
      commitCycle();
    } else {
      renderCard();
    }
  }

  function recordHeartEvent(type, value = 0, options = {}) {
    if (state.realtimeStatus !== "firebase" || !value) return;
    if (type === "click" && state.gamification.cycle.breakdown.click >= clickCap) return;
    state.gamification.cycle.points += value;
    state.gamification.cycle.breakdown[type] = (state.gamification.cycle.breakdown[type] || 0) + value;
    if (!options.skipRender) renderCard();
  }

  async function commitCycle() {
    if (state.gamification.committing) return;
    const cycle = state.gamification.cycle;
    if (!cycle.points) {
      state.gamification.cycle = createEmptyHeartCycle();
      renderCard();
      return;
    }
    state.gamification.committing = true;
    const payload = {
      id: cycle.id,
      points: cycle.points,
      activeSeconds: cycle.activeSeconds,
      breakdown: { ...cycle.breakdown },
      startedAt: cycle.startedAt,
      endedAt: Date.now(),
      projectId: state.projectManifest?.id || state.datasetId,
      projectVersion: state.projectManifest?.version || null
    };
    try {
      await state.provider?.commitHeartCycle?.(payload);
      showToast?.(`Merci pour ces ${cycleSeconds}s d’attention 🫶 \n❤️➕${payload.points}`);
      state.gamification.cycle = createEmptyHeartCycle();
    } catch (error) {
      if (error?.partial) {
        showToast?.("💓 partiellement synchronisés · correction au prochain cycle");
      } else {
        showToast?.("💓 non synchronisés · vérifiez la synchronisation des cycles");
      }
      state.gamification.cycle = createEmptyHeartCycle();
    } finally {
      state.gamification.committing = false;
      renderCard();
    }
  }

  function resetCycle() {
    state.gamification.cycle = createEmptyHeartCycle();
    state.gamification.lastInteractionAt = Date.now();
    state.gamification.committing = false;
    renderCard();
  }

  return {
    mount,
    renderCard,
    handleWidgetAction,
    pauseVisual,
    isActive,
    tickCycle,
    recordHeartEvent,
    commitCycle,
    resetCycle
  };
}

export function createEmptyHeartCycle() {
  return {
    id: crypto.randomUUID(),
    startedAt: Date.now(),
    activeSeconds: 0,
    points: 0,
    breakdown: {
      second: 0,
      click: 0,
      reaction: 0,
      reply: 0,
      comment: 0,
      linkPreview: 0,
      linkOpen: 0,
      linkCopy: 0,
      linkEmbed: 0
    }
  };
}

class GamificationHeartView {
  constructor(element, { requestAnimationFrameRef, cancelAnimationFrameRef }) {
    this.element = element;
    this.requestAnimationFrame = requestAnimationFrameRef;
    this.cancelAnimationFrame = cancelAnimationFrameRef;
    this.frame = null;
    this.lastFrame = 0;
    this.progress = 0;
    this.active = false;
    this.intensity = 0.8;
  }

  update({ active, progress, intensity }) {
    this.active = Boolean(active);
    this.progress = progress || 0;
    this.intensity = intensity || 0.8;
  }

  start() {
    if (this.frame) return;
    const loop = (now) => {
      this.frame = this.requestAnimationFrame(loop);
      if (now - this.lastFrame < 33) return;
      this.lastFrame = now;
      this.render(now);
    };
    this.frame = this.requestAnimationFrame(loop);
  }

  stop() {
    if (!this.frame) return;
    this.cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  resize() {
  }

  render(now) {
    if (!this.element) return;
    const t = now / 1000;
    const beat = this.active ? 0.5 + Math.sin(t * 3.4) * 0.5 : 0.18 + Math.sin(t * 1.25) * 0.12;
    const drift = Math.sin(t * 0.8) * 0.5 + 0.5;
    this.element.style.setProperty("--beat", beat.toFixed(3));
    this.element.style.setProperty("--drift", drift.toFixed(3));
    this.element.style.setProperty("--intensity", this.intensity.toFixed(3));
    this.element.style.setProperty("--progress", String(this.progress));
    this.element.classList.toggle("is-active", this.active);
  }

  destroy() {
    this.stop();
    this.element = null;
  }
}
