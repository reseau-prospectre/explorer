import { createAppStore } from "../state/app-store.js";
import { createWindowBridge } from "../windows/window-bridge.js";

export function bootstrapProspectre({ state, theme, onBridgeMessage }) {
  const store = createAppStore({
    initialState: {
      project: null,
      selection: null,
      theme
    }
  });
  const bridge = createWindowBridge({
    getState: () => ({
      project: {
        manifest: state.projectManifest,
        datasetId: state.datasetId,
        manifestUrl: state.projectManifestUrl
      },
      selection: {
        selectedId: state.selectedId,
        selectedLinkKey: state.selectedLinkKey,
        activeTab: state.activeTab
      },
      theme: document.documentElement.dataset.theme || theme,
      panels: state.panelManager?.getLayout?.() || {}
    }),
    onMessage: onBridgeMessage
  });
  const externalWindow = bridge.hydrateWindow();
  document.querySelector("#app")?.classList.toggle("is-external-window", Boolean(externalWindow));
  return { store, bridge, externalWindow };
}
