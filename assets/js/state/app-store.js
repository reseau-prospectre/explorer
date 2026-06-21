export const V3_UI_KEY = "prospectre.ui.v3.final";

const DEFAULT_UI = Object.freeze({
  schemaVersion: 3,
  panels: {},
  externalWindows: {}
});

export class AppStore extends EventTarget {
  constructor({ initialState = {}, storage = localStorage } = {}) {
    super();
    this.storage = storage;
    this.state = {
      ...initialState,
      ui: loadJson(storage, V3_UI_KEY, DEFAULT_UI)
    };
    this.migrate();
  }

  getState() {
    return this.state;
  }

  subscribe(selector, callback) {
    let previous = selector(this.state);
    callback(previous, this.state);
    const listener = () => {
      const next = selector(this.state);
      if (Object.is(next, previous)) return;
      previous = next;
      callback(next, this.state);
    };
    this.addEventListener("change", listener);
    return () => this.removeEventListener("change", listener);
  }

  dispatch(action) {
    if (!action?.type) return this.state;
    const scope = action.scope || action.type.split(":")[0];
    if (action.type === "ui:panelPrefs") {
      this.state.ui.panels[action.id] = {
        ...(this.state.ui.panels[action.id] || {}),
        ...(action.patch || {})
      };
      this.persist("ui");
    } else if (action.type === "ui:externalWindow") {
      this.state.ui.externalWindows[action.id] = {
        ...(this.state.ui.externalWindows[action.id] || {}),
        ...(action.patch || {})
      };
      this.persist("ui");
    } else if (action.type === "state:patch") {
      Object.assign(this.state, action.patch || {});
      if (action.persist) this.persist(action.persist);
    }
    this.dispatchEvent(new CustomEvent("change", { detail: { action, scope, state: this.state } }));
    return this.state;
  }

  persist(scope) {
    if (scope === "ui") {
      this.storage.setItem(V3_UI_KEY, JSON.stringify(this.state.ui));
    }
  }

  migrate() {
    const ui = { ...DEFAULT_UI, ...(this.state.ui || {}) };
    ui.panels ||= {};
    ui.externalWindows ||= {};
    ui.schemaVersion = 3;
    this.state.ui = ui;
    this.persist("ui");
    return ui;
  }
}

export function createAppStore(options) {
  return new AppStore(options);
}

function loadJson(storage, key, fallback) {
  try {
    return JSON.parse(storage.getItem(key) || "null") ?? structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}
