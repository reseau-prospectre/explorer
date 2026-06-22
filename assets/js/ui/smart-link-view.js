import { escapeHtml, shortLabel } from "../core/utils.js";

export function decorateSmartLinks(root = document) {
  root.querySelectorAll?.('a[href^="http://"], a[href^="https://"]').forEach((link) => {
    if (link.dataset.smartLink) return;
    link.dataset.smartLink = link.href;
    link.rel = "noopener noreferrer";
    link.target = "_blank";
  });
}

export function renderSmartText(text) {
  const source = String(text || "");
  const urlPattern = /(https?:\/\/[^\s<>"')\]]+)/g;
  let cursor = 0;
  let html = "";
  for (const match of source.matchAll(urlPattern)) {
    const url = match[0];
    html += escapeHtml(source.slice(cursor, match.index));
    html += `<a href="${escapeHtml(url)}" data-smart-link="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(shortLabel(url, 48))}</a>`;
    cursor = match.index + url.length;
  }
  html += escapeHtml(source.slice(cursor));
  return html;
}

export function renderLinkPreview(url, title) {
  let parsed = null;
  try {
    parsed = new URL(url);
  } catch {
    parsed = null;
  }
  const host = parsed?.hostname?.replace(/^www\./, "") || "Lien externe";
  const initial = host.charAt(0).toUpperCase() || "L";
  return `
    <div class="link-preview-head">
      <span class="link-preview-icon">${escapeHtml(initial)}</span>
      <div>
        <strong>${escapeHtml(shortLabel(title || host, 76))}</strong>
        <span>${escapeHtml(host)}</span>
      </div>
    </div>
    <p>${escapeHtml(shortLabel(url, 120))}</p>
    <div class="link-preview-actions ps-action-row">
      <button class="ps-button" type="button" data-link-action="open"><i>open_in_new</i>Ouvrir</button>
      <button class="ps-button" type="button" data-link-action="copy"><i>content_copy</i>Copier</button>
      <button class="ps-button" type="button" data-link-action="embed"><i>fullscreen</i>Intégrer</button>
    </div>
  `;
}
