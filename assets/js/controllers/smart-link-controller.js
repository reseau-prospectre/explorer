import { shortLabel } from "../core/utils.js";
import { renderLinkPreview } from "../ui/smart-link-view.js";

export function createSmartLinkController({
  els,
  state,
  heartPoints,
  recordHeartEvent,
  showToast,
  windowRef = window,
  navigatorRef = navigator
}) {
  function handleHover(event) {
    const link = event.target.closest?.("[data-smart-link]");
    if (!link || link === state.linkPreview.anchor) return;
    openPreview(link, { passive: true });
  }

  function handleFocus(event) {
    const link = event.target.closest?.("[data-smart-link]");
    if (link) openPreview(link, { passive: true });
  }

  function handleClick(event) {
    const link = event.target.closest?.("[data-smart-link]");
    const action = event.target.closest?.("[data-link-action]");
    if (action) {
      event.preventDefault();
      runAction(action.dataset.linkAction);
      return;
    }
    if (!link) return;
    event.preventDefault();
    openPreview(link);
  }

  function openPreview(link, options = {}) {
    const url = link?.dataset.smartLink || link?.href;
    if (!url || !els.linkPreviewPopover) return;
    state.linkPreview = {
      url,
      title: link.textContent?.trim() || url,
      anchor: link
    };
    els.linkPreviewPopover.innerHTML = renderLinkPreview(url, state.linkPreview.title);
    els.linkPreviewPopover.classList.remove("hidden");
    positionPreview(link);
    if (!options.passive) recordHeartEvent("linkPreview", heartPoints.linkPreview);
  }

  function positionPreview(anchor) {
    if (!anchor || !els.linkPreviewPopover) return;
    const rect = anchor.getBoundingClientRect();
    const popover = els.linkPreviewPopover;
    const width = Math.min(360, windowRef.innerWidth - 20);
    popover.style.width = `${width}px`;
    const height = popover.offsetHeight || 180;
    const left = Math.max(10, Math.min(windowRef.innerWidth - width - 10, rect.left));
    const top = rect.bottom + height + 10 < windowRef.innerHeight
      ? rect.bottom + 10
      : Math.max(10, rect.top - height - 10);
    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
  }

  async function runAction(action) {
    const url = state.linkPreview.url;
    if (!url) return;
    if (action === "open") {
      recordHeartEvent("linkOpen", heartPoints.linkOpen);
      windowRef.open(url, "_blank", "noopener,noreferrer");
    }
    if (action === "copy") {
      try {
        await navigatorRef.clipboard.writeText(url);
        recordHeartEvent("linkCopy", heartPoints.linkCopy);
        showToast("Lien copié");
      } catch {
        showToast("Copie indisponible");
      }
    }
    if (action === "embed") {
      recordHeartEvent("linkEmbed", heartPoints.linkEmbed);
      openEmbed(url, state.linkPreview.title);
    }
  }

  function closePreview() {
    els.linkPreviewPopover?.classList.add("hidden");
  }

  function openEmbed(url, title = "Lien") {
    if (!els.linkEmbedModal || !els.linkEmbedFrame) return;
    closePreview();
    els.linkEmbedTitle.textContent = shortLabel(title || url, 90);
    els.linkEmbedFrame.src = url;
    els.linkEmbedModal.classList.remove("hidden");
  }

  function closeEmbed() {
    els.linkEmbedModal?.classList.add("hidden");
    if (els.linkEmbedFrame) els.linkEmbedFrame.src = "about:blank";
  }

  return {
    handleHover,
    handleFocus,
    handleClick,
    openPreview,
    positionPreview,
    runAction,
    closePreview,
    openEmbed,
    closeEmbed
  };
}
