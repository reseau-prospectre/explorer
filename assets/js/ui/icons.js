const ICONS = Object.freeze({
  activity: "notifications",
  analytics: "analytics",
  close: "close",
  collapse: "expand_more",
  detach: "open_in_full",
  dock: "close_fullscreen",
  dockBottom: "keyboard_arrow_down",
  dockLeft: "keyboard_arrow_left",
  dockRight: "keyboard_arrow_right",
  dockTop: "keyboard_arrow_up",
  drag: "drag_indicator",
  error: "error",
  externalWindow: "open_in_new",
  fitGraph: "fit_screen",
  graph: "hub",
  info: "info",
  panel: "dashboard_customize",
  profile: "account_circle",
  restore: "keyboard_return",
  search: "search",
  settings: "tune",
  sheet: "vertical_align_bottom",
  undock: "close_fullscreen"
});

export function icon(name) {
  return ICONS[name] || name || "circle";
}

export function iconMarkup(name, attrs = "") {
  return `<i ${attrs} aria-hidden="true">${icon(name)}</i>`;
}

export function panelEdgeIcon(edge) {
  return {
    left: icon("dockLeft"),
    right: icon("dockRight"),
    top: icon("dockTop"),
    bottom: icon("dockBottom")
  }[edge] || icon("dock");
}
