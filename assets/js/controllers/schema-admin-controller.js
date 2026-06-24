import { cssEscape, parseJson, safeFileName } from "../core/utils.js";
import {
  addSchemaField as addSchemaFieldValue,
  applySchemaFieldInput,
  applySchemaTypeInput,
  bumpPatchVersion,
  createSchemaField,
  createSchemaType,
  fieldKindLabel,
  getSchemaCompatibilityReport as getSchemaCompatibilityReportValue,
  getSchemaEntityCount as getSchemaEntityCountValue,
  getSelectedSchemaField as getSelectedSchemaFieldValue,
  getSelectedSchemaType,
  normalizeModelSchema,
  parseSchemaFieldValues,
  removeSchemaField,
  removeSchemaType,
  reorderSchemaTypes as reorderSchemaTypesValue,
  safeSchemaId,
  validateModelSchema
} from "../model/schema.js";
import {
  renderSchemaFieldsView,
  renderSchemaTransferView,
  renderSchemaTypesView
} from "../ui/schema-view.js";

export function createSchemaAdminController({
  els,
  state,
  defaultModelSchema,
  hiddenNodeTypes,
  parseMarkdownFile,
  applyModelSchema,
  saveSession,
  rebuildGraph,
  renderTypeFilters,
  downloadBlob,
  confirmAction,
  exportAll,
  showToast,
  windowRef = window
}) {
  function canAdminister() {
    return state.authProvider !== "google" || state.isAdmin;
  }

  function openAdmin(view = "types") {
    if (!canAdminister()) {
      showToast("Ce compte ne dispose pas des droits d’administration");
      return;
    }
    state.schemaDraft = structuredClone(state.modelSchema);
    state.schemaView = view;
    const available = state.schemaDraft.types.some((type) => type.id === state.schemaSelectedType);
    if (!available) state.schemaSelectedType = state.schemaDraft.types[0]?.id || "";
    els.schemaAdmin.classList.remove("hidden");
    document.querySelector("#app").classList.add("schema-admin-open");
    renderAdmin();
  }

  function closeAdmin() {
    if (els.schemaAdmin?.classList.contains("hidden")) return;
    els.schemaAdmin.classList.add("hidden");
    document.querySelector("#app").classList.remove("schema-admin-open");
    state.schemaDraft = null;
  }

  function renderAdmin() {
    if (!state.schemaDraft || !els.schemaAdminContent) return;
    document.querySelectorAll("[data-schema-view]").forEach((button) => {
      button.classList.toggle("active", button.dataset.schemaView === state.schemaView);
    });
    document.querySelector("#schema-project-name").textContent = state.projectManifest?.titre || state.projectManifest?.id || "Projet local";
    document.querySelector("#schema-version-label").textContent = `Schéma ${state.schemaDraft.version}`;
    if (state.schemaView === "types") renderTypes();
    if (state.schemaView === "fields") renderFields();
    if (state.schemaView === "transfer") renderTransfer();
  }

  function renderTypes() {
    const entityCounts = new Map();
    for (const entity of state.entities.values()) {
      entityCounts.set(entity.type, (entityCounts.get(entity.type) || 0) + 1);
    }
    els.schemaAdminContent.innerHTML = renderSchemaTypesView({
      schema: state.schemaDraft,
      entityCounts,
      entityCount: getSchemaEntityCount(state.schemaDraft)
    });
  }

  function renderFields() {
    const selectedType = getSelectedSchemaType(state.schemaDraft, state.schemaSelectedType);
    if (!selectedType) {
      els.schemaAdminContent.innerHTML = `<p class="empty-state">Créez d’abord un type d’élément.</p>`;
      return;
    }
    state.schemaSelectedType = selectedType.id;
    const selectedField = selectedType.fields.find((field) => field.key === state.schemaSelectedField) || selectedType.fields[0] || null;
    state.schemaSelectedField = selectedField?.key || "";
    els.schemaAdminContent.innerHTML = renderSchemaFieldsView({
      schema: state.schemaDraft,
      selectedType,
      selectedField,
      fieldKindLabel
    });
  }

  function renderTransfer() {
    const report = getSchemaCompatibilityReport(state.schemaDraft);
    els.schemaAdminContent.innerHTML = renderSchemaTransferView(report);
  }

  function reorderTypes(sourceId, targetId) {
    return reorderSchemaTypesValue(state.schemaDraft, sourceId, targetId);
  }

  function addType() {
    const label = windowRef.prompt("Nom du nouveau type");
    if (!label?.trim()) return;
    const proposed = safeSchemaId(label);
    const id = windowRef.prompt("Identifiant technique stable", proposed);
    const normalizedId = safeSchemaId(id);
    if (!normalizedId || state.schemaDraft.types.some((type) => type.id === normalizedId)) {
      showToast("Identifiant invalide ou déjà utilisé");
      return;
    }
    state.schemaDraft.types.push(createSchemaType({
      id: normalizedId,
      label,
      order: state.schemaDraft.types.length
    }));
    renderTypes();
  }

  async function deleteType(typeId, anchor = null) {
    const used = [...state.entities.values()].filter((entity) => entity.type === typeId).length;
    if (used) {
      showToast(`Suppression impossible : ${used} élément${used > 1 ? "s utilisent" : " utilise"} ce type`);
      return;
    }
    const confirmed = await confirmAction({
      title: "Supprimer ce type",
      message: "Ce type sera retiré du schéma du modèle.",
      details: "Cette action est limitée au schéma en cours d'édition.",
      anchor,
      confirmLabel: "Supprimer",
      confirmIcon: "delete",
      tone: "danger"
    });
    if (!confirmed) return;
    removeSchemaType(state.schemaDraft, typeId);
    renderTypes();
  }

  function addField() {
    const type = getSelectedSchemaType(state.schemaDraft, state.schemaSelectedType);
    if (!type) return;
    const label = windowRef.prompt("Libellé du champ");
    if (!label?.trim()) return;
    const key = safeSchemaId(windowRef.prompt("Clé YAML stable", safeSchemaId(label)));
    if (!key || type.fields.some((field) => field.key === key)) {
      showToast("Clé YAML invalide ou déjà utilisée");
      return;
    }
    addSchemaFieldValue(state.schemaDraft, state.schemaSelectedType, createSchemaField({ key, label }));
    state.schemaSelectedField = key;
    renderFields();
  }

  async function deleteField(fieldKey, anchor = null) {
    const type = state.schemaDraft.types.find((item) => item.id === state.schemaSelectedType);
    if (!type || fieldKey === "titre") {
      showToast("Le champ titre est obligatoire");
      return;
    }
    const confirmed = await confirmAction({
      title: "Supprimer ce champ",
      message: "Le champ sera retiré du schéma.",
      details: "Les données déjà présentes dans les fiches ne seront pas effacées.",
      anchor,
      confirmLabel: "Supprimer",
      confirmIcon: "delete",
      tone: "danger"
    });
    if (!confirmed) return;
    state.schemaSelectedField = removeSchemaField(state.schemaDraft, state.schemaSelectedType, fieldKey);
    renderFields();
  }

  function getSelectedField() {
    return state.schemaDraft ? getSelectedSchemaFieldValue(state.schemaDraft, state.schemaSelectedType, state.schemaSelectedField) : null;
  }

  function saveDraft() {
    if (!state.schemaDraft) return;
    const errors = validateModelSchema(state.schemaDraft);
    if (errors.length) {
      showToast(errors[0]);
      return;
    }
    const normalized = normalizeModelSchema({
      ...state.schemaDraft,
      version: bumpPatchVersion(state.modelSchema.version),
      updatedAt: new Date().toISOString()
    });
    applyModelSchema(normalized);
    state.projectManifest = { ...(state.projectManifest || {}), modele: state.modelSchema };
    state.schemaDraft = structuredClone(state.modelSchema);
    saveSession();
    rebuildGraph();
    renderTypeFilters();
    renderAdmin();
    showToast(`Schéma ${state.modelSchema.version} enregistré`);
  }

  async function resetDraft(event) {
    const confirmed = await confirmAction({
      title: "Réinitialiser le schéma",
      message: "Les types et champs du modèle reviendront aux valeurs par défaut.",
      details: "Le contenu des fiches du projet actif n'est pas supprimé.",
      anchor: event?.currentTarget || null,
      confirmLabel: "Réinitialiser",
      confirmIcon: "restart_alt",
      tone: "danger"
    });
    if (!confirmed) return;
    state.schemaDraft = structuredClone(defaultModelSchema);
    state.schemaSelectedType = defaultModelSchema.types[0]?.id || "";
    state.schemaSelectedField = defaultModelSchema.types[0]?.fields[0]?.key || "";
    renderAdmin();
  }

  function getCompatibilityReport(schema) {
    return getSchemaCompatibilityReportValue(schema, state.entities, {
      hiddenNodeTypes,
      parseMarkdownFile
    });
  }

  function getEntityCount(schema) {
    return getSchemaEntityCountValue(schema, state.entities);
  }

  function exportDraft() {
    const blob = new Blob([JSON.stringify(normalizeModelSchema(state.schemaDraft), null, 2)], { type: "application/json;charset=utf-8" });
    downloadBlob(blob, `${safeFileName(state.projectManifest?.titre || "prospectre")}-schema.json`);
  }

  async function importFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const imported = parseJson(await file.text());
    if (!imported?.types || !Array.isArray(imported.types)) {
      showToast("Fichier de schéma invalide");
      return;
    }
    state.schemaDraft = normalizeModelSchema(imported);
    state.schemaView = "transfer";
    renderAdmin();
    showToast("Schéma chargé en brouillon");
  }

  function getSchemaCompatibilityReport(schema) {
    return getCompatibilityReport(schema);
  }

  function getSchemaEntityCount(schema) {
    return getEntityCount(schema);
  }

  function bindControls() {
    els.schemaAdminContent?.addEventListener("input", handleInput);
    els.schemaAdminContent?.addEventListener("change", handleInput);
    els.schemaAdminContent?.addEventListener("click", handleClick);
    els.schemaAdminContent?.addEventListener("pointerdown", prepareTypeDrag);
    els.schemaAdminContent?.addEventListener("pointermove", movePointerDrag);
    els.schemaAdminContent?.addEventListener("pointerup", finishPointerDrag);
    els.schemaAdminContent?.addEventListener("pointercancel", finishPointerDrag);
    els.schemaAdminContent?.addEventListener("dragstart", startTypeDrag);
    els.schemaAdminContent?.addEventListener("dragover", moveTypeDrag);
    els.schemaAdminContent?.addEventListener("drop", dropTypeDrag);
    els.schemaAdminContent?.addEventListener("dragend", endTypeDrag);
    els.schemaFileInput?.addEventListener("change", importFile);
    document.querySelectorAll("[data-schema-view]").forEach((button) => {
      button.addEventListener("click", () => {
        state.schemaView = button.dataset.schemaView;
        renderAdmin();
      });
    });
  }

  function handleInput(event) {
    if (!state.schemaDraft) return;
    const typeId = event.target.dataset.schemaType;
    if (typeId) {
      const value = event.target.type === "checkbox"
        ? event.target.checked
        : event.target.type === "number" ? Number(event.target.value) : event.target.value;
      const type = applySchemaTypeInput(state.schemaDraft, typeId, event.target.dataset.schemaProp, value);
      if (!type) return;
      if (event.target.dataset.schemaProp === "color") {
        els.schemaAdminContent.querySelector(`[data-schema-preview="${cssEscape(type.id)}"]`)
          ?.style.setProperty("--schema-color", type.color);
      }
      return;
    }
    if (event.target.matches("[data-schema-selected-type]")) {
      state.schemaSelectedType = event.target.value;
      state.schemaSelectedField = "";
      renderFields();
      return;
    }
    const fieldProp = event.target.dataset.fieldProp;
    if (fieldProp) {
      const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
      const field = applySchemaFieldInput(state.schemaDraft, state.schemaSelectedType, state.schemaSelectedField, fieldProp, value);
      if (!field) return;
      if (fieldProp === "kind") renderFields();
      return;
    }
    if (event.target.matches("[data-field-values]")) {
      const field = getSelectedField();
      if (field) field.values = parseSchemaFieldValues(event.target.value);
    }
  }

  async function handleClick(event) {
    const button = event.target.closest("button");
    if (!button || !state.schemaDraft) return;
    if (button.dataset.selectField) {
      state.schemaSelectedField = button.dataset.selectField;
      renderFields();
    } else if (button.hasAttribute("data-add-type")) {
      addType();
    } else if (button.dataset.deleteType) {
      await deleteType(button.dataset.deleteType, button);
    } else if (button.hasAttribute("data-add-field")) {
      addField();
    } else if (button.dataset.deleteField) {
      await deleteField(button.dataset.deleteField, button);
    } else if (button.hasAttribute("data-export-schema")) {
      exportDraft();
    } else if (button.hasAttribute("data-import-schema")) {
      els.schemaFileInput.click();
    } else if (button.hasAttribute("data-export-pack")) {
      exportAll();
    }
  }

  function prepareTypeDrag(event) {
    const handle = event.target.closest(".schema-drag");
    const row = handle?.closest("[data-type-row]");
    state.schemaDragArmedType = row?.dataset.typeRow || null;
    if (!row) return;
    state.schemaPointerDrag = {
      sourceId: row.dataset.typeRow,
      targetId: row.dataset.typeRow,
      pointerId: event.pointerId
    };
    row.classList.add("dragging");
    handle.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function movePointerDrag(event) {
    if (!state.schemaPointerDrag || event.pointerId !== state.schemaPointerDrag.pointerId) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-type-row]");
    if (!target || target.dataset.typeRow === state.schemaPointerDrag.sourceId) return;
    state.schemaPointerDrag.targetId = target.dataset.typeRow;
    clearDragOver();
    target.classList.add("drag-over");
    event.preventDefault();
  }

  function finishPointerDrag(event) {
    const drag = state.schemaPointerDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    state.schemaPointerDrag = null;
    if (drag.sourceId !== drag.targetId) reorderTypes(drag.sourceId, drag.targetId);
    endTypeDrag();
    renderTypes();
  }

  function startTypeDrag(event) {
    const row = event.target.closest("[data-type-row]");
    if (!row || state.schemaDragArmedType !== row.dataset.typeRow) {
      event.preventDefault();
      return;
    }
    state.schemaDraggedType = row.dataset.typeRow;
    row.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", state.schemaDraggedType);
  }

  function moveTypeDrag(event) {
    if (!state.schemaDraggedType) return;
    const row = event.target.closest("[data-type-row]");
    if (!row || row.dataset.typeRow === state.schemaDraggedType) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    clearDragOver();
    row.classList.add("drag-over");
  }

  function dropTypeDrag(event) {
    const targetRow = event.target.closest("[data-type-row]");
    const sourceId = state.schemaDraggedType || event.dataTransfer?.getData("text/plain");
    const targetId = targetRow?.dataset.typeRow;
    if (!sourceId || !targetId || sourceId === targetId) return;
    event.preventDefault();
    reorderTypes(sourceId, targetId);
    endTypeDrag();
    renderTypes();
  }

  function endTypeDrag() {
    state.schemaDraggedType = null;
    state.schemaDragArmedType = null;
    els.schemaAdminContent?.querySelectorAll(".schema-type-row").forEach((row) => {
      row.classList.remove("dragging", "drag-over");
    });
  }

  function clearDragOver() {
    els.schemaAdminContent.querySelectorAll(".schema-type-row.drag-over").forEach((item) => item.classList.remove("drag-over"));
  }

  return {
    bindControls,
    canAdminister,
    openAdmin,
    closeAdmin,
    renderAdmin,
    renderTypes,
    renderFields,
    renderTransfer,
    reorderTypes,
    addType,
    deleteType,
    addField,
    deleteField,
    getSelectedField,
    saveDraft,
    resetDraft,
    getCompatibilityReport,
    getEntityCount,
    exportDraft,
    importFile,
    handleInput,
    handleClick,
    prepareTypeDrag,
    movePointerDrag,
    finishPointerDrag,
    startTypeDrag,
    moveTypeDrag,
    dropTypeDrag,
    endTypeDrag
  };
}
