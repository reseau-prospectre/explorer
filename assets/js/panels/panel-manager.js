import { icon, iconMarkup } from "../ui/icons.js";

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
    this.suppressNextPanelClick = "";
    this.zIndex = 0;
    this.mobileQuery = window.matchMedia(MOBILE_QUERY);
    this.host?.classList.add("adaptive-panel-host", "adaptive-panel-host--v3");
    this.onKeyDown = (event) => {
      if (event.key === "Escape" && this.cancelInteraction()) event.preventDefault();
      if (!event.defaultPrevented) this.handleMenuShortcut(event);
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
    this.focusPanel(id);
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
    const minFloatWidth = id === "insights" ? 620 : 360;
    const minFloatHeight = id === "insights" ? 380 : 320;
    const targetWidth = clamp(
      Math.round(Math.max(prefs.width || prefs.size || 520, window.innerWidth * 0.42)),
      Math.min(minFloatWidth, availableWidth),
      Math.min(availableWidth, 760)
    );
    const targetHeight = clamp(
      Math.round(Math.max(prefs.height || 520, window.innerHeight * 0.56)),
      Math.min(minFloatHeight, availableHeight),
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
    this.focusPanel(id);
    this.emitLayoutChange(id);
  }

  focusPanel(id) {
    const record = this.active.get(id);
    if (!record?.element) return;
    record.z = ++this.zIndex;
    record.element.style.setProperty("--adaptive-panel-z", String(90 + record.z));
    this.host.querySelectorAll(".adaptive-panel.is-focused").forEach((panel) => {
      if (panel !== record.element) panel.classList.remove("is-focused");
    });
    record.element.classList.add("is-focused");
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

  resetLayout(ids) {
    const targets = Array.isArray(ids) && ids.length ? ids : [...this.registry.keys()];
    for (const id of targets) this.resetPreferences(id);
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
    const collapsed = Boolean(prefs.collapsed && mode !== "sheet");
    const stackIndex = collapsed ? this.getCollapsedStackIndex(id, edge) : 0;
    const previous = record.element;
    const panel = document.createElement("section");
    panel.className = [
      "adaptive-panel",
      "adaptive-panel--v3",
      "ps-panel",
      "ps-surface",
      `adaptive-panel--${mode}`,
      `adaptive-panel--${edge}`,
      mode === "float" ? "is-grabbable" : "",
      collapsed ? "is-collapsed" : "",
      config.className || ""
    ].filter(Boolean).join(" ");
    panel.dataset.panelId = id;
    panel.style.setProperty("--adaptive-panel-collapsed-index", String(stackIndex));
    panel.style.setProperty("--adaptive-panel-collapsed-offset", `${stackIndex * 42}px`);
    panel.style.setProperty("--adaptive-panel-collapsed-inline-offset", `${stackIndex * 374}px`);
    panel.style.setProperty("--adaptive-panel-size", `${prefs.size}px`);
    panel.style.setProperty("--adaptive-panel-width", `${prefs.width}px`);
    panel.style.setProperty("--adaptive-panel-height", `${prefs.height}px`);
    panel.style.setProperty("--adaptive-panel-x", `${prefs.x}px`);
    panel.style.setProperty("--adaptive-panel-y", `${prefs.y}px`);
    if (record.z) panel.style.setProperty("--adaptive-panel-z", String(90 + record.z));
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

  getCollapsedStackIndex(id, edge) {
    let index = 0;
    for (const [otherId] of this.active) {
      if (otherId === id) return index;
      const prefs = this.getPreferences(otherId);
      const mode = this.isMobile() ? "sheet" : prefs.mode === "external" ? "float" : prefs.mode || "dock";
      if (prefs.collapsed && mode !== "sheet" && (prefs.edge || "right") === edge) index += 1;
    }
    return index;
  }

  renderShell(config, id, mode, edge, collapsed) {
    const canExternalize = Boolean(config.canExternalize);
    const edgeMenuId = `${id}-edge-options`;
    const overflowId = `${id}-panel-actions`;
    const primary = mode === "float"
      ? toolButton("dock", "Ancrer", "data-panel-edge-menu", `aria-controls="${edgeMenuId}" aria-expanded="false"`)
      : toolButton("detach", "Détacher", `data-panel-mode="${id}"`);
    const titleIcon = iconMarkup(config.icon || "panel", `class="adaptive-panel__title-icon"`);
    const dragHandle = `<button type="button" class="adaptive-panel__drag-handle" data-panel-drag-handle aria-label="Déplacer le panneau">${iconMarkup("drag")}<span class="tooltip left">Déplacer</span></button>`;
    const title = config.headerSlot === "insights"
      ? `<div class="adaptive-panel__title adaptive-panel__title--slot ps-panel__title" data-panel-title-slot="insights"></div>`
      : `<div class="adaptive-panel__title ps-panel__title">
          ${config.badge ? `<span class="adaptive-panel__badge ps-chip" style="--badge-color:${escapeHtml(config.badge.color || "var(--accent)")};"><i></i>${escapeHtml(config.badge.label || "")}</span>` : ""}
          <h2>${escapeHtml(config.title || id)}</h2>
        </div>`;
    return `
      <header class="adaptive-panel__header ps-panel__header ${collapsed ? "ps-mini-tab" : ""}" data-panel-collapse-toggle="${id}" aria-label="Basculer le panneau ${escapeHtml(config.title || id)}">
        ${dragHandle}
        <span class="adaptive-panel__identity" aria-hidden="true">${titleIcon}</span>
        ${title}
        <div class="adaptive-panel__tools ps-action-row">
          <div class="adaptive-panel__edge-menu">
            ${primary}
            <div id="${edgeMenuId}" class="adaptive-panel__edge-options" data-panel-menu-owner="${id}" hidden>
              ${EDGES.map((item) => edgeButton(item, edge, mode)).join("")}
            </div>
          </div>
          <div class="adaptive-panel__overflow">
            ${toolButton("more_vert", "Actions", "data-panel-overflow", `aria-controls="${overflowId}" aria-expanded="false"`)}
            <div id="${overflowId}" class="adaptive-panel__overflow-menu" data-panel-menu-owner="${id}" hidden>
              ${mode !== "float" ? menuButton("detach", "Détacher", `data-panel-mode="${id}"`) : ""}
              ${canExternalize ? menuButton("externalWindow", "Ouvrir en popup", `data-panel-externalize="${id}"`) : ""}
              <p>Ancrage</p>
              <div class="adaptive-panel__overflow-edges">
                ${EDGES.map((item) => edgeButton(item, edge, mode)).join("")}
              </div>
            </div>
          </div>
          ${toolButton("close", "Fermer", `data-panel-close="${id}"`)}
        </div>
      </header>
      <div class="adaptive-panel__body ps-panel__body"></div>
      <div class="adaptive-panel__resize-rail adaptive-panel__resize-rail--horizontal" aria-hidden="true"></div>
      <div class="adaptive-panel__resize-rail adaptive-panel__resize-rail--vertical" aria-hidden="true"></div>
      ${RESIZE_DIRECTIONS.map((direction) => `<button class="adaptive-panel__resize adaptive-panel__resize--${direction}" type="button" data-panel-resize="${direction}" aria-label="Redimensionner"></button>`).join("")}
      ${RESIZE_DIRECTIONS.map((direction) => `<span class="adaptive-panel__handle-visual adaptive-panel__handle-visual--${direction}" aria-hidden="true"></span>`).join("")}
    `;
  }

  bindPanel(panel, id) {
    panel.addEventListener("pointerdown", () => this.focusPanel(id), { capture: true });
    panel.querySelector("[data-panel-close]")?.addEventListener("click", () => this.close(id));
    panel.querySelector("[data-panel-mode]")?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.toggleMode(id);
    });
    panel.querySelector("[data-panel-externalize]")?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.externalize(id);
    });
    panel.querySelector("[data-panel-overflow]")?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.focusPanel(id);
      const menu = event.currentTarget.nextElementSibling;
      const open = Boolean(menu?.hidden);
      this.closeMenus(panel);
      if (menu) menu.hidden = !open;
      event.currentTarget.setAttribute("aria-expanded", String(open));
    });
    panel.querySelector("[data-panel-edge-menu]")?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.focusPanel(id);
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
    panel.querySelector("[data-panel-collapse-toggle]")?.addEventListener("click", (event) => {
      if (this.suppressNextPanelClick === id) {
        this.suppressNextPanelClick = "";
        event.preventDefault();
        return;
      }
      if (event.target.closest("button, a, input, textarea, select, [role='button'], .adaptive-panel__tools")) return;
      event.preventDefault();
      this.toggleCollapsed(id);
    });
    panel.addEventListener("pointerdown", (event) => {
      if (!event.target.closest(".adaptive-panel__edge-menu, .adaptive-panel__overflow")) this.closeMenus(panel);
    });
    panel.querySelector("[data-panel-drag-handle]")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    panel.querySelector("[data-panel-drag-handle]")?.addEventListener("pointerdown", (event) => {
      if (!panel.classList.contains("adaptive-panel--float") && !panel.classList.contains("is-collapsed")) return;
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

  handleMenuShortcut(event) {
    const menu = this.host?.querySelector?.(".adaptive-panel__edge-options:not([hidden]), .adaptive-panel__overflow-menu:not([hidden])");
    if (!menu) return;
    if (event.key === "Escape") {
      this.closeMenus(this.host);
      event.preventDefault();
      return;
    }
    const edge = shortcutEdge(event.key);
    const id = menu.dataset.panelMenuOwner;
    if (!edge || !id) return;
    event.preventDefault();
    this.closeMenus(this.host);
    this.dock(id, edge);
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
      moved: false,
      mini: panel.classList.contains("is-collapsed"),
      fromHandle: target.closest?.("[data-panel-drag-handle]") != null,
      initial: { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height }
    };
    target.setPointerCapture?.(event.pointerId);
    panel.classList.add(`is-${operation}`);
    if (operation === "move" && !this.session.mini) this.host.querySelector(".adaptive-panel-dock-zones")?.classList.add("is-visible");
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
    if (Math.abs(event.clientX - initial.x) > 4 || Math.abs(event.clientY - initial.y) > 4) session.moved = true;
    if (operation === "move") {
      const x = clamp(initial.left + event.clientX - initial.x, 8, window.innerWidth - initial.width - 8);
      const y = clamp(initial.top + event.clientY - initial.y, 8, window.innerHeight - 80);
      panel.style.setProperty("--adaptive-panel-x", `${Math.round(x)}px`);
      panel.style.setProperty("--adaptive-panel-y", `${Math.round(y)}px`);
      session.previewEdge = session.mini ? miniDropEdgeAt(event.clientX, event.clientY) : dropZoneAt(event.clientX, event.clientY);
      if (!session.mini) this.host.querySelectorAll("[data-dock-zone]").forEach((zone) => zone.classList.toggle("is-target", zone.dataset.dockZone === session.previewEdge));
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
    if (session.operation === "move" && !session.moved) {
      const id = session.id;
      this.finishInteraction();
      if (session.fromHandle) return;
      this.suppressNextPanelClick = id;
      this.toggleCollapsed(id);
      return;
    }
    const rect = session.panel.getBoundingClientRect();
    const prefs = this.getPreferences(session.id);
    const edge = prefs.edge || "right";
    const centerZone = !session.mini && session.previewEdge === "center"
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
  return `<button type="button" class="ps-icon-button" ${dataAttrs} ${extraAttrs} aria-label="${escapeHtml(label)}">${iconMarkup(iconName)}<span class="tooltip left">${escapeHtml(label)}</span></button>`;
}

function menuButton(iconName, label, dataAttrs = "") {
  return `<button type="button" class="ps-button" ${dataAttrs}>${iconMarkup(iconName)}<span>${escapeHtml(label)}</span></button>`;
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
  const centerWidth = Math.min(560, window.innerWidth * 0.38);
  const centerHeight = Math.min(340, window.innerHeight * 0.34);
  const centerLeft = (window.innerWidth - centerWidth) / 2;
  const centerTop = (window.innerHeight + (Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar-height")) || 0) - centerHeight) / 2;
  if (x > centerLeft && x < centerLeft + centerWidth && y > centerTop && y < centerTop + centerHeight) {
    return "center";
  }
  return null;
}

function miniDropEdgeAt(x, y) {
  const threshold = Math.min(118, Math.max(72, Math.min(window.innerWidth, window.innerHeight) * 0.12));
  if (y < threshold) return "top";
  if (y > window.innerHeight - threshold) return "bottom";
  if (x < threshold) return "left";
  if (x > window.innerWidth - threshold) return "right";
  return "";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function edgeLabel(edge) {
  return { left: "Gauche", right: "Droite", top: "Haut", bottom: "Bas", center: "Libre" }[edge] || edge;
}

function edgeTooltip(edge) {
  return {
    left: "Ancrer à gauche · ← / Q",
    right: "Ancrer à droite · → / D",
    top: "Ancrer en haut · ↑ / Z",
    bottom: "Ancrer en bas · ↓ / S"
  }[edge] || "Rattacher";
}

function edgeButton(edge, activeEdge, mode) {
  const active = edge === activeEdge && mode !== "float" ? "is-active" : "";
  return `<button type="button" data-panel-edge="${edge}" aria-label="${edgeTooltip(edge)}" class="${active}">${edgeIconMarkup(edge)}<span class="tooltip left">${edgeTooltip(edge)}</span></button>`;
}

function edgeIconMarkup(edge) {
  return `<i class="panel-edge-glyph panel-edge-glyph--${edge}" aria-hidden="true"></i>`;
}

function shortcutEdge(key = "") {
  return {
    ArrowLeft: "left",
    q: "left",
    Q: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
    ArrowUp: "top",
    z: "top",
    Z: "top",
    ArrowDown: "bottom",
    s: "bottom",
    S: "bottom"
  }[key] || "";
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
