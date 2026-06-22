export function looksLikeHtml(value = "") {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ""));
}

export function markdownToEditableHtml(markdown = "") {
  const html = window.marked?.parse ? window.marked.parse(String(markdown || "")) : String(markdown || "");
  return window.DOMPurify?.sanitize ? window.DOMPurify.sanitize(html) : html;
}

export function htmlToMarkdown(html = "") {
  const template = document.createElement("template");
  template.innerHTML = window.DOMPurify?.sanitize ? window.DOMPurify.sanitize(String(html || "")) : String(html || "");
  return domNodesToMarkdown(template.content.childNodes).replace(/\n{3,}/g, "\n\n").trim();
}

function domNodesToMarkdown(nodes) {
  return [...nodes].map((node) => domNodeToMarkdown(node)).join("").replace(/[ \t]+\n/g, "\n");
}

function domNodeToMarkdown(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue.replace(/\s+/g, " ");
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const tag = node.tagName.toLowerCase();
  const text = () => domNodesToMarkdown(node.childNodes).trim();
  if (/h[1-6]/.test(tag)) return `${"#".repeat(Number(tag[1]))} ${text()}\n\n`;
  if (tag === "p") return `${text()}\n\n`;
  if (tag === "br") return "\n";
  if (tag === "strong" || tag === "b") return `**${text()}**`;
  if (tag === "em" || tag === "i") return `*${text()}*`;
  if (tag === "code") return node.closest("pre") ? node.textContent : `\`${node.textContent}\``;
  if (tag === "pre") return `\n\`\`\`\n${node.textContent.trim()}\n\`\`\`\n\n`;
  if (tag === "blockquote") return `${text().split("\n").map((line) => `> ${line}`).join("\n")}\n\n`;
  if (tag === "a") return `[${text() || node.href}](${node.getAttribute("href") || ""})`;
  if (tag === "img") return `![${node.getAttribute("alt") || "Image"}](${node.getAttribute("src") || ""})`;
  if (tag === "ul" || tag === "ol") return `${[...node.children].map((item, index) => `${tag === "ol" ? `${index + 1}.` : "-"} ${domNodesToMarkdown(item.childNodes).trim()}`).join("\n")}\n\n`;
  if (tag === "table") return tableToMarkdown(node);
  if (["div", "section", "article", "main", "tbody", "thead"].includes(tag)) return `${domNodesToMarkdown(node.childNodes)}\n`;
  return domNodesToMarkdown(node.childNodes);
}

function tableToMarkdown(table) {
  const rows = [...table.querySelectorAll("tr")].map((row) => [...row.children].map((cell) => domNodesToMarkdown(cell.childNodes).trim().replace(/\|/g, "\\|")));
  if (!rows.length) return "";
  const width = Math.max(...rows.map((row) => row.length));
  const normalized = rows.map((row) => Array.from({ length: width }, (_, index) => row[index] || ""));
  const head = normalized[0];
  const body = normalized.slice(1);
  return `\n| ${head.join(" | ")} |\n| ${head.map(() => "---").join(" | ")} |\n${body.map((row) => `| ${row.join(" | ")} |`).join("\n")}\n\n`;
}
