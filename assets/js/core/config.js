export const DEFAULT_PROJECT_MANIFEST_URL = "./data/prospectre-documentation/manifest.json";

export const KNOWN_PROJECT_MANIFESTS = Object.freeze([
  {
    id: "pack:prospectre-documentation",
    title: "PROSPECTRE — Documentation et laboratoire",
    version: "1.0.0",
    url: "./data/prospectre-documentation/manifest.json",
    group: "Bibliothèque interne"
  },
  {
    id: "pack:snt-2040",
    title: "SNT 2040",
    url: "./data/snt-2040/manifest.json",
    group: "Projets locaux"
  },
  {
    id: "pack:neo",
    title: "Master NEO",
    url: "./data/neo/manifest.json",
    group: "Projets locaux"
  },
  {
    id: "pack:gt-snt-2040-v010",
    title: "GT-SNT 2040 — Starter pack v0.1.0",
    version: "0.1.0",
    url: "./data/gt-snt-2040-v0.1.0/manifest.json",
    group: "Projets locaux"
  },
  {
    id: "pack:gt-snt-2040-v020",
    title: "GT-SNT 2040 — Starter pack v0.2.0",
    version: "0.2.0",
    url: "./data/gt-snt-2040-v0.2.0/manifest.json",
    group: "Projets locaux"
  },
  {
    id: "pack:gt-snt-2040-v030",
    title: "GT-SNT 2040 — Starter pack v0.3.0",
    version: "0.3.0",
    url: "./data/gt-snt-2040-v0.3.0/manifest.json",
    group: "Projets locaux"
  }
]);

export const STORAGE_KEYS = Object.freeze({
  session: "prospectre.session.v2",
  profile: "prospectre.profile",
  anonymousProfile: "prospectre.profile.anonymous",
  googleProfile: "prospectre.profile.google",
  comments: "prospectre.comments",
  entityReactions: "prospectre.entity.reactions",
  gamification: "prospectre.gamification.v1",
  activityRead: "prospectre.activity.read",
  drafts: "prospectre.drafts",
  graphLayout: "prospectre.graph.layout.v1",
  graphPrefs: "prospectre.graph.prefs.v3",
  projectSessions: "prospectre.sessions.v1",
  recentProjects: "prospectre.projects.recent.v1",
  theme: "prospectre.theme",
  realtime: "prospectre.copresence"
});

export const MODEL_SCHEMA_VERSION = "1.0.0";

export const PACK_ASSET_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);

export const PACK_ASSET_MIME_TYPES = Object.freeze({
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml"
});

export const VISIBLE_ACTIVITY_TYPES = new Set(["comment", "reply"]);

// Mutable registry populated from the active pack manifest.
export const TYPE_CONFIG = {};

export const CONTRIBUTION_FILTER = Object.freeze({
  label: "Échanges",
  singular: "Échange",
  color: "#7dd3fc"
});

// Used only when a pack does not declare a model. Domain vocabularies belong in manifests.
export const FALLBACK_MODEL_SCHEMA = Object.freeze({
  version: MODEL_SCHEMA_VERSION,
  relations: {
    related_to: { label: "Relie" }
  },
  types: [
    {
      id: "item",
      label: "Éléments",
      singular: "Élément",
      folder: "elements",
      color: "#4f8cff",
      size: 14,
      order: 0,
      showLabel: true,
      fields: [
        { key: "titre", label: "Titre", kind: "text", required: true },
        { key: "resume", label: "Résumé", kind: "textarea", required: false },
        { key: "relations", label: "Relations", kind: "reference", target: "*", multiple: true, required: false }
      ]
    }
  ]
});

export const HIDDEN_NODE_TYPES = new Set([
  "source",
  "source_fragment",
  "relation",
  "relation_set",
  "note",
  "template",
  "model"
]);

export const TECHNICAL_TYPE_LABELS = Object.freeze({
  source: "Source",
  source_fragment: "Fragment",
  relation: "Relation",
  note: "Note"
});
