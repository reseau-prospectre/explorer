import { escapeHtml } from "../core/utils.js";

const COVER_FIELDS = Object.freeze(["cover", "image", "illustration", "thumbnail", "hero", "coverImage", "image_cover"]);

export function renderOverviewDetailsView({ manifest, datasetId, generatedAt, fileCount, coverUrl = "", manifestPath = "manifest.json" }) {
  return `
    <article class="readable-card overview-details-card ps-card ps-surface">
      <button class="card-hover-action ps-icon-button" type="button" data-overview-edit-action aria-label="Modifier la vue d’ensemble">
        <i>edit</i>
      </button>
      ${coverUrl ? `<figure class="overview-cover-display"><img src="${escapeHtml(coverUrl)}" alt=""></figure>` : ""}
      ${manifest.description ? `<p class="lead">${escapeHtml(manifest.description)}</p>` : ""}
      <h2>${escapeHtml(manifest.titre || manifest.id || "Vue d’ensemble")}</h2>
      <dl class="overview-detail-list">
        <div><dt>Identifiant</dt><dd>${escapeHtml(manifest.id || datasetId || "Non renseigné")}</dd></div>
        <div><dt>Version</dt><dd>${escapeHtml(manifest.version || "Non renseignée")}</dd></div>
        <div><dt>Génération</dt><dd>${escapeHtml(generatedAt || "Non renseignée")}</dd></div>
        <div><dt>Fichiers chargés</dt><dd>${fileCount}</dd></div>
      </dl>
    </article>
    <footer class="reading-actions reading-footer">
      <span class="quiet">${escapeHtml(manifestPath || "manifest.json")}</span>
      <div class="reading-footer-actions">
        <div class="edit-toggle">
          <i>edit</i>
          <span>Modifier</span>
          <label class="ps-switch" aria-label="Modifier les détails locaux du projet">
            <input id="overview-edit-toggle" type="checkbox">
            <span class="ps-switch__track" aria-hidden="true"><span class="ps-switch__thumb"></span></span>
          </label>
          <span class="tooltip top">Modifier les détails locaux du projet</span>
        </div>
      </div>
    </footer>
  `;
}

export function renderOverviewEditView({ manifest, datasetId, generatedAt, fileCount, showLocalNotice = true, coverPreviewUrl = "" }) {
  const coverValue = getManifestCover(manifest);
  const previewUrl = coverPreviewUrl || coverValue;
  const coverEnabled = Boolean(coverValue);
  return `
    <section class="edit-surface overview-edit-surface">
      <header class="edit-surface-head overview-edit-head">
        <div class="overview-edit-head__row edit-surface-head__row">
          <div class="edit-surface-title">
            <p class="kicker">Édition locale</p>
            <h2>${escapeHtml(manifest.titre || manifest.id || "Vue d’ensemble")}</h2>
          </div>
          <label class="edit-toggle">
            <i>edit</i>
            <span>Modifier</span>
            <span class="ps-switch" aria-label="Quitter le mode édition">
              <input id="overview-edit-toggle" type="checkbox" checked>
              <span class="ps-switch__track" aria-hidden="true"><span class="ps-switch__thumb"></span></span>
            </span>
          </label>
        </div>
        ${showLocalNotice ? `<div class="local-edit-warning local-edit-warning--dismissable ps-chip" data-overview-edit-notice><i>info</i><span>Les changements sont enregistrés localement ici, puis exportables comme nouveau pack.</span><button class="ps-icon-button" type="button" data-dismiss-overview-edit-notice aria-label="Masquer ce rappel"><i>close</i></button></div>` : ""}
      </header>
      <div class="edit-card">
        <label class="field-label">Titre du projet
          <input id="overview-title" class="text-field" type="text" value="${escapeHtml(manifest.titre || "")}" placeholder="Titre affiché du projet">
        </label>
      </div>
      <section class="edit-card edit-option-card ${manifest.description ? "is-enabled" : ""}" data-edit-option="overview-description">
        <div class="edit-card-head">
          <div>
            <p class="kicker">Option</p>
            <h3>Description</h3>
            <p>Texte libre du manifeste PROSPECTRE. Vide par défaut pour les imports Moodle.</p>
          </div>
          <label class="ps-switch" aria-label="Activer la description">
            <input id="overview-description-toggle" type="checkbox"${manifest.description ? " checked" : ""}>
            <span class="ps-switch__track" aria-hidden="true"><span class="ps-switch__thumb"></span></span>
          </label>
        </div>
        <textarea id="overview-description" rows="6"${manifest.description ? "" : " disabled"} placeholder="Ajouter une description du projet…">${escapeHtml(manifest.description || "")}</textarea>
      </section>
      <section class="edit-card edit-option-card overview-cover-card ${coverEnabled ? "is-enabled" : ""}" data-edit-option="overview-cover">
        <div class="edit-card-head">
          <div>
            <p class="kicker">Catalogue</p>
            <h3>Image de couverture</h3>
            <p>Image utilisée par la Vue d’ensemble et les cartes de bibliothèque du pack.</p>
          </div>
          <label class="ps-switch" aria-label="Activer l’image de couverture">
            <input id="overview-cover-toggle" type="checkbox"${coverEnabled ? " checked" : ""}>
            <span class="ps-switch__track" aria-hidden="true"><span class="ps-switch__thumb"></span></span>
          </label>
        </div>
          <div class="overview-cover-editor ${coverEnabled ? "" : "hidden"}">
            <figure class="overview-cover-preview ${coverValue ? "has-image" : "is-empty"}">
            ${coverValue ? `<img src="${escapeHtml(previewUrl)}" alt="">` : `<span><i>image</i><small>Aucune couverture</small></span>`}
          </figure>
          <label class="field-label">URL ou chemin d’asset
            <input id="overview-cover-source" class="text-field" type="text" value="${escapeHtml(coverValue)}" placeholder="https://… ou assets/uploads/cover.png">
          </label>
          <div class="graph-image-actions overview-cover-actions">
            <label class="secondary-button compact-action">
              <i>add_photo_alternate</i><span>Ajouter une image</span>
              <input id="overview-cover-file" type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.svg,image/*">
            </label>
            <button id="clear-overview-cover" class="ghost-button" type="button"><i>backspace</i><span>Vider</span></button>
          </div>
        </div>
      </section>
      <section class="edit-card overview-static-meta">
        <div class="edit-card-head">
          <div>
            <p class="kicker">Métadonnées</p>
            <h3>Lecture seule</h3>
          </div>
        </div>
        <dl class="overview-detail-list">
          <div><dt>Identifiant</dt><dd>${escapeHtml(manifest.id || datasetId || "Non renseigné")}</dd></div>
          <div><dt>Version</dt><dd>${escapeHtml(manifest.version || "Non renseignée")}</dd></div>
          <div><dt>Génération</dt><dd>${escapeHtml(generatedAt || "Non renseignée")}</dd></div>
          <div><dt>Fichiers chargés</dt><dd>${fileCount}</dd></div>
        </dl>
      </section>
      <footer class="edit-actions">
        <button id="apply-overview-adjust" class="ps-button ps-button--primary" type="button"><i>save</i><span>Enregistrer</span></button>
        <button id="cancel-overview-adjust" class="ps-button" type="button"><i>close</i><span>Annuler</span></button>
      </footer>
    </section>
  `;
}

export function getManifestCover(manifest = {}) {
  return COVER_FIELDS.map((field) => manifest?.[field] || manifest?.media?.[field]).find((value) => typeof value === "string" && value.trim()) || "";
}

export function setOverviewCoverOptionEnabled(root, enabled) {
  root?.querySelector("[data-edit-option='overview-cover']")?.classList.toggle("is-enabled", enabled);
  root?.querySelector(".overview-cover-editor")?.classList.toggle("hidden", !enabled);
  if (enabled) root?.querySelector("#overview-cover-source")?.focus();
}

export function setOverviewCoverValue(root, value, previewValue = value) {
  const source = root?.querySelector("#overview-cover-source");
  const toggle = root?.querySelector("#overview-cover-toggle");
  const preview = root?.querySelector(".overview-cover-preview");
  if (source) source.value = value || "";
  if (toggle) toggle.checked = Boolean(value);
  setOverviewCoverOptionEnabled(root, Boolean(value));
  if (!preview) return;
  preview.classList.toggle("has-image", Boolean(value));
  preview.classList.toggle("is-empty", !value);
  preview.innerHTML = value
    ? `<img src="${escapeHtml(previewValue || value)}" alt="">`
    : `<span><i>image</i><small>Aucune couverture</small></span>`;
}
