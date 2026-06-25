import { escapeHtml } from "../core/utils.js";

export function renderToast(message, { tone = inferTone(message), icon = iconForTone(tone) } = {}) {
  return `
    <div class="toast-content ps-toast__content">
      <i class="ps-toast__icon" aria-hidden="true">${escapeHtml(icon)}</i>
      <span class="ps-toast__message">${escapeHtml(message)}</span>
      <button class="toast-close" type="button" aria-label="Fermer la notification"><i>close</i></button>
    </div>
    <span class="toast-progress ps-toast__progress" aria-hidden="true"></span>
  `;
}

function inferTone(message = "") {
  return /erreur|impossible|indisponible|incomplet|annul/i.test(message)
    ? "danger"
    : /chargement|initialisation|activation|import|export/i.test(message)
      ? "loading"
      : "info";
}

function iconForTone(tone) {
  return {
    danger: "error",
    loading: "progress_activity",
    success: "check_circle",
    warning: "warning",
    info: "notifications"
  }[tone] || "notifications";
}
