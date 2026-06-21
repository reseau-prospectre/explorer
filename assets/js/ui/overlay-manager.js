export class OverlayManager {
  constructor() {
    this.cleanups = new Set();
    this.instances = new Map();
  }

  open({ id, kind = "popover", anchor, content, element, placement = "auto", distance = 8, className = "", panelAware = true } = {}) {
    const overlayId = id || `${kind}-${crypto.randomUUID?.() || Date.now()}`;
    this.close(overlayId);
    const overlay = element || document.createElement("div");
    overlay.dataset.overlayId = overlayId;
    overlay.dataset.overlayKind = kind;
    overlay.classList.add("prospectre-overlay", `prospectre-overlay--${kind}`);
    if (className) overlay.classList.add(...className.split(/\s+/).filter(Boolean));
    if (content instanceof Node) overlay.replaceChildren(content);
    else if (content !== undefined) overlay.innerHTML = String(content);
    if (!overlay.isConnected) document.body.append(overlay);
    overlay.hidden = false;
    const cleanup = anchor ? this.position(anchor, overlay, { placement, distance, panelAware }) : () => {};
    this.instances.set(overlayId, { overlay, cleanup, owned: !element });
    return { id: overlayId, element: overlay, close: () => this.close(overlayId) };
  }

  close(idOrKind) {
    if (!idOrKind) {
      for (const id of [...this.instances.keys()]) this.close(id);
      return;
    }
    for (const [id, instance] of [...this.instances.entries()]) {
      if (id !== idOrKind && instance.overlay.dataset.overlayKind !== idOrKind) continue;
      instance.cleanup?.();
      if (instance.owned) instance.overlay.remove();
      else instance.overlay.hidden = true;
      this.instances.delete(id);
    }
  }

  position(anchor, overlay, { placement = "auto", distance = 8, panelAware = true } = {}) {
    const update = () => {
      if (!anchor?.isConnected || !overlay?.isConnected) {
        cleanup();
        return;
      }
      const anchorRect = anchor.getBoundingClientRect();
      const overlayRect = overlay.getBoundingClientRect();
      const coordinates = computeCoordinates(anchorRect, overlayRect, placement, distance);
      overlay.style.position = "fixed";
      overlay.style.zIndex = panelAware ? "220" : "80";
      overlay.style.left = `${coordinates.left}px`;
      overlay.style.top = `${coordinates.top}px`;
      overlay.dataset.placement = coordinates.placement;
    };
    const cleanup = () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      this.cleanups.delete(cleanup);
    };
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true, capture: true });
    this.cleanups.add(cleanup);
    requestAnimationFrame(update);
    return cleanup;
  }

  destroy() {
    this.close();
    for (const cleanup of [...this.cleanups]) cleanup();
  }
}

export const overlays = new OverlayManager();

function computeCoordinates(anchor, overlay, placement, distance) {
  const candidates = {
    top: {
      left: anchor.left + (anchor.width - overlay.width) / 2,
      top: anchor.top - overlay.height - distance
    },
    bottom: {
      left: anchor.left + (anchor.width - overlay.width) / 2,
      top: anchor.bottom + distance
    },
    left: {
      left: anchor.left - overlay.width - distance,
      top: anchor.top + (anchor.height - overlay.height) / 2
    },
    right: {
      left: anchor.right + distance,
      top: anchor.top + (anchor.height - overlay.height) / 2
    }
  };
  const order = placement === "auto"
    ? ["bottom", "top", "right", "left"]
    : [placement, "bottom", "top", "right", "left"].filter((item, index, list) => list.indexOf(item) === index);
  const margin = 8;
  const fits = (candidate) => (
    candidate.left >= margin &&
    candidate.top >= margin &&
    candidate.left + overlay.width <= window.innerWidth - margin &&
    candidate.top + overlay.height <= window.innerHeight - margin
  );
  const selectedPlacement = order.find((item) => fits(candidates[item])) || order[0];
  const selected = candidates[selectedPlacement] || candidates.top;
  return {
    placement: selectedPlacement,
    left: Math.round(Math.max(margin, Math.min(window.innerWidth - overlay.width - margin, selected.left))),
    top: Math.round(Math.max(margin, Math.min(window.innerHeight - overlay.height - margin, selected.top)))
  };
}
