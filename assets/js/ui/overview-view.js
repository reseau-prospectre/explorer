import { escapeHtml } from "../core/utils.js";

export function renderOverviewDetailsView({ manifest, datasetId, generatedAt, fileCount }) {
  return `
    <article class="readable-card overview-details-card">
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
      <span class="quiet">Manifest du projet</span>
      <div class="reading-footer-actions">
        <div class="edit-toggle">
          <i>edit</i>
          <span>Modifier</span>
          <label class="switch">
            <input id="overview-edit-toggle" type="checkbox">
            <span></span>
          </label>
          <span class="tooltip top">Modifier les détails locaux du projet</span>
        </div>
      </div>
    </footer>
  `;
}

export function renderOverviewEditView({ manifest, datasetId, generatedAt, fileCount }) {
  return `
    <section class="edit-surface overview-edit-surface">
      <header class="edit-surface-head">
        <div>
          <p class="kicker">Édition locale</p>
          <h2>${escapeHtml(manifest.titre || manifest.id || "Vue d’ensemble")}</h2>
        </div>
        <label class="edit-toggle">
          <i>edit</i>
          <span>Modifier</span>
          <span class="switch">
            <input id="overview-edit-toggle" type="checkbox" checked>
            <span></span>
          </span>
        </label>
      </header>
      <div class="local-edit-warning"><i>info</i><span>Ces détails restent locaux jusqu’à l’export d’un nouveau pack.</span></div>
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
          <label class="switch" aria-label="Activer la description">
            <input id="overview-description-toggle" type="checkbox"${manifest.description ? " checked" : ""}>
            <span></span>
          </label>
        </div>
        <textarea id="overview-description" rows="6"${manifest.description ? "" : " disabled"} placeholder="Ajouter une description du projet…">${escapeHtml(manifest.description || "")}</textarea>
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
        <button id="apply-overview-adjust" class="primary-button" type="button"><i>save</i><span>Enregistrer</span></button>
        <button id="cancel-overview-adjust" class="secondary-button" type="button"><i>close</i><span>Annuler</span></button>
      </footer>
    </section>
  `;
}
