import { TYPE_CONFIG } from "../core/config.js";
import {
  escapeHtml,
  escapeRegExp,
  normalizePackPath
} from "../core/utils.js";

export function createMarkdownRenderer({ state }) {
  function getFirstMarkdownImage(markdown, markdownPath = "") {
    const source = String(markdown || "");
    const markdownMatch = /!\[[^\]]*]\(\s*<?([^\s)>]+)>?(?:\s+["'][^"']*["'])?\s*\)/i.exec(source);
    const htmlMatch = /<img\b[^>]*\bsrc=["']([^"']+)["']/i.exec(source);
    const candidates = [
      markdownMatch ? { index: markdownMatch.index, url: markdownMatch[1] } : null,
      htmlMatch ? { index: htmlMatch.index, url: htmlMatch[1] } : null
    ].filter(Boolean).sort((a, b) => a.index - b.index);
    return candidates.length ? resolvePackAssetUrl(candidates[0].url, markdownPath) : null;
  }

  function resolveEditorMarkdownAssets(markdown, markdownPath) {
    let resolvedMarkdown = String(markdown || "");
    resolvedMarkdown = resolvedMarkdown.replace(
      /(!\[[^\]]*]\(\s*<?)([^\s)>]+)(>?)/g,
      (match, before, source, after) => {
        const resolved = resolvePackAssetUrl(source, markdownPath);
        if (resolved !== source) state.contentEditorAssetMap.set(resolved, source);
        return `${before}${resolved}${after}`;
      }
    );
    resolvedMarkdown = resolvedMarkdown.replace(
      /(<img\b[^>]*\bsrc=["'])([^"']+)(["'])/gi,
      (match, before, source, after) => {
        const resolved = resolvePackAssetUrl(source, markdownPath);
        if (resolved !== source) state.contentEditorAssetMap.set(resolved, source);
        return `${before}${resolved}${after}`;
      }
    );
    return resolvedMarkdown;
  }

  function renderMarkdownWithEntityLinks(markdown, markdownPath = "") {
    let text = markdown || "";
    const protectedMarkdown = [];
    text = text.replace(/```[\s\S]*?```|`[^`\n]+`|\[[^\]]+\]\([^)]+\)|(?:^|\n)(?:\|.*\|\n?)+/g, (segment) => {
      const index = protectedMarkdown.push(segment) - 1;
      return `\u0000PROTECTED_${index}\u0000`;
    });
    const candidates = [...state.graph.nodes]
      .filter((node) => node.id !== state.selectedId && node.label && node.label.length > 8)
      .sort((a, b) => b.label.length - a.label.length);
    const candidateByLabel = new Map();
    for (const node of candidates) {
      if (!candidateByLabel.has(node.label)) candidateByLabel.set(node.label, node);
    }
    if (candidateByLabel.size) {
      const pattern = new RegExp([...candidateByLabel.keys()].map(escapeRegExp).join("|"), "g");
      text = text.replace(pattern, (label) => {
        const node = candidateByLabel.get(label);
        return node ? `[${label}](entity:${encodeURIComponent(node.id)})` : label;
      });
    }
    text = text.replace(
      /\u0000PROTECTED_(\d+)\u0000/g,
      (_, index) => protectedMarkdown[Number(index)] || ""
    );
    let html = marked.parse(text, { mangle: false, headerIds: false });
    html = html.replace(/<a\s+href="entity:([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, id, label) => {
      const entity = state.entities.get(decodeURIComponent(id));
      if (!entity) return label;
      const color = TYPE_CONFIG[entity.type]?.color || "#9aa6ad";
      const textLabel = String(label).replace(/<[^>]+>/g, "");
      return `<button class="inline-entity" data-node="${escapeHtml(entity.id)}" type="button"><span class="dot" style="background:${color}"></span>${escapeHtml(textLabel)}</button>`;
    });
    html = DOMPurify.sanitize(html);
    return html.replace(/<img([^>]*?)src="([^"]+)"([^>]*)>/g, (match, before, source, after) => {
      const resolved = resolvePackAssetUrl(source, markdownPath);
      return `<img${before}src="${escapeHtml(resolved)}"${after}>`;
    });
  }

  function resolvePackAssetUrl(source, markdownPath) {
    if (!source || /^(?:[a-z]+:|#|\/)/i.test(source)) return source;
    const baseParts = String(markdownPath || "").replace(/\\/g, "/").split("/");
    baseParts.pop();
    const resolvedPath = normalizePackPath([...baseParts, ...source.split("/")].join("/"));
    return state.files.get(resolvedPath)?.dataUrl || source;
  }

  return {
    getFirstMarkdownImage,
    renderMarkdownWithEntityLinks,
    resolveEditorMarkdownAssets,
    resolvePackAssetUrl
  };
}
