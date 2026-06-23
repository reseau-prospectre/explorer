import { getId } from "../core/utils.js";

export function computeGraphQualityMetrics(focusNodes, scopeLinks) {
  const nodeIds = new Set(focusNodes.map((node) => node.id));
  const typeCount = new Set(focusNodes.map((node) => node.type).filter(Boolean)).size;
  const links = scopeLinks.filter((link) => nodeIds.has(getId(link.source)) && nodeIds.has(getId(link.target)));
  const nodeCount = nodeIds.size;
  const linkCount = links.length;
  const maxUndirectedLinks = nodeCount > 1 ? nodeCount * (nodeCount - 1) / 2 : 0;
  const densityValue = maxUndirectedLinks ? linkCount / maxUndirectedLinks : 0;
  const linksPerNode = nodeCount ? linkCount / nodeCount : 0;
  const averageDegree = nodeCount ? (2 * linkCount) / nodeCount : 0;
  const { componentCount, largestComponentSize, isolateCount, maxDegree, degreeStdDev } = computeVisibleComponents(nodeIds, links);
  const largestRatio = nodeCount ? largestComponentSize / nodeCount : 0;
  const isolateRatio = nodeCount ? isolateCount / nodeCount : 0;
  const hubDominance = averageDegree ? maxDegree / averageDegree : 0;
  const degreeVariation = averageDegree ? degreeStdDev / averageDegree : 0;
  const idealDegree = idealAverageDegree(nodeCount);
  const densityLimit = idealDensityLimit(nodeCount);
  const visualLoad = nodeCount * Math.max(1, averageDegree);

  const readabilityScore = clampScore(
    100
    - Math.max(0, nodeCount - 70) * 0.26
    - Math.max(0, nodeCount - 160) * 0.34
    - Math.max(0, visualLoad - 520) * 0.018
    - Math.max(0, densityValue - densityLimit) * 85
  );
  const cohesionScore = clampScore(
    largestRatio * 82
    + (isolateCount === 0 ? 12 : 0)
    + (componentCount === 1 ? 6 : 0)
    - Math.max(0, componentCount - 1) * 7
    - isolateRatio * 55
  );
  const meshScore = clampScore(
    100
    - Math.abs(averageDegree - idealDegree) * 8
    - Math.max(0, averageDegree - idealDegree * 1.9) * 10
    - Math.max(0, densityValue - densityLimit) * 80
    - isolateRatio * 35
  );
  const balanceScore = clampScore(
    100
    - Math.max(0, hubDominance - 3.6) * 12
    - Math.max(0, degreeVariation - 0.9) * 24
    - isolateRatio * 35
  );
  const overallScore = Math.round(readabilityScore * 0.30 + cohesionScore * 0.30 + meshScore * 0.22 + balanceScore * 0.18);

  return {
    nodeCount,
    linkCount,
    typeCount,
    componentCount,
    isolateCount,
    densityValue,
    linksPerNode,
    averageDegree,
    largestComponentSize,
    largestRatio,
    maxDegree,
    degreeStdDev,
    hubDominance,
    readability: gradeMetric(readabilityScore),
    cohesion: gradeMetric(cohesionScore),
    mesh: gradeMetric(meshScore),
    balance: gradeMetric(balanceScore),
    overall: gradeMetric(overallScore)
  };
}

function computeVisibleComponents(nodeIds, links) {
  const adjacency = new Map([...nodeIds].map((id) => [id, new Set()]));
  for (const link of links) {
    const source = getId(link.source);
    const target = getId(link.target);
    if (!nodeIds.has(source) || !nodeIds.has(target)) continue;
    adjacency.get(source).add(target);
    adjacency.get(target).add(source);
  }
  const seen = new Set();
  let componentCount = 0;
  let largestComponentSize = 0;
  let isolateCount = 0;
  let degreeTotal = 0;
  let maxDegree = 0;
  const degrees = [];
  for (const id of nodeIds) {
    const degree = adjacency.get(id)?.size || 0;
    degrees.push(degree);
    degreeTotal += degree;
    maxDegree = Math.max(maxDegree, degree);
    if (degree === 0) isolateCount += 1;
    if (seen.has(id)) continue;
    componentCount += 1;
    const queue = [id];
    let size = 0;
    seen.add(id);
    while (queue.length) {
      const current = queue.shift();
      size += 1;
      for (const next of adjacency.get(current) || []) {
        if (seen.has(next)) continue;
        seen.add(next);
        queue.push(next);
      }
    }
    largestComponentSize = Math.max(largestComponentSize, size);
  }
  const meanDegree = nodeIds.size ? degreeTotal / nodeIds.size : 0;
  const degreeVariance = nodeIds.size
    ? degrees.reduce((sum, degree) => sum + (degree - meanDegree) ** 2, 0) / nodeIds.size
    : 0;
  return { componentCount, largestComponentSize, isolateCount, maxDegree, degreeStdDev: Math.sqrt(degreeVariance) };
}

function idealAverageDegree(nodeCount) {
  if (nodeCount < 25) return 5;
  if (nodeCount < 60) return 4.2;
  if (nodeCount < 120) return 3.5;
  if (nodeCount < 220) return 3.1;
  return 2.8;
}

function idealDensityLimit(nodeCount) {
  if (nodeCount < 25) return 0.34;
  if (nodeCount < 60) return 0.18;
  if (nodeCount < 120) return 0.10;
  if (nodeCount < 220) return 0.065;
  return 0.04;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function gradeMetric(score) {
  if (score >= 85) return { score, grade: "A" };
  if (score >= 70) return { score, grade: "B" };
  if (score >= 55) return { score, grade: "C" };
  if (score >= 40) return { score, grade: "D" };
  return { score, grade: "E" };
}

export function formatGraphNumber(value) {
  if (!Number.isFinite(value)) return "0";
  return value >= 10 ? String(Math.round(value)) : value.toFixed(1).replace(".", ",");
}

export function formatCompactNumber(value) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number(value) || 0);
}
