export function resolveKnownProjectAlias(value, knownManifests) {
  const normalized = normalizeAlias(value);
  const match = knownManifests.find((entry) => {
    const ids = [
      entry.id,
      entry.id?.replace(/^pack:/, ""),
      entry.title,
      entry.url
    ];
    return ids.some((item) => normalizeAlias(item) === normalized);
  });
  return match?.url || "";
}

export function getLaunchRequestFromSearch(search, { defaultManifestUrl, knownManifests }) {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search || "");
  const pack = params.get("pack");
  if (pack) {
    const manifestUrl = resolveKnownProjectAlias(pack, knownManifests);
    if (manifestUrl) return { kind: "project", value: manifestUrl };
  }
  const project = params.get("project");
  if (project) return { kind: "project", value: project };
  const resource = params.get("source") || params.get("url") || params.get("file");
  if (resource) return { kind: "resource", value: resource };
  return { kind: "default", value: defaultManifestUrl };
}

export function sameProjectUrl(a, b, baseUrl) {
  if (!a || !b) return false;
  return new URL(a, baseUrl).href === new URL(b, baseUrl).href;
}

export function createProjectNavigationHref(currentUrl, manifestUrl, { defaultManifestUrl }) {
  const url = new URL(currentUrl);
  if (sameProjectUrl(manifestUrl, defaultManifestUrl, currentUrl)) url.searchParams.delete("project");
  else url.searchParams.set("project", manifestUrl);
  ["source", "url", "file", "pack", "select", "tab", "comment"].forEach((key) => url.searchParams.delete(key));
  return `${url.pathname}${url.search}${url.hash}`;
}

export function createRemoteResourceHref(currentUrl, resourceUrl) {
  if (!resourceUrl) return "";
  const url = new URL(currentUrl);
  ["project", "pack", "url", "file", "select", "tab", "comment"].forEach((key) => url.searchParams.delete(key));
  url.searchParams.set("source", resourceUrl);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function createRecentProjectList(recent, manifest, limit = 8) {
  const entry = {
    id: manifest.id,
    title: manifest.titre || manifest.id,
    version: manifest.version || "",
    group: "Imports récents"
  };
  return [
    entry,
    ...recent.filter((item) => item.id !== manifest.id)
  ].slice(0, limit);
}

export function getInitialDeepLinkRequest(search, entityIds) {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search || "");
  const entityId = params.get("select");
  if (!entityId || !entityIds.has(entityId)) return null;
  return {
    entityId,
    activeTab: params.get("tab") === "discussion" ? "discussion" : "overview",
    commentId: params.get("comment")
  };
}

export function createSelectionDeepLinkUrl(currentUrl, { entityId, tab = "overview", commentId = null } = {}) {
  const url = new URL(currentUrl);
  if (entityId) url.searchParams.set("select", entityId);
  else url.searchParams.delete("select");
  if (entityId && tab === "discussion") url.searchParams.set("tab", "discussion");
  else url.searchParams.delete("tab");
  if (entityId && commentId) url.searchParams.set("comment", commentId);
  else url.searchParams.delete("comment");
  return url;
}

export function normalizeAlias(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^pack:/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getRemoteFileName(resourceUrl, baseUrl) {
  try {
    const url = new URL(resourceUrl, baseUrl);
    const hinted = url.searchParams.get("filename") || url.searchParams.get("name");
    const lastPath = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "");
    return hinted || lastPath || "ressource";
  } catch {
    return String(resourceUrl || "").split(/[\\/]/).pop() || "ressource";
  }
}

export function createRemoteSingleFileManifest(files, { sourceUrl = "", title = "", safeFileName, defaultModelSchema } = {}) {
  const markdownFiles = files.filter((file) => file.path.toLowerCase().endsWith(".md"));
  const seed = sourceUrl || markdownFiles.map((file) => file.path).join("|") || title || "remote";
  return {
    id: `pack:remote-${safeFileName(seed).slice(0, 80)}`,
    titre: title || "Fichier distant",
    version: "1.0.0",
    format_version: "1.0.0",
    date_generation: new Date().toISOString().slice(0, 10),
    description: "Contenu chargé depuis une ressource distante.",
    source: {
      type: "remote-file",
      url: sourceUrl
    },
    modele: defaultModelSchema,
    fichiers: [...markdownFiles.map((file) => file.path), "manifest.json"]
  };
}

export function resolveProjectRestore(manifest, canonicalFiles, savedSession) {
  const restored = savedSession?.projectId === manifest.id
    && savedSession?.projectVersion === manifest.version
    && Array.isArray(savedSession.files);
  return {
    restored,
    manifest: restored && savedSession?.manifest ? { ...manifest, ...savedSession.manifest } : manifest,
    files: restored ? savedSession.files : canonicalFiles,
    message: restored ? "Contenus restaurés" : "Exploration prête"
  };
}

export function moodlePackCollides(pack, entityIds, parseMarkdownFile) {
  return pack.files
    .filter((file) => file.path.endsWith(".md"))
    .some((file) => {
      const parsed = parseMarkdownFile(file.text);
      return parsed.meta?.id && entityIds.has(parsed.meta.id);
    });
}

export function ensureUniqueMoodleNamespace(text, fileName, pack, { entityIds, parseMarkdownFile, convertMoodleCompetencyCsv }) {
  if (!moodlePackCollides(pack, entityIds, parseMarkdownFile)) return pack;
  for (let index = 2; index < 100; index += 1) {
    const candidate = convertMoodleCompetencyCsv(text, {
      fileName,
      namespaceSuffix: `-${index}`
    });
    if (!moodlePackCollides(candidate, entityIds, parseMarkdownFile)) return candidate;
  }
  return pack;
}

export function mergeProjectManifestWithMoodlePack(currentManifest, importedManifest, importedFiles, { currentModelSchema, defaultModelSchema, mergeModelSchemas }) {
  const mergedModel = mergeModelSchemas(currentManifest?.modele || currentModelSchema || defaultModelSchema, importedManifest.modele);
  const currentFiles = Array.isArray(currentManifest?.fichiers) ? currentManifest.fichiers : [];
  return {
    ...(currentManifest || {}),
    modele: mergedModel,
    fichiers: [...new Set([...currentFiles, ...importedFiles.map((file) => file.path)])],
    imports: [
      ...(Array.isArray(currentManifest?.imports) ? currentManifest.imports : []),
      importedManifest.source
    ].filter(Boolean)
  };
}

export function createImportedFilesPlan(importedFiles, currentFiles, currentManifest, parseJson) {
  const importedManifestFile = importedFiles.find((file) => file.path.toLowerCase() === "manifest.json");
  const importedManifest = importedManifestFile ? parseJson(importedManifestFile.text) : null;
  const replacesProject = Boolean(importedManifest?.id && importedManifest.id !== currentManifest?.id);
  const baseFiles = replacesProject ? [] : currentFiles;
  const existingPaths = new Set(baseFiles.map((file) => file.path));
  const conflicts = importedFiles.filter((file) => existingPaths.has(file.path) && file.path !== "manifest.json");
  return {
    importedManifest,
    replacesProject,
    baseFiles,
    conflicts,
    message: importedManifest ? "Pack chargé" : "Contenus ajoutés"
  };
}
