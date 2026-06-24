import { escapeHtml } from "../core/utils.js";

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
  showToast,
  consoleRef = console
}) {
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
  }

  function closeMenu() {
    els.projectSwitcherMenu?.classList.add("hidden");
    els.projectSwitcherToggle?.setAttribute("aria-expanded", "false");
  }

  function renderSwitcher() {
    const manifest = state.projectManifest || {};
    if (els.activeProjectName) els.activeProjectName.textContent = manifest.titre || manifest.id || "Projet local";
    if (els.activeProjectVersion) els.activeProjectVersion.textContent = manifest.version ? `v${manifest.version}` : "";
    if (!els.projectSwitcherMenu) return;
    const recent = loadJson(recentProjectsKey, []);
    const knownProjects = state.availableProjectManifests
      || knownProjectManifests.filter((entry) => sameProjectUrl(entry.url, defaultProjectManifestUrl));
    const projects = [
      ...knownProjects,
      ...recent.filter((item) => !knownProjects.some((known) => known.id === item.id))
    ];
    const grouped = projects.reduce((groups, item) => {
      const group = item.group || "Imports récents";
      groups[group] ||= [];
      groups[group].push(item);
      return groups;
    }, {});
    els.projectSwitcherMenu.innerHTML = Object.entries(grouped).map(([group, entries]) => `
      <section class="project-menu-group">
        <p>${escapeHtml(group)}</p>
        ${entries.map((entry) => renderProjectItem(entry)).join("")}
      </section>
    `).join("");
    els.projectSwitcherMenu.querySelectorAll("[data-project-url]").forEach((button) => {
      button.addEventListener("click", async () => {
        const url = button.dataset.projectUrl;
        if (!url || sameProjectUrl(url, state.projectManifestUrl)) {
          closeMenu();
          return;
        }
        try {
          await loadProject(url, { updateUrl: true });
          if (state.realtimeStatus === "firebase") await reconnectRealtimeForDataset();
        } catch (error) {
          consoleRef.error(error);
          showToast("Projet indisponible");
        }
      });
    });
  }

  function renderProjectItem(entry) {
    const active = entry.url && sameProjectUrl(entry.url, state.projectManifestUrl);
    const unavailable = !entry.url;
    return `
      <button type="button" role="menuitem" data-project-url="${escapeHtml(entry.url || "")}" ${unavailable ? "disabled" : ""} class="${active ? "active" : ""}">
        <span>
          <strong>${escapeHtml(entry.title || entry.titre || entry.id || "Projet")}</strong>
          <small>${escapeHtml([entry.version ? `v${entry.version}` : "", entry.id || ""].filter(Boolean).join(" · "))}</small>
        </span>
        ${active ? "<i>check</i>" : ""}
      </button>
    `;
  }

  return {
    toggleMenu,
    closeMenu,
    renderSwitcher
  };
}
