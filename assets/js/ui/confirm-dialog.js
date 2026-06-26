import { escapeHtml } from "../core/utils.js";

let activeDialog = null;

export function requestChoice({
  title,
  message = "",
  details = "",
  choices = [],
  tone = "default"
} = {}) {
  closeActiveDialog(null);
  return new Promise((resolve) => {
    const scrim = document.createElement("div");
    scrim.className = "confirm-scrim";
    const dialog = document.createElement("section");
    dialog.className = `confirm-dialog confirm-dialog--${tone} ps-modal ps-surface`;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", title || "Confirmation");
    dialog.innerHTML = `
      <div class="confirm-dialog__head ps-modal__header">
        <i>${tone === "danger" ? "warning" : "help"}</i>
        <div>
          <h2>${escapeHtml(title || "Confirmer")}</h2>
          ${message ? `<p>${escapeHtml(message)}</p>` : ""}
        </div>
      </div>
      ${details ? `<div class="confirm-dialog__details ps-modal__body">${escapeHtml(details)}</div>` : ""}
      <div class="confirm-dialog__actions ps-modal__footer">
        ${choices.map((choice, index) => `
          <button type="button" class="${choice.kind === "primary" ? "primary-button" : choice.kind === "danger" ? "danger-button" : "secondary-button"}" data-choice-index="${index}">
            ${choice.icon ? `<i>${escapeHtml(choice.icon)}</i>` : ""}
            <span>${escapeHtml(choice.label)}</span>
          </button>
        `).join("")}
      </div>
    `;

    const cleanup = (value) => {
      document.removeEventListener("keydown", onKeyDown);
      scrim.remove();
      activeDialog = null;
      resolve(value);
    };
    const choose = (choice) => cleanup(choice?.value ?? null);
    const onKeyDown = (event) => {
      if (event.key === "Escape") cleanup(null);
    };
    scrim.addEventListener("click", (event) => {
      if (event.target === scrim) cleanup(null);
    });
    dialog.addEventListener("click", (event) => {
      const button = event.target.closest("[data-choice-index]");
      if (!button) return;
      choose(choices[Number(button.dataset.choiceIndex)]);
    });
    scrim.append(dialog);
    document.body.append(scrim);
    document.addEventListener("keydown", onKeyDown);
    activeDialog = cleanup;
    requestAnimationFrame(() => {
      dialog.querySelector("[data-choice-index]")?.focus();
    });
  });
}

export function confirmAction(options = {}) {
  return requestChoice({
    ...options,
    choices: options.choices || [
      { label: options.confirmLabel || "Confirmer", value: true, kind: options.tone === "danger" ? "danger" : "primary", icon: options.confirmIcon },
      { label: options.cancelLabel || "Annuler", value: false, kind: "secondary", icon: "close" }
    ]
  });
}

function closeActiveDialog(value) {
  activeDialog?.(value);
}
