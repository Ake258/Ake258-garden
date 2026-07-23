// Post-install patch: fix created-modified-date plugin to handle Obsidian's YY-MM-DD date format
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distPath = join(__dirname, '..', '.quartz', 'plugins', 'created-modified-date', 'dist', 'index.js');

let code = readFileSync(distPath, 'utf-8');

// 1. Add Obsidian date regexes
code = code.replace(
  /var iso8601DateOnlyRegex = [^;]+;/,
  `var iso8601DateOnlyRegex = /^\\d{4}-\\d{2}-\\d{2}$/;
var obsidianDateTimeRegex = /^\\d{2}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}$/;
var obsidianDateOnlyRegex = /^\\d{2}-\\d{2}-\\d{2}$/;`
);

// 2. Add Obsidian date normalization in coerceDate
code = code.replace(
  /if \(typeof d === "string" && iso8601DateOnlyRegex\.test\(d\)\) \{\s*d = `\$\{d\}T00:00:00`;\s*\}/,
  `if (typeof d === "string" && iso8601DateOnlyRegex.test(d)) {
    d = \`\${d}T00:00:00\`;
  }
  if (typeof d === "string" && obsidianDateTimeRegex.test(d)) {
    const [datePart, timePart] = d.split(" ");
    const [yy, mm, dd] = datePart.split("-");
    d = \`20\${yy}-\${mm}-\${dd}T\${timePart}:00\`;
  }
  if (typeof d === "string" && obsidianDateOnlyRegex.test(d)) {
    const [yy, mm, dd] = d.split("-");
    d = \`20\${yy}-\${mm}-\${dd}T00:00:00\`;
  }`
);

// 3. Add updated fallback for modified
code = code.replace(
  /modified \|\|= data\.frontmatter\.modified;/,
  'modified ||= data.frontmatter.modified || data.frontmatter.updated;'
);

writeFileSync(distPath, code);
console.log('✅ Patched created-modified-date plugin for Obsidian date support');
