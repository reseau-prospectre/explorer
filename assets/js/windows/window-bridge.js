const CHANNEL_NAME = "prospectre:v3";

export class WindowBridge {
  constructor({ getState, onMessage } = {}) {
    this.getState = getState || (() => ({}));
    this.onMessage = onMessage;
    this.handlers = new Map();
    this.external = parseExternalRoute();
    this.channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
    this.channel?.addEventListener("message", (event) => this.receive(event.data));
    window.addEventListener("message", (event) => this.receive(event.data));
  }

  openExternal({ kind, panelId = "", title = "PROSPECTRE" } = {}) {
    const url = new URL(window.location.href);
    url.searchParams.set("window", kind || "panel");
    if (panelId) url.searchParams.set("id", panelId);
    const features = "popup=yes,width=1280,height=820,menubar=no,toolbar=no,location=no";
    const child = window.open(url.href, `prospectre-${kind || panelId || "window"}`, features);
    this.publish("state:hydrate", { title, state: this.getState() });
    return child;
  }

  publish(type, payload = {}) {
    const message = {
      source: "prospectre",
      type,
      payload,
      sentAt: Date.now(),
      windowId: this.windowId
    };
    this.channel?.postMessage(message);
    if (window.opener && window.opener !== window) window.opener.postMessage(message, window.location.origin);
  }

  subscribe(type, handler) {
    const handlers = this.handlers.get(type) || new Set();
    handlers.add(handler);
    this.handlers.set(type, handlers);
    return () => handlers.delete(handler);
  }

  hydrateWindow() {
    if (!this.external) return null;
    document.documentElement.dataset.prospectreWindow = this.external.kind;
    document.body.dataset.prospectreWindow = this.external.kind;
    this.publish("state:request", this.external);
    return this.external;
  }

  receive(message) {
    if (!message || message.source !== "prospectre" || !message.type) return;
    this.onMessage?.(message);
    this.handlers.get(message.type)?.forEach((handler) => handler(message.payload, message));
  }
}

export function createWindowBridge(options) {
  return new WindowBridge(options);
}

function parseExternalRoute() {
  const params = new URLSearchParams(window.location.search);
  const kind = params.get("window");
  if (!kind) return null;
  return {
    kind,
    panelId: params.get("id") || "",
    opener: Boolean(window.opener)
  };
}
