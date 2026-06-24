import { safeFileName } from "../core/utils.js";
import {
  getExportFiles,
  serializeEntity,
  updateMarkdownFileFromEntity
} from "../services/export-model.js";

export function createExportController({
  state,
  parseMarkdownFile,
  normalizeSummaryStyle,
  dumpYaml,
  zipCtor,
  showToast,
  saveSession,
  documentRef = document,
  urlRef = URL,
  dateRef = Date
}) {
  function exportSelected() {
    const entity = state.entities.get(state.selectedId);
    if (!entity) {
      showToast("Aucune fiche sélectionnée");
      return;
    }
    const content = entity.rawText || serializeEntity(entity, dumpYaml);
    downloadBlob(new Blob([content], { type: "text/markdown;charset=utf-8" }), `${safeFileName(entity.label)}.md`);
  }

  async function exportAll() {
    const zip = new zipCtor();
    const projectName = safeFileName(state.projectManifest?.titre || state.projectManifest?.id || "prospectre");
    const projectRoot = zip.folder(projectName);
    const files = getExportFiles({
      files: state.files,
      entities: state.entities,
      modelSchema: state.modelSchema
    });
    for (const file of files) {
      if (file.dataUrl) {
        projectRoot.file(file.exportPath, file.dataUrl.split(",")[1] || "", { base64: true });
      } else {
        projectRoot.file(file.exportPath, file.text);
      }
    }
    const manifest = {
      ...(state.projectManifest || {}),
      modele: state.modelSchema,
      date_export: new dateRef().toISOString(),
      fichiers: ["README.md", ...files.map((file) => file.exportPath).filter((path) => path !== "README.md"), "manifest.json"]
    };
    projectRoot.file("manifest.json", JSON.stringify(manifest, null, 2));
    projectRoot.file("contributions/commentaires.json", JSON.stringify(state.comments, null, 2));
    projectRoot.file("contributions/activite.json", JSON.stringify(state.activity, null, 2));
    downloadBlob(await zip.generateAsync({ type: "blob" }), `${projectName}.zip`);
  }

  function updateFileFromEntity(entity) {
    const file = state.files.get(entity.path);
    if (!file) return;
    updateMarkdownFileFromEntity(file, entity, {
      parseMarkdownFile,
      normalizeSummaryStyle,
      dumpYaml
    });
    entity.rawText = file.text;
    saveSession();
  }

  function updateManifestFile() {
    if (!state.projectManifest) return;
    state.projectManifest.modele = state.modelSchema;
    const text = JSON.stringify(state.projectManifest, null, 2);
    const manifestFile = state.files.get("manifest.json");
    if (manifestFile) {
      manifestFile.text = text;
    } else {
      state.files.set("manifest.json", { path: "manifest.json", text });
    }
  }

  function downloadBlob(blob, filename) {
    const url = urlRef.createObjectURL(blob);
    const a = documentRef.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    urlRef.revokeObjectURL(url);
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  return {
    exportSelected,
    exportAll,
    updateFileFromEntity,
    updateManifestFile,
    downloadBlob,
    blobToDataUrl
  };
}
