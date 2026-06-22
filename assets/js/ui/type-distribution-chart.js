import {
  CONTRIBUTION_FILTER,
  TYPE_CONFIG
} from "../core/config.js";
import { escapeHtml } from "../core/utils.js";

export function getTypePresentation(type) {
  if (type === "contribution") return { ...CONTRIBUTION_FILTER, order: Number.MAX_SAFE_INTEGER };
  return TYPE_CONFIG[type] || null;
}

export function getDistributionEntries(nodes) {
  const counts = nodes.reduce((acc, node) => {
    if (!getTypePresentation(node.type)) return acc;
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {});
  const configurations = [
    ...Object.entries(TYPE_CONFIG),
    ["contribution", { ...CONTRIBUTION_FILTER, order: Number.MAX_SAFE_INTEGER }]
  ];
  return configurations
    .map(([type, config]) => ({ type, ...config, value: counts[type] || 0 }))
    .filter((entry) => entry.value > 0);
}

export function renderTypeDistributionChart({
  nodes,
  canvas,
  legend,
  chartState,
  chartCtor,
  allNodeCount,
  requestFrame = requestAnimationFrame
}) {
  if (!canvas) return;
  const entries = getDistributionEntries(nodes);
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  const signature = JSON.stringify(entries.map(({ label, value, color }) => [label, value, color]));
  if (!chartCtor) {
    canvas.hidden = true;
    const card = canvas.closest(".chart-card");
    card?.classList.add("chart-card-fallback");
    card?.setAttribute("data-chart-state", "fallback");
    renderLegend(legend, entries);
    return;
  }
  canvas.hidden = false;
  const card = canvas.closest(".chart-card");
  card?.classList.remove("chart-card-fallback");
  card?.setAttribute("data-chart-state", "chartjs");
  if (chartState.typeDistribution && chartState.typeDistributionSignature === signature && chartState.typeDistribution.canvas === canvas) {
    return;
  }
  chartState.typeDistribution?.destroy();
  chartState.typeDistributionSignature = signature;
  chartState.typeDistribution = new chartCtor(canvas, {
    type: "doughnut",
    data: {
      labels: entries.map((entry) => entry.label),
      datasets: [{
        data: entries.map((entry) => entry.value),
        backgroundColor: entries.map((entry) => entry.color),
        borderColor: "rgba(7, 16, 21, 0.92)",
        borderWidth: 3,
        hoverOffset: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 80,
      cutout: "66%",
      animation: { duration: 280 },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: true,
          callbacks: {
            label: (context) => `${context.label}: ${context.parsed}`
          }
        }
      }
    },
    plugins: [{
      id: "centerText",
      afterDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        ctx.save();
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text").trim() || "#edf7f6";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "700 20px system-ui";
        ctx.fillText(String(total), (chartArea.left + chartArea.right) / 2, (chartArea.top + chartArea.bottom) / 2 - 4);
        ctx.font = "600 11px system-ui";
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || "#9fb3b8";
        ctx.fillText(nodes.length === allNodeCount ? "éléments" : "liés", (chartArea.left + chartArea.right) / 2, (chartArea.top + chartArea.bottom) / 2 + 17);
        ctx.restore();
      }
    }]
  });
  renderLegend(legend, entries);
  requestFrame(() => chartState.typeDistribution?.resize());
}

function renderLegend(legend, entries) {
  if (!legend) return;
  legend.innerHTML = entries.map((entry) => `
    <span><i class="legend-dot" style="background:${entry.color}"></i><span class="legend-label">${escapeHtml(entry.label)}</span><strong>${entry.value}</strong></span>
  `).join("");
}
