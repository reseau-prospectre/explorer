import { escapeHtml } from "../core/utils.js";

export function renderProfileIdentity({ profile, identity, avatarHtml }) {
  return `
    ${avatarHtml}
    <div class="ps-meta-item"><strong>${escapeHtml(identity.label)}</strong><span>${escapeHtml(identity.detail)}</span></div>
    <span class="account-state ps-chip ${identity.connected ? "connected" : ""}">${escapeHtml(identity.connected ? "Actif" : "Local")}</span>
  `;
}

export function avatarMarkup(profile, extraStyle = "") {
  const color = profile?.color || "#a7f3d0";
  const photoURL = resolveAvatarAssetURL(profile?.photoURL);
  const fallback = escapeHtml(profile?.avatar || "?");
  const image = photoURL
    ? `<span class="avatar-fallback">${fallback}</span><img src="${escapeHtml(photoURL)}" alt="" loading="lazy" decoding="async" draggable="false" referrerpolicy="no-referrer" onerror="this.remove()">`
    : fallback;
  return `<span class="avatar-chip ps-avatar${photoURL ? " has-photo" : ""}" style="background-color:${color};${extraStyle}">${image}</span>`;
}

export function applyAvatarElement(element, profile) {
  if (!element) return;
  const photoURL = resolveAvatarAssetURL(profile?.photoURL);
  element.classList.add("ps-avatar");
  element.classList.toggle("has-photo", Boolean(photoURL));
  element.style.background = profile?.color || "#a7f3d0";
  element.replaceChildren();
  if (photoURL) {
    const image = document.createElement("img");
    image.src = photoURL;
    image.alt = "";
    image.decoding = "async";
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => {
      element.classList.remove("has-photo");
      element.textContent = profile?.avatar || "?";
    }, { once: true });
    element.append(image);
  } else {
    element.textContent = profile?.avatar || "?";
  }
}

export function resolveAvatarAssetURL(url) {
  return url || null;
}
