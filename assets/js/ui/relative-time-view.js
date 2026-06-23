import { escapeHtml } from "../core/utils.js";

export function relativeTimeMarkup(timestamp, tag = "span", { dayjs } = {}) {
  if (!timestamp) return "";
  const absolute = new Date(timestamp).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  });
  return `<${tag} class="social-time" data-relative-time="${Number(timestamp)}" title="${escapeHtml(absolute)}">${escapeHtml(formatRelativeTime(timestamp, { dayjs }))}</${tag}>`;
}

export function formatRelativeTime(timestamp, { dayjs } = {}) {
  if (!timestamp) return "";
  if (dayjs) {
    const value = dayjs(timestamp).fromNow();
    return capitalize(value);
  }
  const seconds = Math.round((Number(timestamp) - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
  const ranges = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60]
  ];
  const [unit, divisor] = ranges.find(([, value]) => Math.abs(seconds) >= value) || ["second", 1];
  return capitalize(formatter.format(Math.round(seconds / divisor), unit));
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
