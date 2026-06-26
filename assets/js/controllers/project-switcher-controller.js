import { escapeHtml, shortLabel } from "../core/utils.js";
import { createProjectNavigationHref } from "../services/project-launch.js?v=20260626-v324-library-reperes-1";
import { formatRelativeTime } from "../ui/relative-time-view.js";

const LIBRARY_TABS = Object.freeze([
  { id: "library", label: "Bibliothèque", icon: "inventory_2" },
  { id: "device", label: "Cet appareil", icon: "folder_open" },
  { id: "drive", label: "Drive", icon: "cloud", disabled: true },
  { id: "github", label: "GitHub", icon: "code", disabled: true }
]);

const COVER_FIELDS = Object.freeze(["cover", "image", "illustration", "thumbnail", "hero", "coverImage", "image_cover"]);

export function createProjectSwitcherController({
  els,
  state,
  defaultProjectManifestUrl,
  knownProjectManifests,
  recentProjectsKey,
  loadJson,
  sameProjectUrl,
  loadProject,
  reconnectRealtimeForDataset,
  closeFilterMenu,
  closeGraphSearch,
  closeGraphHelp,
  renderPresenceChips,
  showToast,
  setLoadingPhase,
  consoleRef = console,
  documentRef = document,
  windowRef = window
}) {
  let libraryMasonryFrame = 0;

  function toggleMenu() {
    const open = els.projectSwitcherMenu.classList.contains("hidden");
    if (open) {
      closeFilterMenu();
      closeGraphSearch();
      closeGraphHelp();
    }
    renderSwitcher();
    els.projectSwitcherMenu.classList.toggle("hidden", !open);
    els.projectSwitcherToggle.setAttribute("aria-expanded", String(open));
    if (open) els.projectSwitcherMenu.querySelector("[data-project-quick-search]")?.focus({ preventScroll: true });
  }

  function closeMenu() {
    els.projectSwitcherMenu?.classList.add("hidden");
    els.projectSwitcherToggle?.setAttribute("aria-expanded", "false");
  }

  function openLibrary(tab = state.projectLibraryTab || "library") {
    closeMenu();
    state.projectLibraryTab = normalizeTab(tab);
    els.projectLibrary?.classList.remove("hidden");
    documentRef.querySelector("#app")?.classList.add("project-library-open");
    renderLibrary();
    els.projectLibrarySearch?.focus({ preventScroll: true });
  }

  function closeLibrary() {
    els.projectLibrary?.classList.add("hidden");
    documentRef.querySelector("#app")?.classList.remove("project-library-open");
  }

  function renderSwitcher() {
    const manifest = state.projectManifest || {};
    if (els.activeProjectName) els.activeProjectName.textContent = manifest.titre || manifest.id || "Projet local";
    if (els.activeProjectVersion) els.activeProjectVersion.textContent = manifest.version ? `v${manifest.version}` : "";
    if (!els.projectSwitcherMenu) return;
    const items = getCatalogItems();
    const activeItem = items.find((item) => item.active);
    const quickItems = [activeItem, ...items.filter((item) => !item.active)].filter(Boolean).slice(0, 7);
    els.projectSwitcherMenu.classList.add("ps-dropdown", "ps-dropdown__menu", "ps-surface", "project-menu--next");
    els.projectSwitcherMenu.innerHTML = `
      <div class="project-menu__head">
        <label class="project-menu__search ps-field">
          <i>search</i>
          <input class="ps-input" data-project-quick-search type="search" placeholder="Rechercher un projet…">
        </label>
        <button class="project-menu__library ps-button ps-button--primary" type="button" data-project-library-open>
          <i>view_quilt</i><span>Bibliothèque</span>
        </button>
      </div>
      <div class="project-menu__list" data-project-quick-results>
        ${renderQuickItems(quickItems)}
      </div>
      <div class="project-menu__sources">
        ${LIBRARY_TABS.map((tab) => `<button type="button" data-project-library-tab-open="${tab.id}" ${tab.disabled ? "disabled aria-disabled=\"true\"" : ""}><i>${tab.icon}</i><span>${tab.label}</span></button>`).join("")}
      </div>
    `;
    bindProjectActions(els.projectSwitcherMenu);
    els.projectSwitcherMenu.querySelector("[data-project-quick-search]")?.addEventListener("input", (event) => {
      const query = normalizeText(event.target.value);
      const results = items
        .filter((item) => !query || item.searchText.includes(query))
        .slice(0, 9);
      els.projectSwitcherMenu.querySelector("[data-project-quick-results]").innerHTML = renderQuickItems(results);
      bindProjectActions(els.projectSwitcherMenu);
    });
  }

  function renderLibrary() {
    if (!els.projectLibraryContent) return;
    const tab = normalizeTab(state.projectLibraryTab);
    const sort = normalizeLibrarySort(state.projectLibrarySort);
    const order = normalizeLibraryOrder(state.projectLibraryOrder);
    state.projectLibrarySort = sort;
    state.projectLibraryOrder = order;
    const query = normalizeText(els.projectLibrarySearch?.value || "");
    const allItems = getCatalogItems();
    const sourceItems = getItemsForTab(allItems, tab).filter((item) => !query || item.searchText.includes(query));
    const filtered = sortLibraryItems(
      sourceItems,
      sort,
      order
    );
    const metrics = getLibraryMetrics(sourceItems);
    documentRef.querySelectorAll("[data-project-library-tab]").forEach((button) => {
      const active = button.dataset.projectLibraryTab === tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      const config = LIBRARY_TABS.find((item) => item.id === button.dataset.projectLibraryTab);
      button.disabled = Boolean(config?.disabled);
      button.setAttribute("aria-disabled", String(Boolean(config?.disabled)));
    });
    els.projectLibraryContent.innerHTML = renderLibraryTab(tab, filtered, allItems, sort, order, metrics);
    bindProjectActions(els.projectLibraryContent);
    scheduleLibraryMasonry(els.projectLibraryContent);
  }

  function renderLibraryTab(tab, items, allItems, sort, order, metrics) {
    if (tab === "drive" || tab === "github") {
      return `
        <section class="project-library__empty ps-surface">
          <i>${tab === "drive" ? "cloud_sync" : "hub"}</i>
          <h4>${tab === "drive" ? "Synchronisation Drive à brancher" : "Synchronisation GitHub à brancher"}</h4>
          <p>La surface est prête pour indexer des manifests distants, comptes connectés et packs collaboratifs. Pour l’instant, utilisez l’import local ou les packs internes.</p>
        </section>
        ${renderLibraryGrid(sortLibraryItems(allItems.slice(0, 4), sort, order), "Packs disponibles pendant la préparation", sort, order, metrics)}
      `;
    }
    if (!items.length) {
      return `
        <section class="project-library__empty ps-surface">
          <i>search_off</i>
          <h4>Aucun pack trouvé</h4>
          <p>Essayez une autre recherche ou ouvrez l’import pour ajouter un pack depuis cet appareil.</p>
        </section>
      `;
    }
    return renderLibraryGrid(items, getLibrarySectionTitle(sort, order), sort, order, metrics);
  }

  function renderLibraryGrid(items, title, sort = "recent", order = "desc", metrics = getLibraryMetrics(items)) {
    return `
      <section class="project-library__section">
        <div class="project-library__section-head ps-surface">
          <div class="project-library__section-title">
            <p class="kicker">${escapeHtml(sourceLabelForTab(state.projectLibraryTab))}</p>
            <h4>${escapeHtml(title)}</h4>
            <span class="project-library__count-badge">${items.length} ressource${items.length > 1 ? "s" : ""}</span>
          </div>
          <div class="project-library__section-tools">
            ${renderLibrarySortTabs(sort, metrics)}
            ${renderLibraryOrderMenu(order)}
          </div>
        </div>
        <div class="project-library__grid" data-project-library-grid>
          ${items.map((item) => renderProjectCard(item)).join("")}
        </div>
      </section>
    `;
  }

  function renderQuickItems(items) {
    if (!items.length) return `<p class="project-menu__empty">Aucun projet trouvé.</p>`;
    return items.map((entry) => renderProjectItem(entry)).join("");
  }

  function renderProjectItem(entry) {
    return `
      <button type="button" role="menuitem" data-project-url="${escapeHtml(entry.url || "")}" ${entry.url ? "" : "disabled"} class="project-menu-item ps-dropdown__item${entry.active ? " active is-active" : ""}">
        <span class="project-menu-item__mark" style="--project-accent:${entry.accent}"></span>
        <span>
          <strong>${escapeHtml(entry.title)}</strong>
          <small>${escapeHtml(entry.meta)}</small>
        </span>
        ${entry.active ? "<i>check</i>" : ""}
      </button>
    `;
  }

  function renderProjectCard(entry, { featured = false } = {}) {
    return `
      <article class="project-library-card${featured ? " project-library-card--featured" : ""} ps-surface" style="--project-accent:${entry.accent}">
        ${renderProjectCover(entry)}
        <div class="project-library-card__head">
          <div>
            <strong title="${escapeHtml(entry.title)}">${escapeHtml(entry.title)}</strong>
            <small title="${escapeHtml(entry.meta)}">${escapeHtml(entry.meta)}</small>
          </div>
        </div>
        <p>${escapeHtml(entry.description || "Pack PROSPECTRE disponible dans la bibliothèque locale.")}</p>
        <div class="project-library-card__meta" aria-label="Métadonnées du pack">
          ${entry.version ? `<span title="Version"><i>sell</i>v${escapeHtml(entry.version)}</span>` : ""}
          ${entry.relativeDate ? `<span title="${escapeHtml(entry.generatedAt || "Date non renseignée")}"><i>schedule</i>${escapeHtml(entry.relativeDate)}</span>` : ""}
          ${entry.fileCount ? `<span title="Fichiers chargés"><i>folder</i>${entry.fileCount}</span>` : ""}
          ${entry.exchangeCount ? `<span title="Échanges"><i>forum</i>${entry.exchangeCount}</span>` : ""}
        </div>
        ${entry.presenceHtml ? `<div class="project-library-card__presence">${entry.presenceHtml}</div>` : ""}
        <div class="project-library-card__chips">
          <span class="ps-chip">${escapeHtml(entry.group)}</span>
          <span class="ps-chip">${escapeHtml(entry.sourceLabel)}</span>
        </div>
        <div class="project-library-card__actions">
          <button class="ps-button${entry.active ? "" : " ps-button--primary"} project-library-card__open" type="button" data-project-url="${escapeHtml(entry.url || "")}" ${entry.url ? "" : "disabled"}>
            <i>${entry.active ? "check" : "play_arrow"}</i><span>${entry.active ? "Actif" : "Ouvrir"}</span>
          </button>
          <button class="ps-button project-library-card__copy" type="button" data-project-copy-url="${escapeHtml(entry.url || "")}" ${entry.shareable ? "" : "disabled"} aria-label="Copier le lien du pack">
            <i>link</i><span>Copier</span><span class="tooltip top">${entry.shareable ? "Copier le lien" : "Ressource locale non partageable"}</span>
          </button>
        </div>
      </article>
    `;
  }

  function renderLibrarySortTabs(sort, metrics) {
    const tabs = [
      { id: "recent", label: "Récence", icon: "schedule", count: metrics.resources },
      { id: "exchanges", label: "Échanges", icon: "forum", count: metrics.exchanges },
      { id: "presence", label: "Coprésence", icon: "group", count: metrics.presence }
    ];
    return `
      <div class="project-library-tabs ps-tab-list" role="tablist" aria-label="Filtrer le catalogue">
        ${tabs.map((tab) => `
          <button class="ps-tab${sort === tab.id ? " active is-active" : ""}" type="button" role="tab" data-project-library-sort="${tab.id}" aria-selected="${sort === tab.id}">
            <i>${tab.icon}</i><span>${tab.label}</span><strong>${tab.count}</strong>
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderLibraryOrderMenu(order) {
    const label = order === "asc" ? "Du - au +" : "Du + au -";
    return `
      <div class="project-library-order ps-dropdown">
        <button class="ps-button project-library-order__button" type="button" data-project-library-order-toggle aria-haspopup="menu" aria-label="Changer l’ordre du tri">
          <i>swap_vert</i><span>${escapeHtml(label)}</span>
        </button>
        <div class="project-library-order__menu ps-dropdown__menu ps-surface" role="menu">
          <button class="ps-dropdown__item${order === "desc" ? " is-active" : ""}" type="button" data-project-library-order="desc" role="menuitem"><span>Du + au -</span><i>south</i></button>
          <button class="ps-dropdown__item${order === "asc" ? " is-active" : ""}" type="button" data-project-library-order="asc" role="menuitem"><span>Du - au +</span><i>north</i></button>
        </div>
      </div>
    `;
  }

  function renderProjectCover(entry) {
    if (entry.coverUrl) {
      return `
        <button class="project-library-card__cover has-image" type="button" data-project-url="${escapeHtml(entry.url || "")}" ${entry.url ? "" : "disabled"} aria-label="Ouvrir ${escapeHtml(entry.title)}">
          <img src="${escapeHtml(entry.coverUrl)}" alt="">
        </button>
      `;
    }
    return `
      <button class="project-library-card__cover is-placeholder" type="button" data-project-url="${escapeHtml(entry.url || "")}" ${entry.url ? "" : "disabled"} aria-label="Ouvrir ${escapeHtml(entry.title)}">
        <span>${escapeHtml(entry.initials)}</span>
      </button>
    `;
  }

  function bindProjectActions(root) {
    root.querySelectorAll("[data-project-url]").forEach((button) => {
      button.addEventListener("click", async () => {
        await selectProject(button.dataset.projectUrl);
      });
    });
    root.querySelector("[data-project-library-open]")?.addEventListener("click", () => openLibrary("library"));
    root.querySelectorAll("[data-project-copy-url]").forEach((button) => {
      button.addEventListener("click", async () => {
        const url = button.dataset.projectCopyUrl;
        if (!url) return;
        const href = getProjectShareUrl(url);
        if (!href) {
          showToast("Cette ressource locale n’a pas de lien partageable");
          return;
        }
        try {
          await navigator.clipboard?.writeText?.(href);
          showToast("Lien du pack copié");
        } catch {
          showToast(href);
        }
      });
    });
    root.querySelectorAll("[data-project-library-tab-open]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) return;
        openLibrary(button.dataset.projectLibraryTabOpen);
      });
    });
    root.querySelectorAll("[data-project-library-sort]").forEach((button) => {
      button.addEventListener("click", () => {
        state.projectLibrarySort = normalizeLibrarySort(button.dataset.projectLibrarySort);
        renderLibrary();
      });
    });
    root.querySelectorAll("[data-project-library-order]").forEach((button) => {
      button.addEventListener("click", () => {
        state.projectLibraryOrder = normalizeLibraryOrder(button.dataset.projectLibraryOrder);
        renderLibrary();
      });
    });
    root.querySelector("[data-project-import]")?.addEventListener("click", () => {
      closeLibrary();
      documentRef.querySelector("#pack-input")?.click();
    });
    root.querySelectorAll(".project-library-card__cover").forEach((cover) => {
      cover.addEventListener("pointermove", (event) => {
        const rect = cover.getBoundingClientRect();
        cover.style.setProperty("--cover-x", `${Math.round(((event.clientX - rect.left) / rect.width) * 100)}%`);
        cover.style.setProperty("--cover-y", `${Math.round(((event.clientY - rect.top) / rect.height) * 100)}%`);
      });
      cover.addEventListener("pointerleave", () => {
        cover.style.removeProperty("--cover-x");
        cover.style.removeProperty("--cover-y");
      });
      cover.querySelectorAll("img").forEach((image) => {
        image.addEventListener("load", () => scheduleLibraryMasonry(root), { once: true });
      });
    });
  }

  function scheduleLibraryMasonry(root = els.projectLibraryContent) {
    if (!root) return;
    if (libraryMasonryFrame && typeof windowRef.cancelAnimationFrame === "function") {
      windowRef.cancelAnimationFrame(libraryMasonryFrame);
    }
    const run = () => {
      libraryMasonryFrame = 0;
      applyLibraryMasonry(root);
      windowRef.setTimeout?.(() => applyLibraryMasonry(root), 120);
    };
    if (typeof windowRef.requestAnimationFrame === "function") {
      libraryMasonryFrame = windowRef.requestAnimationFrame(run);
      return;
    }
    run();
  }

  function applyLibraryMasonry(root) {
    const grid = root?.querySelector("[data-project-library-grid]");
    if (!grid || typeof windowRef.getComputedStyle !== "function") return;
    const styles = windowRef.getComputedStyle(grid);
    const rowSize = Number.parseFloat(styles.gridAutoRows || "8") || 8;
    const gap = Number.parseFloat(styles.rowGap || styles.gap || "14") || 14;
    grid.querySelectorAll(".project-library-card").forEach((card) => {
      card.style.gridRowEnd = "auto";
      const rows = Math.ceil((card.getBoundingClientRect().height + gap) / (rowSize + gap));
      card.style.gridRowEnd = `span ${Math.max(1, rows)}`;
    });
  }

  async function selectProject(url) {
    if (!url || sameProjectUrl(url, state.projectManifestUrl)) {
      closeMenu();
      closeLibrary();
      return;
    }
    try {
      closeMenu();
      closeLibrary();
      await loadProject(url, { updateUrl: true });
      if (state.realtimeStatus === "firebase") await reconnectRealtimeForDataset();
    } catch (error) {
      consoleRef.error(error);
      setLoadingPhase?.("error", { message: "Projet indisponible", scope: "project" });
      showToast("Projet indisponible");
    }
  }

  function bindLibraryShell() {
    els.projectLibraryClose?.addEventListener("click", closeLibrary);
    els.projectLibrary?.addEventListener("click", (event) => {
      if (event.target === els.projectLibrary) closeLibrary();
    });
    els.projectLibrarySearch?.addEventListener("input", renderLibrary);
    windowRef.addEventListener?.("resize", () => {
      if (!els.projectLibrary?.classList.contains("hidden")) scheduleLibraryMasonry(els.projectLibraryContent);
    });
    documentRef.querySelectorAll("[data-project-library-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) return;
        state.projectLibraryTab = normalizeTab(button.dataset.projectLibraryTab);
        renderLibrary();
      });
    });
    documentRef.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.projectLibrary?.classList.contains("hidden")) closeLibrary();
    });
  }

  function getCatalogItems() {
    const recent = loadJson(recentProjectsKey, []);
    const knownProjects = state.availableProjectManifests || knownProjectManifests;
    const merged = [
      ...knownProjects,
      ...recent.filter((item) => !knownProjects.some((known) => known.id === item.id || sameProjectUrl(known.url, item.url)))
    ];
    return merged.map(normalizeCatalogItem).sort((a, b) => Number(b.active) - Number(a.active) || a.group.localeCompare(b.group, "fr") || a.title.localeCompare(b.title, "fr"));
  }

  function normalizeCatalogItem(entry) {
    const active = Boolean(entry.url && sameProjectUrl(entry.url, state.projectManifestUrl));
    const activeManifest = active ? state.projectManifest || {} : {};
    const normalizedEntry = active ? { ...entry, ...activeManifest, title: activeManifest.titre || entry.title } : entry;
    const group = normalizedEntry.group || entry.group || "Imports récents";
    const source = sourceForGroup(group);
    const title = normalizedEntry.title || normalizedEntry.titre || normalizedEntry.id || "Projet";
    const version = normalizedEntry.version || "";
    const id = normalizedEntry.id || "";
    const description = normalizedEntry.description || normalizedEntry.resume || "";
    const initials = createProjectInitials(title);
    const sourceLabel = source === "device" ? "Cet appareil" : source === "archive" ? "Archive" : source === "recent" ? "Récent" : "Interne";
    const meta = [version ? `v${version}` : "", id ? shortLabel(id, 42) : ""].filter(Boolean).join(" · ") || "Pack PROSPECTRE";
    const generatedAt = formatProjectDate(normalizedEntry.date_generation || normalizedEntry.generatedAt);
    const generatedTimestamp = parseProjectDate(normalizedEntry.date_generation || normalizedEntry.generatedAt) || 0;
    const fileCount = Array.isArray(normalizedEntry.fichiers) ? normalizedEntry.fichiers.length : Number(normalizedEntry.fileCount || 0);
    const exchangeCount = active ? countProjectComments() : Number(normalizedEntry.exchangeCount || 0);
    const presenceCount = active && state.realtimeStatus === "firebase" ? state.presence?.length || 0 : Number(normalizedEntry.presenceCount || 0);
    const shareable = Boolean(normalizedEntry.url && source !== "recent");
    return {
      ...normalizedEntry,
      active,
      accent: accentForSource(source),
      coverUrl: resolveCoverUrl(normalizedEntry),
      description,
      exchangeCount,
      fileCount,
      generatedAt,
      generatedTimestamp,
      group,
      initials,
      meta,
      presenceHtml: active && state.realtimeStatus === "firebase" && state.presence?.length ? renderPresenceChips?.(state.presence, 4) || "" : "",
      presenceCount,
      relativeDate: formatProjectRelativeDate(normalizedEntry.date_generation || normalizedEntry.generatedAt),
      shareable,
      source,
      sourceLabel,
      title,
      searchText: normalizeText([title, version, id, group, sourceLabel, description].join(" "))
    };
  }

  function getItemsForTab(items, tab) {
    if (tab === "device") return items.filter((item) => item.source === "device" || item.source === "recent" || item.source === "archive");
    if (tab === "drive" || tab === "github") return [];
    return items;
  }

  function resolveCoverUrl(entry) {
    const raw = COVER_FIELDS.map((field) => entry[field] || entry.media?.[field]).find(Boolean);
    if (!raw || typeof raw !== "string") return "";
    if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
    const localAsset = state.files?.get(raw) || state.files?.get(raw.replace(/^\.\//, ""));
    if (localAsset?.dataUrl) return localAsset.dataUrl;
    if (!entry.url) return raw;
    try {
      return new URL(raw, new URL(entry.url, documentRef.baseURI)).href;
    } catch {
      return raw;
    }
  }

  function getProjectShareUrl(projectUrl) {
    if (!projectUrl) return "";
    try {
      return new URL(createProjectNavigationHref(windowRef.location.href, projectUrl, {
        defaultManifestUrl: defaultProjectManifestUrl
      }), windowRef.location.href).href;
    } catch {
      return "";
    }
  }

  function countProjectComments() {
    return Object.values(state.comments || {})
      .flat()
      .filter((comment) => !comment.deletedAt && !comment.systemKind)
      .length;
  }

  function formatProjectDate(value) {
    const timestamp = parseProjectDate(value);
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }

  function formatProjectRelativeDate(value) {
    const timestamp = parseProjectDate(value);
    return timestamp ? formatRelativeTime(timestamp, { dayjs: windowRef.dayjs }) : "";
  }

  function parseProjectDate(value) {
    if (!value) return null;
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  function createProjectInitials(title) {
    const words = String(title || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/[^a-zA-Z0-9]+/)
      .filter((word) => word.length && !["de", "du", "des", "la", "le", "les", "et", "a", "the"].includes(word.toLowerCase()));
    if (!words.length) return "P";
    if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
    return words.slice(0, 5).map((word) => word[0]).join("").toUpperCase();
  }

  function sourceForGroup(group = "") {
    const value = group.toLowerCase();
    if (value.includes("local")) return "device";
    if (value.includes("archive")) return "archive";
    if (value.includes("récent") || value.includes("recent")) return "recent";
    return "library";
  }

  function accentForSource(source) {
    return {
      library: "var(--ps-palette-1)",
      device: "var(--ps-palette-4)",
      archive: "var(--ps-palette-6)",
      recent: "var(--ps-palette-2)"
    }[source] || "var(--ps-color-accent)";
  }

  function normalizeTab(tab = "library") {
    return LIBRARY_TABS.some((item) => item.id === tab) ? tab : "library";
  }

  function normalizeLibrarySort(sort = "recent") {
    return ["recent", "exchanges", "presence"].includes(sort) ? sort : "recent";
  }

  function normalizeLibraryOrder(order = "desc") {
    return order === "asc" ? "asc" : "desc";
  }

  function sortLibraryItems(items, sort = "recent", order = "desc") {
    const indexed = items.map((item, index) => ({ item, index }));
    const compareBase = (a, b) => Number(b.item.active) - Number(a.item.active) || a.index - b.index;
    const direction = normalizeLibraryOrder(order) === "asc" ? 1 : -1;
    const byNumber = (a, b, getter) => {
      const left = Number(getter(a.item) || 0);
      const right = Number(getter(b.item) || 0);
      return (left - right) * direction || compareBase(a, b);
    };
    const sorted = indexed.sort((a, b) => {
      if (sort === "presence") return byNumber(a, b, (item) => item.presenceCount);
      if (sort === "exchanges") return byNumber(a, b, (item) => item.exchangeCount);
      if (sort === "recent") return byNumber(a, b, (item) => item.generatedTimestamp);
      return compareBase(a, b);
    });
    return sorted.map(({ item }) => item);
  }

  function getLibraryMetrics(items) {
    return {
      resources: items.length,
      exchanges: items.reduce((total, item) => total + Number(item.exchangeCount || 0), 0),
      presence: items.reduce((total, item) => total + Number(item.presenceCount || 0), 0)
    };
  }

  function getLibrarySectionTitle(sort, order) {
    const high = normalizeLibraryOrder(order) === "desc";
    if (sort === "exchanges") return high ? "Le plus d’échanges" : "Le moins d’échanges";
    if (sort === "presence") return high ? "Le plus de coprésence" : "Le moins de coprésence";
    return high ? "Les plus récents" : "Les moins récents";
  }

  function sourceLabelForTab(tab = "library") {
    if (tab === "device") return "Cet appareil";
    if (tab === "drive") return "Drive";
    if (tab === "github") return "GitHub";
    return "Ressources";
  }

  function normalizeText(value = "") {
    return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  }

  bindLibraryShell();

  return {
    toggleMenu,
    closeMenu,
    openLibrary,
    closeLibrary,
    renderSwitcher,
    renderLibrary
  };
}
