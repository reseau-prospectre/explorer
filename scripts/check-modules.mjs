import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const files = process.argv.slice(2);
const targets = files.length ? files : [
  "assets/js/main.js",
  "assets/js/ui/overlay-manager.js",
  "assets/js/controllers/comments-controller.js",
  "assets/js/controllers/graph-controller.js",
  "assets/js/panels/panel-manager.js",
  "assets/js/ui/graph-toolbar.js"
];

let failed = false;

for (const file of targets) {
  const source = await readFile(file, "utf8");
  const result = spawnSync(process.execPath, ["--input-type=module", "--check"], {
    input: source,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    failed = true;
    process.stderr.write(`\n[check:modules] ${file}\n`);
    process.stderr.write(result.stderr || result.stdout);
  }
}

if (failed) process.exit(1);
console.log(`[check:modules] ${targets.length} module(s) ok`);
