import { escapeHtml } from "../core/utils.js";

function defaultCompactNumber(value) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function defaultGraphNumber(value) {
  if (!Number.isFinite(value)) return "0";
  return value >= 10 ? String(Math.round(value)) : value.toFixed(1).replace(".", ",");
}

export function renderGraphQualityCard({
  metrics,
  scopeLabel,
  formatCompactNumber = defaultCompactNumber,
  formatGraphNumber = defaultGraphNumber
}) {
  return `
    <article class="project-meta-card graph-quality-card ps-card ps-surface">
      <div class="graph-quality-header">
        <div>
          <p class="kicker">Diagnostic graphe</p>
          <strong>${escapeHtml(scopeLabel)}</strong>
        </div>
        <div class="graph-quality-overall">
          <span>Score global</span>
          ${renderGraphScoreBadge(metrics.overall.grade, "Score global", "large")}
        </div>
      </div>
      <div class="graph-quality-scores">
        ${renderGraphQualityScore("Lisibilité", metrics.readability, "Évalue si le volume visible reste lisible sans filtrage immédiat.")}
        ${renderGraphQualityScore("Cohésion", metrics.cohesion, "Mesure la part du graphe réellement reliée au groupe principal.")}
        ${renderGraphQualityScore("Maillage", metrics.mesh, "Observe si le degré moyen donne assez de chemins sans saturer la lecture.")}
        ${renderGraphQualityScore("Équilibre", metrics.balance, "Repère les graphes trop dominés par un seul hub ou des degrés très dispersés.")}
      </div>
      <div class="graph-quality-facts">
        ${renderGraphQualityFact(formatCompactNumber(metrics.nodeCount), "éléments")}
        ${renderGraphQualityFact(formatCompactNumber(metrics.linkCount), "liens")}
        ${renderGraphQualityFact(formatGraphNumber(metrics.linksPerNode), "liens / élément")}
        ${renderGraphQualityFact(formatCompactNumber(metrics.typeCount), "types")}
        ${renderGraphQualityFact(`${Math.round(metrics.largestRatio * 100)}%`, "couverture")}
        ${renderGraphQualityFact(formatCompactNumber(metrics.maxDegree), "hub max")}
        ${metrics.isolateCount ? renderGraphQualityFact(formatCompactNumber(metrics.isolateCount), "isolats", true) : ""}
      </div>
    </article>
  `;
}

function renderGraphQualityScore(label, metric, hint) {
  return `
    <div class="graph-quality-score grade-${metric.grade}">
      <div class="graph-quality-score-head">
        <strong>${escapeHtml(label)}</strong>
        <button class="graph-quality-info" type="button" aria-label="${escapeHtml(`Information : ${label}`)}">
          <i>info</i>
          <span class="tooltip top max">${escapeHtml(hint)}</span>
        </button>
      </div>
      ${renderGraphScoreBadge(metric.grade, label)}
    </div>
  `;
}

function renderGraphQualityFact(value, label, danger = false) {
  return `
    <span class="graph-quality-fact${danger ? " is-warning" : ""}">
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(label)}</small>
    </span>
  `;
}

function renderGraphScoreBadge(grade, label, variant = "") {
  const grades = ["A", "B", "C", "D", "E"];
  const activeIndex = Math.max(0, grades.indexOf(grade));
  const colors = ["#038141", "#85bb2f", "#fecb02", "#ee8100", "#e63e11"];
  const segments = grades.map((item, index) => {
    const active = index === activeIndex;
    const x = 2 + index * 22;
    const y = active ? 1 : 5;
    const height = active ? 24 : 16;
    const width = active ? 26 : 22;
    const textX = x + width / 2;
    return `
      <g class="${active ? "is-active" : ""}">
        <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" fill="${colors[index]}"></rect>
        <text x="${textX}" y="${active ? "18" : "17"}" text-anchor="middle">${item}</text>
      </g>
    `;
  }).join("");
  return `
    <svg class="graph-score-badge ${variant ? `is-${variant}` : ""} grade-${grade}" viewBox="0 0 116 28" role="img" aria-label="${escapeHtml(`${label} ${grade}`)}">
      <title>${escapeHtml(`${label} ${grade}`)}</title>
      ${segments}
    </svg>
  `;
}
