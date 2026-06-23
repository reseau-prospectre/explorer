import { getId } from "../core/utils.js";

export function getScoreBoost(entity) {
  const score = Math.max(Number(entity.influence_score || 0), Number(entity.dependence_score || 0));
  return score ? score * 0.32 : 0;
}

export function getLinkDistance(link, nodes) {
  const source = nodes.find((node) => node.id === getId(link.source));
  const target = nodes.find((node) => node.id === getId(link.target));
  return Math.min(112, 68 + Math.max(source?.size || 8, target?.size || 8) * 1.3);
}

export function getLinkTargetColor(link, { entities, typeConfig }) {
  const target = entities.get(getId(link.target));
  return typeConfig[target?.type]?.color || "#e0a336";
}

export function getLinkKey(link) {
  return `${getId(link.source)}|${getId(link.target)}|${link.type || "related_to"}`;
}
