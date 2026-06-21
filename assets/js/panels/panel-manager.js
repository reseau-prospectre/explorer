import { icon, iconMarkup, panelEdgeIcon } from "../ui/icons.js";

const EDGES = ["left", "right", "top", "bottom"];
const DOCK_ZONES = [...EDGES, "center"];
const RESIZE_DIRECTIONS = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];
const MOBILE_QUERY = "(max-width: 760px)";

export class PanelManager {
  constructor({ host, store, windowBridge, onLayoutChange } = {}) {
    this.host = host;
    this.store = store;
    this.windowBridge = windowBridge;
    this.onLayoutChange = onLayoutChange;
    this.registry = new Map();
    this.active = new Map();
    this.session = null;
    this.mobileQuery = window.matchMedia(MOBILE_QUERY);
    this.host?.classList.add("adaptive-panel-host", "adaptive-panel-host--v3");
    this.onKeyDown = (event) => {
      if (event.key === "Escape" && this.cancelInteraction()) event.preventDefault();
    };
    this.onViewportChange = () => this.renderAll();
    document.addEventListener("keydown", this.onKeyDown, true);
    this.mobileQuery.addEventListener?.("change", this.onViewportChange);
    window.addEventListener("resize", this.onViewportChange, { passive: true });
  }

  register(config) {
    this.registry.set(config.id, config);
  }

  open(id, context = {}) {
    const config = this.registry.get(id);
    if (!config || !this.host) return;
    const record = this.active.get(id) || {};
    record.context = context;
    this.active.set(id, record);
    this.render(id);
    this.emitLayoutChange(id);
  }

  close(id) {
    const record = this.active.get(id);
    if (!record) return;
    this.cancelInteraction();
    record.element?.remove();
    this.active.delete(id);
    this.registry.get(id)?.onClose?.();
    this.emitLayoutChange(id);
  }

  toggle(id, context = {}) {
    this.active.has(id) ? this.close(id) : this.open(id, context);
  }

  update(id, patch = {}) {
    const config = this.registry.get(id);
    if (!config) return;
    Object.assign(config, patch);
    if (this.active.has(id)) this.render(id);
  }

  dock(id, edge = "right") {
    this.cancelInteraction();
    this.savePreferences(id, { mode: "dock", edge, external: false });
    if (this.active.has(id)) this.render(id);
    this.emitLayoutChange(id);
  }

  float(id) {
    const rect = this.getCenteredFloatRect(id);
    this.savePreferences(id, {
      mode: "float",
      external: false,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      size: rect.width
    });
    if (this.active.has(id)) this.render(id);
    this.emitLayoutChange(id);
  }

  getCenteredFloatRect(id) {
    const prefs = this.getPreferences(id);
    const topbar = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar-height")) || 74;
    const sideMargin = window.innerWidth < 860 ? 16 : 28;
    const verticalMargin = window.innerHeight < 720 ? 14 : 24;
    const availableWidth = Math.max(320, window.innerWidth - sideMargin * 2);
    const availableHeight = Math.max(280, window.innerHeight - topbar - verticalMargin * 2);
    const targetWidth = clamp(
      Math.round(Math.max(prefs.width || prefs.size || 520, window.innerWidth * 0.42)),
      Math.min(360, availableWidth),
      Math.min(availableWidth, 760)
    );
    const targetHeight = clamp(
      Math.round(Math.max(prefs.height || 520, window.innerHeight * 0.56)),
      Math.min(320, availableHeight),
      Math.min(availableHeight, 680)
    );
    return {
      x: Math.round(clamp((window.innerWidth - targetWidth) / 2, sideMargin, window.innerWidth - targetWidth - sideMargin)),
      y: Math.round(clamp(topbar + (window.innerHeight - topbar - targetHeight) / 2, topbar + verticalMargin, window.innerHeight - targetHeight - verticalMargin)),
      width: Math.round(targetWidth),
      height: Math.round(targetHeight)
    };
  }

  externalize(id) {
    const config = this.registry.get(id);
    if (!config?.canExternalize) return;
    this.savePreferences(id, { mode: "external", external: true });
    this.windowBridge?.openExternal({ kind: "panel", panelId: id, title: config.title || id });
    this.close(id);
    this.emitLayoutChange(id);
  }

  restore(id) {
    const prefs = this.getPreferences(id);
    this.savePreferences(id, { mode: prefs.edge ? "dock" : "float", external: false });
    this.open(id);
  }

  toggleMode(id) {
    const prefs = this.getPreferences(id);
    if (this.isMobile()) return;
    prefs.mode === "float" ? this.dock(id, prefs.edge || "right") : this.float(id);
  }

  toggleCollapsed(id) {
    const prefs = this.getPreferences(id);
    this.savePreferences(id, { collapsed: !prefs.collapsed });
    if (this.active.has(id)) this.render(id);
    this.emitLayoutChange(id);
  }

  getPreferences(id) {
    const statePrefs = this.store?.getState?.().ui?.panels?.[id] || {};
    return normalizePreferences({ ...this.registry.get(id)?.defaultPrefs, ...statePrefs });
  }

  savePreferences(id, patch) {
    this.store?.dispatch?.({ type: "ui:panelPrefs", id, patch: normalizePreferences({ ...this.getPreferences(id), ...patch }) });
  }

  resetPreferences(id) {
    const config = this.registry.get(id);
    if (!config) return;
    this.store?.dispatch?.({ type: "ui:panelPrefs", id, patch: normalizePreferences(config.defaultPrefs || {}) });
    if (this.active.has(id)) this.render(id);
  }

  resetAllPreferences() {
    for (const id of this.registry.keys()) this.resetPreferences(id);
    this.emitLayoutChange();
  }

  getLayout() {
    const layout = {};
    for (const [id] of this.active) {
      const prefs = this.getPreferences(id);
      layout[id] = {
        open: true,
        ...prefs,
        mode: this.isMobile() ? "sheet" : prefs.mode
      };
    }
    return layout;
  }

  getLayoutState() {
    return this.getLayout();
  }

  renderAll() {
    for (const id of this.active.keys()) this.render(id);
    this.emitLayoutChange();
  }

  render(id) {
    const config = this.registry.get(id);
    const record = this.active.get(id);
    if (!config || !record || !this.host) return;
    const prefs = this.getPreferences(id);
    const mobile = this.isMobile();
    const mode = mobile ? "sheet" : prefs.mode === "external" ? "float" : prefs.mode || "dock";
    const edge = mobile ? "bottom" : prefs.edge || "right";
    const collapsed = Boolean(prefs.collapsed && mode === "dock");
    const previous = record.element;
    const panel = document.createElement("section");
    panel.className = [
      "adaptive-panel",
      "adaptive-panel--v3",
      `adaptive-panel--${mode}`,
      `adaptive-panel--${edge}`,
      mode === "float" ? "is-grabbable" : "",
      collapsed ? "is-collapsed" : "",
      config.className || ""
    ].filter(Boolean).join(" ");
    panel.dataset.panelId = id;
    panel.style.setProperty("--adaptive-panel-size", `${prefs.size}px`);
    panel.style.setProperty("--adaptive-panel-width", `${prefs.width}px`);
    panel.style.setProperty("--adaptive-panel-height", `${prefs.height}px`);
    panel.style.setProperty("--adaptive-panel-x", `${prefs.x}px`);
    panel.style.setProperty("--adaptive-panel-y", `${prefs.y}px`);
    panel.setAttribute("role", mobile ? "dialog" : "region");
    panel.setAttribute("aria-label", config.title || id);
    panel.innerHTML = this.renderShell(config, id, mode, edge, collapsed);
    const body = panel.querySelector(".adaptive-panel__body");
    const content = config.render?.(record.context, { panel, prefs }) || config.renderBody?.(record.context, { panel, prefs }) || "";
    if (content instanceof Node) body.append(content);
    else body.innerHTML = content;
    previous?.replaceWith(panel);
    if (!previous) this.host.append(panel);
    record.element = panel;
    this.bindPanel(panel, id);
    this.ensureDockZones();
  }

  renderShell(config, id, mode, edge, collapsed) {
    const canCollapse = Boolean(config.collapsible);
    const canExternalize = Boolean(config.canExternalize);
    const edgeMenuId = `${id}-edge-options`;
    const overflowId = `${id}-panel-actions`;
    const primary = mode === "float"
      ? toolButton("dock", "Ancrer", "data-panel-edge-menu", `aria-controls="${edgeMenuId}" aria-expanded="false"`)
      : canCollapse
        ? toolButton(collapsed ? "restore" : "collapse", collapsed ? "Déplier" : "Replier", `data-panel-collapse="${id}"`)
        : toolButton("detach", "Détacher", `data-panel-mode="${id}"`);
    const title = config.headerSlot === "insights"
      ? `<div class="adaptive-panel__title adaptive-panel__title--slot" data-panel-title-slot="insights"></div>`
      : `<div class="adaptive-panel__title">
          ${config.badge ? `<span class="adaptive-panel__badge" style="--badge-color:${escapeHtml(config.badge.color || "var(--accent)")};"><i></i>${escapeHtml(config.badge.label || "")}</span>` : ""}
          <h2>${escapeHtml(config.title || id)}</h2>
        </div>`;
    return `
      <header class="adaptive-panel__header" data-panel-grab>
        ${title}
        <div class="adaptive-panel__tools">
          <div class="adaptive-panel__edge-menu">
            ${primary}
            <div id="${edgeMenuId}" class="adaptive-panel__edge-options" hidden>
              ${EDGES.map((item) => `<button type="button" data-panel-edge="${item}" aria-label="${edgeTooltip(item)}" class="${item === edge && mode !== "float" ? "is-active" : ""}"><i aria-hidden="true">${panelEdgeIcon(item)}</i><span>${edgeShortLabel(item)}</span><span class="tooltip left">${edgeTooltip(item)}</span></button>`).join("")}
            </div>
          </div>
          <div class="adaptive-panel__overflow">
            ${toolButton("more_vert", "Actions", "data-panel-overflow", `aria-controls="${overflowId}" aria-expanded="false"`)}
            <div id="${overflowId}" class="adaptive-panel__overflow-menu" hidden>
              ${mode !== "float" ? menuButton("detach", "Détacher", `data-panel-mode="${id}"`) : ""}
              ${canExternalize ? menuButton("externalWindow", "Ouvrir en popup", `data-panel-externalize="${id}"`) : ""}
              ${canCollapse && mode === "float" ? menuButton(collapsed ? "restore" : "collapse", collapsed ? "Déplier" : "Replier", `data-panel-collapse="${id}"`) : ""}
              <p>Ancrage</p>
              <div class="adaptive-panel__overflow-edges">
                ${EDGES.map((item) => `<button type="button" data-panel-edge="${item}" aria-label="${edgeTooltip(item)}" class="${item === edge && mode !== "float" ? "is-active" : ""}"><i aria-hidden="true">${panelEdgeIcon(item)}</i><span>${edgeShortLabel(item)}</span></button>`).join("")}
              </div>
            </div>
          </div>
          ${toolButton("close", "Fermer", `data-panel-close="${id}"`)}
        </div>
      </header>
      <div class="adaptive-panel__body"></div>
      <div class="adaptive-panel__resize-rail adaptive-panel__resize-rail--horizontal" aria-hidden="true"></div>
      <div class="adaptive-panel__resize-rail adaptive-panel__resize-rail--vertical" aria-hidden="true"></div>
      ${RESIZE_DIRECTIONS.map((direction) => `<button class="adaptive-panel__resize adaptive-panel__resize--${direction}" type="button" data-panel-resize="${direction}" aria-label="Redimensionner"></button>`).join("")}
      ${RESIZE_DIRECTIONS.map((direction) => `<span class="adaptive-panel__handle-visual adaptive-panel__handle-visual--${direction}" aria-hidden="true"></span>`).join("")}
    `;
  }

  bindPanel(panel, id) {
    panel.querySelector("[data-panel-close]")?.addEventListener("click", () => this.close(id));
    panel.querySelector("[data-panel-mode]")?.addEventListener("click", () => this.toggleMode(id));
    panel.querySelector("[data-panel-collapse]")?.addEventListener("click", () => this.toggleCollapsed(id));
    panel.querySelector("[data-panel-externalize]")?.addEventListener("click", () => this.externalize(id));
    panel.querySelector("[data-panel-overflow]")?.addEventListener("click", (event) => {
      event.stopPropagation();
      const menu = event.currentTarget.nextElementSibling;
      const open = Boolean(menu?.hidden);
      this.closeMenus(panel);
      if (menu) menu.hidden = !open;
      event.currentTarget.setAttribute("aria-expanded", String(open));
    });
    panel.querySelector("[data-panel-edge-menu]")?.addEventListener("click", (event) => {
      event.stopPropagation();
      const options = event.currentTarget.nextElementSibling;
      const open = Boolean(options?.hidden);
      this.closeMenus(panel);
      if (options) options.hidden = !open;
      event.currentTarget.setAttribute("aria-expanded", String(open));
    });
    panel.querySelectorAll("[data-panel-edge]").forEach((button) => button.addEventListener("click", (event) => {
      event.stopPropagation();
      this.closeMenus(panel);
      this.dock(id, button.dataset.panelEdge);
    }));
    panel.addEventListener("pointerdown", (event) => {
      if (!event.target.closest(".adaptive-panel__edge-menu, .adaptive-panel__overflow")) this.closeMenus(panel);
    });
    panel.querySelector("[data-panel-grab]")?.addEventListener("pointerdown", (event) => {
      if (!panel.classList.contains("adaptive-panel--float")) return;
      if (event.target.closest("button, a, input, textarea, select, [role='button'], .adaptive-panel__tools")) return;
      this.beginInteraction(event, panel, id, "move");
    });
    panel.querySelectorAll("[data-panel-resize]").forEach((handle) => {
      handle.addEventListener("pointerdown", (event) => this.beginInteraction(event, panel, id, "resize", handle.dataset.panelResize));
    });
  }

  closeMenus(root = this.host) {
    root.querySelectorAll?.(".adaptive-panel__edge-options").forEach((options) => {
      options.hidden = true;
      options.previousElementSibling?.setAttribute("aria-expanded", "false");
    });
    root.querySelectorAll?.(".adaptive-panel__overflow-menu").forEach((menu) => {
      menu.hidden = true;
      menu.previousElementSibling?.setAttribute("aria-expanded", "false");
    });
  }

  beginInteraction(event, panel, id, operation, direction = "") {
    if (event.button !== 0 || this.session) return;
    event.preventDefault();
    const rect = panel.getBoundingClientRect();
    const target = event.currentTarget;
    this.session = {
      pointerId: event.pointerId,
      target,
      panel,
      id,
      operation,
      direction,
      previewEdge: null,
      initial: { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height }
    };
    target.setPointerCapture?.(event.pointerId);
    panel.classList.add(`is-${operation}`);
    if (operation === "move") this.host.querySelector(".adaptive-panel-dock-zones")?.classList.add("is-visible");
    this.session.move = (next) => this.updateInteraction(next);
    this.session.end = (next) => this.commitInteraction(next);
    this.session.cancel = () => this.cancelInteraction();
    target.addEventListener("pointermove", this.session.move);
    target.addEventListener("pointerup", this.session.end);
    target.addEventListener("pointercancel", this.session.cancel);
    target.addEventListener("lostpointercapture", this.session.cancel);
  }

  updateInteraction(event) {
    const session = this.session;
    if (!session || event.pointerId !== session.pointerId) return;
    const { panel, initial, operation } = session;
    if (operation === "move") {
      const x = clamp(initial.left + event.clientX - initial.x, 8, window.innerWidth - initial.width - 8);
      const y = clamp(initial.top + event.clientY - initial.y, 8, window.innerHeight - 80);
      panel.style.setProperty("--adaptive-panel-x", `${Math.round(x)}px`);
      panel.style.setProperty("--adaptive-panel-y", `${Math.round(y)}px`);
      session.previewEdge = dropZoneAt(event.clientX, event.clientY);
      this.host.querySelectorAll("[data-dock-zone]").forEach((zone) => zone.classList.toggle("is-target", zone.dataset.dockZone === session.previewEdge));
      return;
    }
    const prefs = this.getPreferences(session.id);
    const edge = prefs.edge || "right";
    const docked = panel.classList.contains("adaptive-panel--dock") || panel.classList.contains("adaptive-panel--sheet");
    const dx = event.clientX - initial.x;
    const dy = event.clientY - initial.y;
    if (this.isMobile() || (docked && ["top", "bottom"].includes(edge))) {
      const height = edge === "top" ? initial.height + dy : initial.height - dy;
      panel.style.setProperty("--adaptive-panel-size", `${Math.round(clamp(height, 160, window.innerHeight - 120))}px`);
      return;
    }
    if (docked) {
      const width = edge === "left" ? initial.width + dx : initial.width - dx;
      panel.style.setProperty("--adaptive-panel-size", `${Math.round(clamp(width, 300, window.innerWidth * 0.92))}px`);
      return;
    }
    let left = initial.left;
    let top = initial.top;
    let width = initial.width;
    let height = initial.height;
    if (session.direction.includes("e")) width = clamp(initial.width + dx, 300, window.innerWidth - initial.left - 8);
    if (session.direction.includes("s")) height = clamp(initial.height + dy, 240, window.innerHeight - initial.top - 8);
    if (session.direction.includes("w")) {
      width = clamp(initial.width - dx, 300, initial.left + initial.width - 8);
      left = initial.left + initial.width - width;
    }
    if (session.direction.includes("n")) {
      height = clamp(initial.height - dy, 240, initial.top + initial.height - 8);
      top = initial.top + initial.height - height;
    }
    panel.style.setProperty("--adaptive-panel-x", `${Math.round(left)}px`);
    panel.style.setProperty("--adaptive-panel-y", `${Math.round(top)}px`);
    panel.style.setProperty("--adaptive-panel-width", `${Math.round(width)}px`);
    panel.style.setProperty("--adaptive-panel-size", `${Math.round(width)}px`);
    panel.style.setProperty("--adaptive-panel-height", `${Math.round(height)}px`);
  }

  commitInteraction(event) {
    const session = this.session;
    if (!session || (event.pointerId !== undefined && event.pointerId !== session.pointerId)) return;
    const rect = session.panel.getBoundingClientRect();
    const prefs = this.getPreferences(session.id);
    const edge = prefs.edge || "right";
    const centerZone = session.previewEdge === "center"
      ? this.host.querySelector('[data-dock-zone="center"]')?.getBoundingClientRect()
      : null;
    const values = session.operation === "move" && session.previewEdge && session.previewEdge !== "center"
      ? { mode: "dock", edge: session.previewEdge, external: false, size: ["top", "bottom"].includes(session.previewEdge) ? Math.round(rect.height) : Math.round(rect.width) }
      : centerZone
        ? {
            mode: "float",
            external: false,
            x: Math.round(centerZone.left),
            y: Math.round(centerZone.top),
            width: Math.round(centerZone.width),
            height: Math.round(centerZone.height),
            size: Math.round(centerZone.width)
          }
        : {
            mode: session.operation === "move" ? "float" : prefs.mode,
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            size: Math.round(["top", "bottom"].includes(edge) ? rect.height : rect.width)
          };
    this.finishInteraction();
    this.savePreferences(session.id, values);
    this.render(session.id);
    this.emitLayoutChange(session.id);
  }

  cancelInteraction() {
    const session = this.session;
    if (!session) return false;
    session.panel.style.setProperty("--adaptive-panel-x", `${session.initial.left}px`);
    session.panel.style.setProperty("--adaptive-panel-y", `${session.initial.top}px`);
    session.panel.style.setProperty("--adaptive-panel-width", `${session.initial.width}px`);
    session.panel.style.setProperty("--adaptive-panel-size", `${session.initial.width}px`);
    session.panel.style.setProperty("--adaptive-panel-height", `${session.initial.height}px`);
    this.finishInteraction();
    return true;
  }

  finishInteraction() {
    const session = this.session;
    if (!session) return;
    session.target.removeEventListener("pointermove", session.move);
    session.target.removeEventListener("pointerup", session.end);
    session.target.removeEventListener("pointercancel", session.cancel);
    session.target.removeEventListener("lostpointercapture", session.cancel);
    if (session.target.hasPointerCapture?.(session.pointerId)) session.target.releasePointerCapture(session.pointerId);
    session.panel.classList.remove("is-move", "is-resize");
    this.host.querySelector(".adaptive-panel-dock-zones")?.classList.remove("is-visible");
    this.host.querySelectorAll("[data-dock-zone]").forEach((zone) => zone.classList.remove("is-target"));
    this.session = null;
  }

  ensureDockZones() {
    if (this.host.querySelector(".adaptive-panel-dock-zones")) return;
    const zones = document.createElement("div");
    zones.className = "adaptive-panel-dock-zones";
    zones.setAttribute("aria-hidden", "true");
    zones.innerHTML = DOCK_ZONES.map((edge) => `<div class="adaptive-panel-dock-zone adaptive-panel-dock-zone--${edge}" data-dock-zone="${edge}"><span>${edgeLabel(edge)}</span></div>`).join("");
    this.host.append(zones);
  }

  emitLayoutChange(id) {
    this.onLayoutChange?.(this.getLayout(), id);
    this.windowBridge?.publish("panel:update", { id, layout: this.getLayout() });
  }

  isMobile() {
    return this.mobileQuery.matches;
  }
}

function toolButton(iconName, label, dataAttrs = "", extraAttrs = "") {
  return `<button type="button" ${dataAttrs} ${extraAttrs} aria-label="${escapeHtml(label)}">${iconMarkup(iconName)}<span class="tooltip left">${escapeHtml(label)}</span></button>`;
}

function menuButton(iconName, label, dataAttrs = "") {
  return `<button type="button" ${dataAttrs}>${iconMarkup(iconName)}<span>${escapeHtml(label)}</span></button>`;
}

function normalizePreferences(prefs = {}) {
  const edge = EDGES.includes(prefs.edge) ? prefs.edge : "right";
  const horizontal = ["top", "bottom"].includes(edge);
  const size = Number(prefs.size) || (horizontal ? 300 : 430);
  return {
    mode: ["dock", "float", "external"].includes(prefs.mode) ? prefs.mode : "dock",
    edge,
    size,
    width: Number(prefs.width) || (horizontal ? 680 : size),
    height: Number(prefs.height) || (horizontal ? size : 560),
    x: Number(prefs.x) || 96,
    y: Number(prefs.y) || 92,
    collapsed: Boolean(prefs.collapsed),
    external: Boolean(prefs.external)
  };
}

function dropZoneAt(x, y) {
  const threshold = Math.min(128, Math.max(72, Math.min(window.innerWidth, window.innerHeight) * 0.11));
  if (x < threshold) return "left";
  if (x > window.innerWidth - threshold) return "right";
  if (y < threshold) return "top";
  if (y > window.innerHeight - threshold) return "bottom";
  const centerMarginX = Math.max(threshold, window.innerWidth * 0.18);
  const centerMarginY = Math.max(threshold, window.innerHeight * 0.18);
  if (x > centerMarginX && x < window.innerWidth - centerMarginX && y > centerMarginY && y < window.innerHeight - centerMarginY) {
    return "center";
  }
  return null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function edgeLabel(edge) {
  return { left: "Gauche", right: "Droite", top: "Haut", bottom: "Bas", center: "Libre" }[edge] || edge;
}

function edgeTooltip(edge) {
  return { left: "Ancrer à gauche", right: "Ancrer à droite", top: "Ancrer en haut", bottom: "Ancrer en bas" }[edge] || "Rattacher";
}

function edgeShortLabel(edge) {
  return { left: "G", right: "D", top: "H", bottom: "B" }[edge] || "";
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}
