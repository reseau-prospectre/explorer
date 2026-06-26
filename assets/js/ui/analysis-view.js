import { escapeHtml, getId } from "../core/utils.js";
import {
  computeGraphQualityMetrics,
  formatCompactNumber,
  formatGraphNumber
} from "./graph-quality-model.js";
import { renderGraphQualityCard as renderGraphQualityCardView } from "./graph-quality-view.js";
import {
  formatManifestDate,
  getBreadcrumbEntities,
  getEntityMetadataEntries
} from "./insight-model.js";
import { renderEntityReactionBlock } from "./reactions-view.js";
import {
  getTypePresentation,
  renderTypeDistributionChart as renderTypeDistributionChartView
} from "./type-distribution-chart.js?v=20260626-v314-load-sequence-1";
import { iconMarkup } from "./icons.js?v=20260625-panel-rails-3";

export function createAnalysisRenderer({
  els,
  state,
  typeConfig,
  getLinkKey,
  getSelectedPathIds,
  getSelectedLinkPath,
  getOverviewContextId,
  getOverviewDiscussionEntity,
  getVisibleEntitySummary,
  getEntityReactions,
  renderPresenceChips,
  activateRealtime,
  reactToEntity,
  openEntityEmojiPicker,
  openOverviewDiscussion,
  selectNode,
  selectContributionNode,
  selectOverview,
  renderRightPanel,
  updateDeepLink,
  followUser,
  windowRef = window,
  documentRef = document
}) {
  function getGraphScope() {
    if (state.visibleGraph.nodes.length || !state.graph.nodes.length || !state.activeTypes.size) {
      return state.visibleGraph;
    }
    return state.graph;
  }

  function renderGraphQualityCard(focusNodes, selected, selectedLink, scopeLinks) {
    const metrics = computeGraphQualityMetrics(focusNodes, scopeLinks);
    const scopeLabel = selected
      ? "Sélection"
      : selectedLink
        ? "Chemin"
        : "Vue active";
    return renderGraphQualityCardView({
      metrics,
      scopeLabel,
      formatCompactNumber,
      formatGraphNumber
    });
  }

  function renderAnalysis() {
    const selected = state.entities.get(state.selectedId);
    const selectedLink = state.selectedLinkKey ? state.graph.links.find((link) => getLinkKey(link) === state.selectedLinkKey) : null;
    const graphScope = getGraphScope();
    const relatedIds = state.selectedId ? getSelectedPathIds() : new Set();
    const linkPath = selectedLink ? getSelectedLinkPath() : { nodeIds: new Set(), linkKeys: new Set() };
    const linkPathIds = linkPath.nodeIds;
    const visibleNodeById = new Map(graphScope.nodes.map((node) => [node.id, node]));
    const relatedNodes = [...graphScope.nodes].filter((node) => relatedIds.has(node.id) && node.id !== state.selectedId);
    renderInsightBreadcrumb(selected);
    const focusNodes = selected
      ? [visibleNodeById.get(selected.id), ...relatedNodes].filter(Boolean)
      : selectedLink
        ? [...graphScope.nodes].filter((node) => linkPathIds.has(node.id))
        : [...graphScope.nodes];
    const graphQualityCard = renderGraphQualityCard(focusNodes, selected, selectedLink, graphScope.links);
    const linkedCount = selected
      ? state.graph.links.filter((link) => getId(link.source) === selected.id || getId(link.target) === selected.id).length
      : state.graph.links.length;
    if (selected) {
      const metadata = getEntityMetadataEntries(selected, relatedNodes.length, linkedCount, {
        modelSchema: state.modelSchema,
        commentsByEntity: state.comments
      });
      const selectedSummary = getVisibleEntitySummary(selected);
      els.kpiGrid.classList.add("project-metadata");
      els.kpiGrid.innerHTML = `
        ${graphQualityCard}
        <article class="project-meta-card entity-meta-card ps-card ps-surface">
          <p class="kicker">Métadonnées</p>
          <dl>
            ${metadata.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
          </dl>
        </article>
      `;
      els.timeline.innerHTML = `
        <div class="context-card ps-card ps-surface">
          <p class="kicker">Sélection active</p>
          <strong>${escapeHtml(selected.label)}</strong>
          ${selectedSummary ? `<p>${escapeHtml(selectedSummary)}</p>` : ""}
        </div>
      `;
    } else if (selectedLink) {
      const source = state.entities.get(getId(selectedLink.source));
      const target = state.entities.get(getId(selectedLink.target));
      els.timeline.innerHTML = `
        <div class="context-card project-context-card ps-card ps-surface">
          <strong>Lien sélectionné</strong>
          <p>${escapeHtml(source?.label || getId(selectedLink.source))} → ${escapeHtml(target?.label || getId(selectedLink.target))}</p>
          <div class="project-tags">
            <span>${escapeHtml(selectedLink.label || selectedLink.type || "Relation")}</span>
            <span>${linkPath.linkKeys.size} lien${linkPath.linkKeys.size > 1 ? "s" : ""} bout en bout</span>
          </div>
        </div>
      `;
      els.kpiGrid.classList.add("project-metadata");
      els.kpiGrid.innerHTML = `
        ${graphQualityCard}
        <article class="project-meta-card ps-card ps-surface">
          <p class="kicker">Relation</p>
          <dl>
            <div><dt>Source</dt><dd>${escapeHtml(source?.label || getId(selectedLink.source))}</dd></div>
            <div><dt>Cible</dt><dd>${escapeHtml(target?.label || getId(selectedLink.target))}</dd></div>
            <div><dt>Type</dt><dd>${escapeHtml(selectedLink.type || "related_to")}</dd></div>
            <div><dt>Chemin</dt><dd>${linkPath.nodeIds.size} élément${linkPath.nodeIds.size > 1 ? "s" : ""}</dd></div>
          </dl>
        </article>
      `;
    } else {
      const manifest = state.projectManifest || {};
      const fileCount = Array.isArray(manifest.fichiers) ? manifest.fichiers.length : state.files.size;
      const generatedAt = formatManifestDate(manifest.date_generation);
      els.timeline.innerHTML = `
        <div class="context-card project-context-card ps-card ps-surface">
          <strong>${escapeHtml(manifest.titre || manifest.id || "Projet sans titre")}</strong>
          ${manifest.description ? `<p>${escapeHtml(manifest.description)}</p>` : ""}
          <div class="project-tags">
            ${manifest.version ? `<span>Version ${escapeHtml(manifest.version)}</span>` : ""}
            ${generatedAt ? `<span>${escapeHtml(generatedAt)}</span>` : ""}
          </div>
        </div>
      `;
      els.kpiGrid.classList.add("project-metadata");
      els.kpiGrid.innerHTML = `
        ${graphQualityCard}
        <article class="project-meta-card ps-card ps-surface">
          <p class="kicker">Métadonnées</p>
          <dl>
            <div><dt>Identifiant</dt><dd>${escapeHtml(manifest.id || state.datasetId)}</dd></div>
            <div><dt>Version</dt><dd>${escapeHtml(manifest.version || "Non renseignée")}</dd></div>
            <div><dt>Génération</dt><dd>${escapeHtml(generatedAt || "Non renseignée")}</dd></div>
            <div><dt>Fichiers chargés</dt><dd>${fileCount}</dd></div>
          </dl>
        </article>
      `;
    }
    const rows = focusNodes
      .filter((node) => getTypePresentation(node.type))
      .sort((a, b) => getTypePresentation(a.type).order - getTypePresentation(b.type).order || a.label.localeCompare(b.label, "fr"));
    els.entityTable.innerHTML = `
      <div class="chart-card ps-card ps-surface">
        <div class="chart-frame">
          <canvas id="type-distribution-chart" aria-label="Répartition des éléments"></canvas>
        </div>
        <div id="type-distribution-legend" class="chart-legend"></div>
      </div>
      <table class="ps-data-table">
        <thead><tr><th>${selected ? "Éléments liés" : "Éléments structurants"}</th><th>Type</th></tr></thead>
        <tbody>${rows.map((node) => `
          <tr data-node="${escapeHtml(node.id)}">
            <td>${escapeHtml(node.label)}</td>
            <td><span class="type-chip" style="--chip:${getTypePresentation(node.type)?.color || "#9aa6ad"}">${escapeHtml(getTypePresentation(node.type)?.singular || node.type)}</span></td>
          </tr>
        `).join("")}</tbody>
      </table>
    `;
    els.entityTable.querySelectorAll("[data-node]").forEach((row) => {
      row.addEventListener("click", () => {
        const node = state.graph.nodes.find((item) => item.id === row.dataset.node);
        if (node?.type === "contribution") selectContributionNode(node, true);
        else selectNode(row.dataset.node, true);
      });
    });
    renderTypeDistributionChart(focusNodes);
    renderPresenceSummary(selected, selectedLink);
  }

  function renderPresenceSummary(selected, selectedLink) {
    if (!els.presenceSummary) return;
    const context = getAnalysisSocialContext(selected, selectedLink);
    const reactions = getEntityReactions(context.id);
    const online = state.realtimeStatus === "firebase";
    const presence = context.entityId
      ? state.presence.filter((item) => item.selectedNodeId === context.entityId)
      : state.presence;
    els.presenceSummary.innerHTML = `
      <article class="presence-summary-card ps-card ps-surface">
        <div class="presence-summary-head">
          <p class="kicker">Coprésence</p>
          <span class="presence-mode-pill ${online ? "online" : "local"}">${online ? "Active" : "Locale"}</span>
        </div>
        <strong>${escapeHtml(context.label)}</strong>
        <div class="node-reaction-summary">
          ${renderEntityReactionBlock(context.id, reactions)}
        </div>
        ${online ? `
          ${presence.length ? `<div class="discussion-presence compact-presence">${renderPresenceChips(presence, 4)}</div>` : `<p class="presence-summary-note">Aucune autre présence sur ce contexte.</p>`}
          <button class="secondary-button compact" data-open-context-discussion="${escapeHtml(context.id)}" type="button">
            <i>forum</i> Ouvrir les échanges
          </button>
        ` : `
          <p class="presence-summary-note">Identité locale active. Connectez la coprésence pour partager les réactions et échanges.</p>
          <button class="secondary-button compact" data-activate-copresence type="button">
            <i>account_circle</i> Activer la coprésence
          </button>
        `}
      </article>
    `;
    els.presenceSummary.querySelector("[data-activate-copresence]")?.addEventListener("click", () => activateRealtime(documentRef.querySelector("#toggle-avatars")));
    els.presenceSummary.querySelectorAll("[data-entity-reaction]").forEach((button) => {
      button.addEventListener("click", () => reactToEntity(context.id, {
        emoji: button.dataset.entityReaction,
        annotation: button.dataset.annotation || ""
      }));
    });
    els.presenceSummary.querySelectorAll("[data-entity-reaction-picker]").forEach((button) => {
      button.addEventListener("click", () => openEntityEmojiPicker(button.dataset.entityReactionPicker, button));
    });
    els.presenceSummary.querySelector("[data-open-context-discussion]")?.addEventListener("click", () => {
      if (context.entityId && state.entities.has(context.entityId)) {
        state.activeTab = "discussion";
        documentRef.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === "discussion"));
        selectNode(context.entityId, false);
        renderRightPanel();
        updateDeepLink();
        return;
      }
      openOverviewDiscussion();
    });
    els.presenceSummary.querySelectorAll("[data-follow]").forEach((button) => {
      button.addEventListener("click", () => followUser(button.dataset.follow));
    });
    els.presenceSummary.querySelector("[data-expand-presence]")?.addEventListener("click", (event) => {
      event.currentTarget.closest(".discussion-presence")?.classList.toggle("expanded");
    });
  }

  function getAnalysisSocialContext(selected, selectedLink) {
    if (selected) {
      return {
        id: selected.id,
        entityId: selected.id,
        label: selected.label || "Sélection active"
      };
    }
    if (selectedLink) {
      const source = state.entities.get(getId(selectedLink.source));
      const target = state.entities.get(getId(selectedLink.target));
      return {
        id: getOverviewContextId(),
        entityId: null,
        label: `${source?.label || getId(selectedLink.source)} → ${target?.label || getId(selectedLink.target)}`
      };
    }
    const overview = getOverviewDiscussionEntity();
    return {
      id: overview.id,
      entityId: null,
      label: "Vue d’ensemble"
    };
  }

  function renderInsightBreadcrumb(selected) {
    const container = documentRef.querySelector("#insight-breadcrumb");
    if (!container) return;
    container.classList.add("ps-breadcrumb");
    const entities = getBreadcrumbEntities(selected, {
      entities: state.entities,
      links: state.graph.links,
      typeConfig
    });
    const ancestorEntities = entities.slice(0, -1);
    const currentEntity = entities.at(-1);
    container.classList.toggle("is-overview", !currentEntity);
    container.classList.toggle("has-overflow", ancestorEntities.length > 1);
    container.innerHTML = `
      <span class="ps-breadcrumb__item">
        <button type="button" class="ps-breadcrumb__button" data-breadcrumb-root title="Vue d’ensemble">${iconMarkup("graph")}<span>Vue d’ensemble</span></button>
      </span>
      ${ancestorEntities.map((entity) => `
        <span class="ps-breadcrumb__item ps-breadcrumb__item--ancestor">
          <button type="button" class="ps-breadcrumb__button" data-node="${escapeHtml(entity.id)}" title="${escapeHtml(entity.label)}">${escapeHtml(entity.label)}</button>
        </span>
      `).join("")}
      ${ancestorEntities.length > 1 ? `
        <span class="ps-breadcrumb__item ps-breadcrumb__item--overflow">
          <button type="button" class="ps-breadcrumb__button ps-breadcrumb__overflow" data-breadcrumb-overflow aria-expanded="false" aria-label="Afficher les niveaux précédents">...</button>
          <span class="ps-breadcrumb__menu" data-breadcrumb-menu hidden>
            ${ancestorEntities.map((entity) => `<button type="button" data-node="${escapeHtml(entity.id)}" title="${escapeHtml(entity.label)}">${escapeHtml(entity.label)}</button>`).join("")}
          </span>
        </span>
      ` : ""}
      ${currentEntity ? `
        <span class="ps-breadcrumb__item ps-breadcrumb__item--current">
          <button type="button" class="ps-breadcrumb__button ps-breadcrumb__current" data-node="${escapeHtml(currentEntity.id)}" title="${escapeHtml(currentEntity.label)}">${escapeHtml(currentEntity.label)}</button>
        </span>
      ` : ""}
    `;
    container.querySelector("[data-breadcrumb-root]")?.addEventListener("click", selectOverview);
    container.querySelector("[data-breadcrumb-overflow]")?.addEventListener("click", (event) => {
      event.stopPropagation();
      const menu = container.querySelector("[data-breadcrumb-menu]");
      if (!menu) return;
      const open = menu.hidden;
      menu.hidden = !open;
      event.currentTarget.setAttribute("aria-expanded", String(open));
    });
    container.querySelectorAll("[data-node]").forEach((button) => {
      button.addEventListener("click", () => selectNode(button.dataset.node, true));
    });
  }

  function renderTypeDistributionChart(nodes) {
    renderTypeDistributionChartView({
      nodes,
      canvas: documentRef.querySelector("#type-distribution-chart"),
      legend: documentRef.querySelector("#type-distribution-legend"),
      chartState: state.charts,
      chartCtor: windowRef.Chart,
      allNodeCount: state.graph.nodes.length,
      prefersReducedMotion: windowRef.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
    });
  }
  return {
    getGraphScope,
    renderAnalysis,
    renderPresenceSummary
  };
}
