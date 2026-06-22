const BOOTSTRAP_CSS_URL = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";
const STYLE_ID = "moodle-bootstrap-scoped";

let supportPromise = null;

export function isMoodleHtmlEntity(entity) {
  return entity?.content_format === "html" && Boolean(entity?.moodle_id || entity?.moodle_is_framework);
}

export function ensureMoodleHtmlSupport() {
  if (typeof document === "undefined") return Promise.resolve(false);
  if (document.getElementById(STYLE_ID)) return Promise.resolve(true);
  supportPromise ??= loadScopedBootstrap().catch(() => {
    document.documentElement.classList.add("moodle-bootstrap-fallback");
    return false;
  });
  return supportPromise;
}

async function loadScopedBootstrap() {
  const response = await fetch(BOOTSTRAP_CSS_URL, { mode: "cors" });
  if (!response.ok) throw new Error(`Bootstrap CSS unavailable: ${response.status}`);
  const css = await response.text();
  const scoped = await scopeCssToMoodleContent(css);
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `${scoped}\n${moodleBootstrapOverrides()}`;
  document.head.append(style);
  document.documentElement.classList.add("moodle-bootstrap-ready");
  return true;
}

async function scopeCssToMoodleContent(css) {
  if (!("CSSStyleSheet" in window) || !CSSStyleSheet.prototype.replace) {
    return fallbackScopedCss();
  }
  const sheet = new CSSStyleSheet();
  await sheet.replace(css.replace(/@charset[^;]+;/gi, ""));
  return serializeRules(sheet.cssRules);
}

function serializeRules(rules) {
  return [...rules].map((rule) => {
    if (rule.type === CSSRule.STYLE_RULE) {
      return `${scopeSelectorText(rule.selectorText)}{${rule.style.cssText}}`;
    }
    if (rule.type === CSSRule.MEDIA_RULE) {
      return `@media ${rule.conditionText}{${serializeRules(rule.cssRules)}}`;
    }
    if (rule.type === CSSRule.SUPPORTS_RULE) {
      return `@supports ${rule.conditionText}{${serializeRules(rule.cssRules)}}`;
    }
    if (rule.type === CSSRule.KEYFRAMES_RULE || rule.type === CSSRule.FONT_FACE_RULE) {
      return rule.cssText;
    }
    return "";
  }).join("\n");
}

function scopeSelectorText(selectorText) {
  return selectorText
    .split(",")
    .map((selector) => selector.trim())
    .filter(Boolean)
    .map((selector) => {
      if (/^(html|body|:root)\b/i.test(selector)) return ".moodle-html-content";
      return `.moodle-html-content ${selector}`;
    })
    .join(",");
}

function fallbackScopedCss() {
  return `
    .moodle-html-content .container,.moodle-html-content .container-fluid{width:100%;padding-right:12px;padding-left:12px;margin-right:auto;margin-left:auto}
    .moodle-html-content .row{display:flex;flex-wrap:wrap;margin-right:-12px;margin-left:-12px}
    .moodle-html-content .col{flex:1 0 0%;padding-right:12px;padding-left:12px}
    .moodle-html-content .card{position:relative;display:flex;flex-direction:column;min-width:0;border:1px solid rgba(255,255,255,.16);border-radius:.375rem;background:rgba(255,255,255,.04)}
    .moodle-html-content .card-body{flex:1 1 auto;padding:1rem}
    .moodle-html-content .rounded-0{border-radius:0!important}
    .moodle-html-content .shadow{box-shadow:0 .5rem 1rem rgba(0,0,0,.24)!important}
    .moodle-html-content .h-100{height:100%!important}
    .moodle-html-content .bg-dark{background-color:#212529!important;color:#fff}
    ${moodleBootstrapOverrides()}
  `;
}

function moodleBootstrapOverrides() {
  return `
    .moodle-html-content{color:#212529;color-scheme:light}
    .moodle-html-content .card{background:#fff;color:#212529;border-color:rgba(0,0,0,.175)}
    .moodle-html-content .alert-info,.moodle-html-content .list-group-item-info{border-color:#b6effb!important;background-color:#cff4fc!important;color:#055160!important}
    .moodle-html-content .alert-info .text-white,.moodle-html-content .alert-info [class*="text-white"],.moodle-html-content .alert-info [style*="color"],.moodle-html-content .list-group-item-info .text-white,.moodle-html-content .list-group-item-info [class*="text-white"],.moodle-html-content .list-group-item-info [style*="color"]{color:#055160!important}
    .moodle-html-content .alert-warning,.moodle-html-content .list-group-item-warning{border-color:#ffecb5!important;background-color:#fff3cd!important;color:#664d03!important}
    .moodle-html-content .alert-warning .text-white,.moodle-html-content .alert-warning [class*="text-white"],.moodle-html-content .alert-warning [style*="color"],.moodle-html-content .list-group-item-warning .text-white,.moodle-html-content .list-group-item-warning [class*="text-white"],.moodle-html-content .list-group-item-warning [style*="color"]{color:#664d03!important}
    .moodle-html-content .alert-success,.moodle-html-content .list-group-item-success{border-color:#badbcc!important;background-color:#d1e7dd!important;color:#0f5132!important}
    .moodle-html-content .alert-success [style*="color"],.moodle-html-content .list-group-item-success [style*="color"]{color:#0f5132!important}
    .moodle-html-content .alert-danger,.moodle-html-content .list-group-item-danger{border-color:#f5c2c7!important;background-color:#f8d7da!important;color:#842029!important}
    .moodle-html-content .alert-danger [style*="color"],.moodle-html-content .list-group-item-danger [style*="color"]{color:#842029!important}
    .moodle-html-content .list-group-item{color:#212529}
    .moodle-html-content .bg-dark{background-color:#212529!important;color:#fff!important}
  `;
}
