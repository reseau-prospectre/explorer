import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const url = process.env.PROSPECTRE_URL || "http://localhost:8083/index.html";
const outputDir = new URL("../.agents/smoke/", import.meta.url);
const outputDirPath = fileURLToPath(outputDir);
const screenshots = process.env.SMOKE_SCREENSHOTS !== "0";
const blockingConsole = [];

function isBlockingConsole(message) {
  const text = message.text();
  if (message.type() !== "error") return false;
  return ![
    "favicon",
    "ResizeObserver loop completed",
    "Scripts \"build/three.js\" and \"build/three.min.js\" are deprecated"
  ].some((ignored) => text.includes(ignored));
}

async function assertVisible(page, selector, label) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout: 12000 });
  return label;
}

async function openContextPanel(page) {
  await page.waitForFunction(() => Boolean(window.__prospectreState?.graph?.nodes?.length), null, { timeout: 20000 });
  const selected = await page.evaluate(() => {
    const node = window.__prospectreState.graph.nodes.find((item) => item.type !== "contribution") || window.__prospectreState.graph.nodes[0];
    if (!node) return null;
    window.__prospectreSelectNode?.(node.id, true);
    return node.id;
  });
  if (!selected) throw new Error("No selectable graph node found");
  await page.locator('[data-panel-id="context"]').waitFor({ state: "visible", timeout: 12000 });
}

async function openPanelByButton(page, buttonSelector, panelId) {
  const open = await page.locator(`[data-panel-id="${panelId}"]`).count();
  if (!open) await page.click(buttonSelector);
  await page.locator(`[data-panel-id="${panelId}"]`).waitFor({ state: "visible", timeout: 12000 });
}

async function openProfilePanel(page) {
  if (await page.locator('[data-panel-id="profile"]').count()) return;
  const profile = page.locator("#profile-button");
  if (await profile.isVisible()) {
    await profile.click();
  } else if (await page.locator("#mobile-menu-toggle").isVisible()) {
    await page.click("#mobile-menu-toggle");
    await profile.click();
  } else {
    await page.evaluate(() => document.querySelector("#profile-button")?.click());
  }
  await page.locator('[data-panel-id="profile"]').waitFor({ state: "visible", timeout: 12000 });
}

async function runViewport(page, name, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await assertVisible(page, "#graph-stage", "graph stage");
  await page.waitForFunction(() => !document.querySelector("#active-project-name")?.textContent?.includes("Chargement"), null, { timeout: 25000 });
  await page.waitForFunction(() => Boolean(document.querySelector("#graph-stage canvas")), null, { timeout: 25000 });
  const hasBeer = await page.evaluate(() => [...document.querySelectorAll("link,script")].some((node) => /beercss|beer\.min/i.test(node.href || node.src || "")));
  if (hasBeer) throw new Error("BeerCSS asset still loaded");
  await openPanelByButton(page, "#insights-toggle", "insights");
  await openProfilePanel(page);
  await openContextPanel(page);
  if (screenshots) await page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, outputDir)), fullPage: true });
}

async function main() {
  if (screenshots) await mkdir(outputDirPath, { recursive: true });
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || "msedge", headless: true });
  const page = await browser.newPage();
  page.on("console", (message) => {
    if (isBlockingConsole(message)) blockingConsole.push(message.text());
  });
  page.on("pageerror", (error) => blockingConsole.push(error.stack || error.message));
  try {
    await runViewport(page, "desktop", { width: 1440, height: 900 });
    await runViewport(page, "mobile", { width: 390, height: 844 });
  } finally {
    await browser.close();
  }
  if (blockingConsole.length) {
    throw new Error(`Blocking console errors:\n${blockingConsole.join("\n")}`);
  }
  console.log(`[smoke:ui] ok ${url}`);
}

main().catch((error) => {
  console.error(`[smoke:ui] failed: ${error.message}`);
  process.exit(1);
});
