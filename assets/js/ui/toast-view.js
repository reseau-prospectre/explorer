import { escapeHtml } from "../core/utils.js";

export function renderToast(message) {
  return `
    <div class="toast-content">
      <i aria-hidden="true">notifications</i>
      <span>${escapeHtml(message)}</span>
      <button class="toast-close" type="button" aria-label="Fermer la notification"><i>close</i></button>
    </div>
    <span class="toast-progress" aria-hidden="true"></span>
  `;
}
