export function createInlineLoader(message = "Chargement…") {
  const loader = document.createElement("div");
  loader.className = "prospectre-loader";
  loader.setAttribute("role", "status");
  loader.innerHTML = `<span aria-hidden="true"></span><strong>${escapeHtml(message)}</strong>`;
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
