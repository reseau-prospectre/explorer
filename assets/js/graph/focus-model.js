import { getId } from "../core/utils.js";

export function buildVisibleGraph({
  graph,
  activeTypes,
  realtimeStatus,
  focusActive,
  selectedPathIds,
  selectedPathLinkKeys,
  selectedLinkKey,
  selectedId,
  selectedLinkPaths,
  hoveredLinkKey,
  getLinkKey
}) {
  const nodes = graph.nodes
    .filter((node) => {
      const typeVisible = node.type === "contribution"
        ? realtimeStatus === "firebase" && activeTypes.has("contribution")
        : activeTypes.has(node.type);
      return typeVisible && (!focusActive || selectedPathIds.has(node.id));
    })
    .map((node) => ({ ...node }));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const links = graph.links
    .filter((link) => nodeIds.has(getId(link.source)) && nodeIds.has(getId(link.target)))
    .filter((link) => {
      if (!focusActive) return true;
      if (selectedLinkKey) return selectedLinkPaths.linkKeys.has(getLinkKey(link));
      if (selectedId) return selectedPathLinkKeys.has(getLinkKey(link));
      return true;
    })
    .map((link) => {
      const source = getId(link.source);
      const target = getId(link.target);
      const linkKey = getLinkKey(link);
      return {
        ...link,
        source,
        target,
        highlight: selectedPathLinkKeys.has(linkKey),
        hover: hoveredLinkKey === linkKey
      };
    });
  return { nodes, links };
}

export function getSelectedPathIds({ searchMatchedIds, selectedLinkKey, selectedId, selectedLinkPaths, selectedNodePaths }) {
  const ids = new Set(searchMatchedIds || []);
  if (selectedLinkKey) {
    for (const id of selectedLinkPaths.nodeIds || []) ids.add(id);
    if (selectedId) ids.add(selectedId);
    return ids;
  }
  if (selectedId) {
    for (const id of selectedNodePaths.nodeIds || []) ids.add(id);
    return ids;
  }
  return ids;
}

export function getSelectedNodePath({ selectedId, links, focusDepth, getLinkKey }) {
  if (!selectedId) return emptyPath();
  const nodeIds = new Set([selectedId]);
  const linkKeys = new Set();
  let frontier = new Set([selectedId]);
  const visited = new Set([selectedId]);
  for (let step = 0; step < focusDepth; step += 1) {
    const next = new Set();
    for (const link of links) {
      const source = getId(link.source);
      const target = getId(link.target);
      const sourceInFrontier = frontier.has(source);
      const targetInFrontier = frontier.has(target);
      if (!sourceInFrontier && !targetInFrontier) continue;
      const other = sourceInFrontier ? target : source;
      linkKeys.add(getLinkKey(link));
      nodeIds.add(source);
      nodeIds.add(target);
      if (!visited.has(other)) {
        visited.add(other);
        next.add(other);
      }
    }
    if (!next.size) break;
    frontier = next;
  }
  return { nodeIds, linkKeys };
}

export function getSelectedLinkPath({ selectedLinkKey, links, entities, focusDepth, getLinkKey, maxLinks }) {
  if (!selectedLinkKey) return emptyPath();
  const selected = links.find((link) => getLinkKey(link) === selectedLinkKey);
  if (!selected) return emptyPath();
  const nodeIds = new Set([getId(selected.source), getId(selected.target)]);
  const linkKeys = new Set([getLinkKey(selected)]);
  collectPrimaryIncomingLink(getId(selected.source), { links, entities, nodeIds, linkKeys, getLinkKey, maxLinks, maxDepth: focusDepth });
  collectPrimaryOutgoingLink(getId(selected.target), { links, entities, nodeIds, linkKeys, getLinkKey, maxLinks, maxDepth: focusDepth });
  return { nodeIds, linkKeys };
}

function collectPrimaryIncomingLink(nodeId, context, depth = 0, visitedNodes = new Set()) {
  const { links, nodeIds, linkKeys, getLinkKey, maxLinks, maxDepth } = context;
  if (depth >= maxDepth || linkKeys.size >= maxLinks || visitedNodes.has(nodeId)) return;
  visitedNodes.add(nodeId);
  const link = pickPrimaryLink(links.filter((item) => getId(item.target) === nodeId && !linkKeys.has(getLinkKey(item))), context);
  if (!link) return;
  const key = getLinkKey(link);
  linkKeys.add(key);
  const source = getId(link.source);
  nodeIds.add(source);
  nodeIds.add(nodeId);
  collectPrimaryIncomingLink(source, context, depth + 1, new Set(visitedNodes));
}

function collectPrimaryOutgoingLink(nodeId, context, depth = 0, visitedNodes = new Set()) {
  const { links, nodeIds, linkKeys, getLinkKey, maxLinks, maxDepth } = context;
  if (depth >= maxDepth || linkKeys.size >= maxLinks || visitedNodes.has(nodeId)) return;
  visitedNodes.add(nodeId);
  const link = pickPrimaryLink(links.filter((item) => getId(item.source) === nodeId && !linkKeys.has(getLinkKey(item))), context);
  if (!link) return;
  const key = getLinkKey(link);
  linkKeys.add(key);
  const target = getId(link.target);
  nodeIds.add(nodeId);
  nodeIds.add(target);
  collectPrimaryOutgoingLink(target, context, depth + 1, new Set(visitedNodes));
}

function pickPrimaryLink(links, { entities }) {
  return [...links].sort((a, b) => {
    const weight = Number(b.weight || 0) - Number(a.weight || 0);
    if (weight) return weight;
    const bTarget = entities.get(getId(b.target));
    const aTarget = entities.get(getId(a.target));
    return Number(bTarget?.influence_score || bTarget?.dependence_score || 0) - Number(aTarget?.influence_score || aTarget?.dependence_score || 0);
  })[0] || null;
}

function emptyPath() {
  return { nodeIds: new Set(), linkKeys: new Set() };
}
