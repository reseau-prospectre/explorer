import {
  HIDDEN_NODE_TYPES,
  TYPE_CONFIG
} from "../core/config.js";
import { shortLabel } from "../core/utils.js";
import { applyTypeRegistry, normalizeModelSchema } from "./schema.js";

export function createProjectModel(dependencies) {
  const {
    state,
    getFirstMarkdownImage,
    resolveAvatarProfile,
    getScoreBoost
  } = dependencies;

  function parseEntities(files) {
    const entities = new Map();
    for (const file of files) {
      if (!file.path.toLowerCase().endsWith(".md")) continue;
      const parsed = parseMarkdownFile(file.text);
      const meta = normalizeEntityMeta(parsed.meta);
      if (!meta.id || !meta.type || !meta.label) continue;
      entities.set(meta.id, {
        ...meta,
        body: parsed.body,
        path: file.path,
        rawText: file.text,
        imageURL: getFirstMarkdownImage(parsed.body, file.path)
      });
    }
    return entities;
  }

  function normalizeEntityMeta(meta = {}) {
    return {
      ...meta,
      label: meta.label || meta.titre || "",
      summary: meta.summary || meta.resume || meta.definition || meta.formulation || "",
      status: meta.status || meta.statut || "",
      influence_score: meta.influence_score ?? 0,
      dependence_score: meta.dependence_score ?? 0
    };
  }

  function applyModelSchema(schema, options = {}) {
    state.modelSchema = normalizeModelSchema(schema);
    applyTypeRegistry(state.modelSchema);
    const validTypes = new Set(state.modelSchema.types.map((type) => type.id));
    state.activeTypes = options.resetFilters
      ? new Set(validTypes)
      : new Set([...state.activeTypes].filter((type) => validTypes.has(type)));
    for (const type of validTypes) state.activeTypes.add(type);
  }

  function parseMarkdownFile(text) {
    const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (!match) return { meta: {}, body: text };
    try {
      return { meta: jsyaml.load(match[1]) || {}, body: match[2] || "" };
    } catch {
      return { meta: {}, body: text };
    }
  }

  function buildGraph(entities) {
    const nodes = [...entities.values()]
      .filter((entity) => TYPE_CONFIG[entity.type] && !HIDDEN_NODE_TYPES.has(entity.type))
      .map((entity) => ({
        ...entity,
        size: TYPE_CONFIG[entity.type].size + getScoreBoost(entity),
        color: TYPE_CONFIG[entity.type].color
      }))
      .sort((a, b) => TYPE_CONFIG[a.type].order - TYPE_CONFIG[b.type].order);
    const nodeIds = new Set(nodes.map((node) => node.id));
    const links = [];
    const seen = new Set();
    for (const entity of entities.values()) {
      for (const link of inferLinks(entity)) {
        if (!nodeIds.has(link.source) || !nodeIds.has(link.target)) continue;
        const key = `${link.source}|${link.target}|${link.type}`;
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({
          ...link,
          label: link.label
            || state.modelSchema.relations?.[link.type]?.label
            || link.type,
          weight: Number(link.weight || 1)
        });
      }
    }
    if (state.realtimeStatus === "firebase") addContributionGraphItems(nodes, links, seen, nodeIds);
    return { nodes, links };
  }

  function addContributionGraphItems(nodes, links, seen, nodeIds) {
    for (const [entityId, comments] of Object.entries(state.comments)) {
      if (!nodeIds.has(entityId)) continue;
      const mainComments = comments
        .filter((comment) => !comment.parentId && !comment.deletedAt && !comment.systemKind)
        .sort((a, b) => b.createdAt - a.createdAt);
      for (const comment of mainComments) {
        const author = resolveAvatarProfile(comment);
        const replies = comments.filter((item) => item.parentId === comment.id && !item.deletedAt).length;
        const contributionId = contributionNodeId(entityId, comment.id);
        nodes.push({
          id: contributionId,
          type: "contribution",
          entityId,
          commentId: comment.id,
          label: `${comment.displayName || "Contribution"} · ${shortLabel(comment.text || "", 42)}`,
          avatar: author.avatar || "?",
          photoURL: author.photoURL || null,
          color: author.color || "#a7f3d0",
          displayName: comment.displayName || "Anonyme",
          messageCount: replies + 1,
          replyCount: replies,
          size: Math.min(13, 7 + replies * 1.5),
          createdAt: comment.createdAt || 0
        });
        const key = `${contributionId}|${entityId}|comment_on`;
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({
          source: contributionId,
          target: entityId,
          type: "comment_on",
          label: "échange",
          weight: Math.min(2.2, 1 + replies * 0.18)
        });
      }
    }
  }

  function contributionNodeId(entityId, commentId) {
    return `comment:${entityId}:${commentId}`;
  }

  function inferLinks(entity) {
    const links = [];
    const sourceId = entity.id;
    const schemaType = state.modelSchema.types.find((type) => type.id === entity.type);
    for (const field of schemaType?.fields || []) {
      if (field.kind !== "reference" || field.key === "relations") continue;
      const rawValues = Array.isArray(entity[field.key]) ? entity[field.key] : [entity[field.key]];
      for (const rawValue of rawValues) {
        const target = typeof rawValue === "object" ? rawValue?.target || rawValue?.id : rawValue;
        if (target) links.push({ source: sourceId, target, type: field.key, label: field.label });
      }
    }
    for (const relation of entity.relations || []) {
      if (relation.source && relation.target) {
        links.push({
          source: relation.source,
          target: relation.target,
          type: relation.relation_type || relation.type || "related_to",
          weight: relation.weight
        });
      } else if (relation.target) {
        links.push({
          source: sourceId,
          target: relation.target,
          type: relation.type || "related_to",
          weight: relation.weight
        });
      }
    }
    return links;
  }

  return {
    applyModelSchema,
    buildGraph,
    contributionNodeId,
    parseEntities,
    parseMarkdownFile
  };
}
