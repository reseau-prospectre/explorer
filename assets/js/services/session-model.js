export function getProjectSessionKey({ manifest, datasetId }) {
  return `${manifest?.id || datasetId || "local"}::${manifest?.version || "noversion"}`;
}

export function createSessionSnapshot({ projectManifest, datasetId, projectManifestUrl, files }) {
  return {
    projectId: projectManifest?.id || datasetId,
    projectVersion: projectManifest?.version || null,
    projectManifestUrl,
    manifest: projectManifest,
    files: [...files.values()]
  };
}

export function applyStoredGraphLayout(nodes, layout) {
  for (const node of nodes) {
    const position = layout?.[node.id];
    if (!position) continue;
    node.x = Number(position.x);
    node.y = Number(position.y);
    node.z = Number(position.z);
    node.fx = node.x;
    node.fy = node.y;
    node.fz = node.z;
  }
}

export function applyNodePositionToSource(sourceNodes, node) {
  if (!node?.id) return;
  const source = sourceNodes.find((item) => item.id === node.id);
  if (!source || source === node) return;
  source.x = node.x;
  source.y = node.y;
  source.z = node.z;
  source.fx = node.fx;
  source.fy = node.fy;
  source.fz = node.fz;
}

export function syncGraphPositionsFromVisible(sourceNodes, visibleNodes = []) {
  if (!visibleNodes.length) return;
  const byId = new Map(visibleNodes.map((node) => [node.id, node]));
  for (const node of sourceNodes) {
    const current = byId.get(node.id);
    if (!current || current.x == null) continue;
    copyGraphPosition(node, current);
  }
}

export function persistGraphNodePosition(layouts, sessionKey, node) {
  if (!node?.id || node.type === "contribution") return layouts;
  layouts[sessionKey] ||= {};
  layouts[sessionKey][node.id] = { x: node.x, y: node.y, z: node.z };
  return layouts;
}

export function clearGraphNodePosition(layouts, sessionKey, nodeId) {
  if (!nodeId || !layouts[sessionKey]?.[nodeId]) return layouts;
  delete layouts[sessionKey][nodeId];
  if (!Object.keys(layouts[sessionKey]).length) delete layouts[sessionKey];
  return layouts;
}

export function groupCommentsByEntity(comments) {
  return comments.reduce((groups, comment) => {
    if (!comment?.entityId || !comment?.id) return groups;
    groups[comment.entityId] ||= [];
    groups[comment.entityId].push(comment);
    return groups;
  }, {});
}

export function draftKey(entityId, parentId) {
  return `${entityId}::${parentId || "root"}`;
}

function copyGraphPosition(target, source) {
  target.x = source.x;
  target.y = source.y;
  target.z = source.z;
  if (source.vx != null) target.vx = source.vx;
  if (source.vy != null) target.vy = source.vy;
  if (source.vz != null) target.vz = source.vz;
  if (source.fx != null) target.fx = source.fx;
  if (source.fy != null) target.fy = source.fy;
  if (source.fz != null) target.fz = source.fz;
}
