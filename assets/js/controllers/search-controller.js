import { normalizeSearchText } from "../core/utils.js";
import {
  buildSearchDocuments,
  fallbackSearchDocuments,
  getSearchExcerpt,
  renderSearchResultsView
} from "../ui/search-view.js";

export function createSearchController({
  els,
  state,
  typeConfig,
  resultLimit,
  fuseCtor = window.Fuse,
  closeFilterMenu,
  closeGraphHelp,
  closeProjectMenu,
  positionToolbarPopover,
  syncToolbarActiveStates,
  updateVisibleGraph,
  renderRightPanel,
  selectNode,
  requestAnimationFrameRef = requestAnimationFrame
}) {
  function buildIndex(nodes = state.graph.nodes) {
    const docs = buildSearchDocuments(nodes);
    state.searchDocs = docs;
    state.searchIndex = fuseCtor
      ? new fuseCtor(docs, {
        includeMatches: true,
        includeScore: true,
        threshold: 0.36,
        ignoreLocation: true,
        minMatchCharLength: 2,
        keys: [
          { name: "label", weight: 0.38 },
          { name: "summary", weight: 0.22 },
          { name: "body", weight: 0.22 },
          { name: "keywords", weight: 0.08 },
          { name: "tags", weight: 0.06 },
          { name: "metadata", weight: 0.04 }
        ]
      })
      : null;
  }

  function run(value) {
    state.searchQuery = value;
    state.searchTerm = normalizeSearchText(value);
    updateControl();
    if (!state.searchTerm) {
      state.searchResults = [];
      state.searchActiveIndex = -1;
      state.searchMatchedIds = new Set();
      renderResults();
      updateVisibleGraph();
      if (state.selectedId) renderRightPanel();
      return;
    }
    const results = state.searchIndex
      ? state.searchIndex.search(value).slice(0, resultLimit).map((result) => ({
        item: result.item,
        score: result.score,
        excerpt: getSearchExcerpt(result.item, value, result.matches)
      }))
      : fallback(value);
    state.searchResults = results;
    state.searchActiveIndex = results.length ? 0 : -1;
    state.searchMatchedIds = new Set(results.map((result) => result.item.id));
    renderResults();
    updateVisibleGraph();
    if (results[0]) navigateToResult(0, { fromInput: true });
  }

  function fallback(value) {
    return fallbackSearchDocuments(state.searchDocs, value, resultLimit);
  }

  function renderResults() {
    if (!els.graphSearchResults || !els.graphSearchStatus) return;
    const view = renderSearchResultsView({
      searchTerm: state.searchTerm,
      results: state.searchResults,
      activeIndex: state.searchActiveIndex,
      entities: state.entities,
      typeConfig
    });
    els.graphSearchStatus.textContent = view.status;
    els.graphSearchResults.innerHTML = view.html;
    els.graphSearchResults.querySelectorAll("[data-search-index]").forEach((button) => {
      button.addEventListener("click", () => navigateToResult(Number(button.dataset.searchIndex)));
    });
  }

  function navigateToResult(index, options = {}) {
    const result = state.searchResults[index];
    if (!result) return;
    state.searchActiveIndex = index;
    renderResults();
    selectNode(result.item.id, true);
    if (!options.fromInput) els.search?.focus();
  }

  function handleKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (!state.searchResults.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = Math.min(state.searchResults.length - 1, state.searchActiveIndex + 1);
      navigateToResult(next);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const previous = Math.max(0, state.searchActiveIndex - 1);
      navigateToResult(previous);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      navigateToResult(Math.max(0, state.searchActiveIndex));
    }
  }

  function clear() {
    clearState();
    updateControl();
    updateVisibleGraph();
    renderResults();
    if (state.selectedId) renderRightPanel();
    els.search?.focus();
  }

  function clearState() {
    if (els.search) els.search.value = "";
    state.searchQuery = "";
    state.searchTerm = "";
    state.searchResults = [];
    state.searchActiveIndex = -1;
    state.searchMatchedIds = new Set();
  }

  function updateControl() {
    els.clearSearch?.classList.toggle("hidden", !els.search?.value);
  }

  function toggle() {
    if (els.graphSearchPopover?.classList.contains("hidden")) open();
    else close();
  }

  function open() {
    closeFilterMenu();
    closeGraphHelp();
    closeProjectMenu();
    els.graphSearchPopover?.classList.remove("hidden");
    els.graphSearchToggle?.setAttribute("aria-expanded", "true");
    syncToolbarActiveStates();
    requestAnimationFrameRef(() => {
      positionToolbarPopover(els.graphSearchPopover, els.graphSearchToggle);
      els.search?.focus();
    });
    renderResults();
  }

  function close() {
    els.graphSearchPopover?.classList.add("hidden");
    els.graphSearchToggle?.setAttribute("aria-expanded", "false");
    syncToolbarActiveStates();
  }

  return {
    buildIndex,
    run,
    fallback,
    renderResults,
    navigateToResult,
    handleKeydown,
    clear,
    clearState,
    updateControl,
    toggle,
    open,
    close
  };
}
