import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const targetPath = join(__dirname, "..", ".quartz", "plugins", "note-properties", "dist", "components", "index.js");

try {
  let raw = readFileSync(targetPath, "utf8");
  const search = ".note-properties .note-properties-value {\n  padding";
  const replace = ".note-properties .note-properties-value {\n  text-align: left;\n  padding";
  
  if (raw.includes(".note-properties .note-properties-value {\n  text-align")) {
    console.log("[patch] note-properties already patched, skipping");
    process.exit(0);
  }
  
  raw = raw.replace(search, replace);
  writeFileSync(targetPath, raw, "utf8");
  console.log("[patch] note-properties: text-align left injected");
} catch (e) {
  console.error("[patch] failed to patch note-properties:", e.message);
  process.exit(1);
}