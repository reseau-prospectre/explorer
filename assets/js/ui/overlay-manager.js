export class OverlayManager {
  constructor() {
    this.cleanups = new Set();
  }

  position(anchor, overlay, { placement = "top", distance = 8 } = {}) {
    const update = () => {
      if (!anchor?.isConnected || !overlay?.isConnected) {
        cleanup();
        return;
      }
      const anchorRect = anchor.getBoundingClientRect();
      const overlayRect = overlay.getBoundingClientRect();
      const coordinates = computeCoordinates(anchorRect, overlayRect, placement, distance);
      overlay.style.position = "fixed";
      overlay.style.left = `${coordinates.left}px`;
      overlay.style.top = `${coordinates.top}px`;
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
    for (const cleanup of [...this.cleanups]) cleanup();
  }
}

export const overlays = new OverlayManager();

function computeCoordinates(anchor, overlay, placement, distance) {
  let left = anchor.left + (anchor.width - overlay.width) / 2;
  let top = anchor.top - overlay.height - distance;
  if (placement === "bottom") top = anchor.bottom + distance;
  if (placement === "left") {
    left = anchor.left - overlay.width - distance;
    top = anchor.top + (anchor.height - overlay.height) / 2;
  }
  if (placement === "right") {
    left = anchor.right + distance;
    top = anchor.top + (anchor.height - overlay.height) / 2;
  }
  return {
    left: Math.round(Math.max(8, Math.min(window.innerWidth - overlay.width - 8, left))),
    top: Math.round(Math.max(8, Math.min(window.innerHeight - overlay.height - 8, top)))
  };
}
