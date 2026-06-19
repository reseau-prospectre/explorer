import { Database } from "https://cdn.jsdelivr.net/npm/emoji-picker-element@1/index.js";
import fr from "https://cdn.jsdelivr.net/npm/emoji-picker-element@1/i18n/fr.js";

const DATA_SOURCE = "https://cdn.jsdelivr.net/npm/emoji-picker-element-data@1/fr/emojibase/data.json";
const DATABASE_LOCALE = "fr-FR";
const picker = document.querySelector("#emoji-picker");

if (picker) {
  picker.i18n = fr;
  picker.dataSource = DATA_SOURCE;
  picker.locale = DATABASE_LOCALE;

  const style = document.createElement("style");
  style.textContent = `
    .picker {
      border: 0;
    }

    .pad-top {
      display: none;
    }

    .search-row {
      gap: 4px;
      padding: 8px;
      border-bottom: var(--border-size) solid var(--border-color);
    }

    .nav {
      padding: 4px 2px 2px;
      border-bottom: var(--border-size) solid var(--border-color);
    }

    .indicator-wrapper {
      border-bottom: 0;
    }

    .tabpanel {
      padding-block: 4px;
    }

    .favorites {
      min-height: calc(var(--total-emoji-size) + 4px);
      padding-block: 2px;
      background: var(--background);
    }
  `;
  picker.shadowRoot.append(style);

  const database = new Database({
    dataSource: DATA_SOURCE,
    locale: DATABASE_LOCALE
  });
  const warmDatabase = () => database.ready().catch(() => {});

  if ("requestIdleCallback" in window) window.requestIdleCallback(warmDatabase, { timeout: 1500 });
  else window.setTimeout(warmDatabase, 0);
}
