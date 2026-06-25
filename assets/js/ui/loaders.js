export function createInlineLoader(message = "Chargement…") {
  const loader = document.createElement("div");
  loader.className = "prospectre-loader ps-progress";
  loader.setAttribute("role", "status");
  loader.innerHTML = `<span class="ps-progress__spinner" aria-hidden="true"></span><strong>${escapeHtml(message)}</strong>`;
  return loader;
}

export async function loadWhenNeeded(test, loader) {
  if (test()) return true;
  await loader();
  return test();
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}
