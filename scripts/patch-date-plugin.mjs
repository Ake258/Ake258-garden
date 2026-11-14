/**
 * 给 @quartz-community/created-modified-date 打源码补丁（幂等、非致命）
 *
 * 补丁做两件事：
 *   1) 让插件能解析 Obsidian Linter 写出的两位年格式
 *      YY-MM-DD HH:mm  /  YY-MM-DD HH:mm:ss  /  YY-MM-DD
 *   2) 让插件把 frontmatter.updated 当作 modified 读取
 *      （Quartz 原生只认 created / modified / published，不认 updated）
 *
 * 背景：插件源从 github: 迁到 npm 之后，代码落在 node_modules 里，
 * 早期的 .quartz/plugins/created-modified-date/dist/index.js 路径已不存在，
 * 旧补丁一直被静默跳过，只能靠 scripts/normalize-dates.mjs 改写 content/ 源文件
 * 来实现同样的效果（副作用：每次构建 112 个文件变脏）。
 *
 * 打好补丁后，content/ 里的 percent 原样保留 Obsidian 格式，构建时由插件在内存中转换，
 * 源文件不再被改写。normalize-dates.mjs 保留但不再自动调用。
 *
 * 兼容：Cloudflare Pages 构建命令是
 *   npx quartz plugin install && node scripts/patch-date-plugin.mjs && npx quartz build
 * 因此这里必须永远 exit 0，绝不能挡住后续构建。
 */
import { readFileSync, writeFileSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

const TARGETS = [
  // npm 包实际位置（主）
  join(root, "node_modules", "@quartz-community", "created-modified-date", "dist", "index.js"),
  // 旧的 .quartz/plugins 位置（兼容）
  join(root, ".quartz", "plugins", "created-modified-date", "dist", "index.js"),
]

const MARKER = "obsidianDateTimeRegex"

const DATE_DECL_RE = /var iso8601DateOnlyRegex = [^;]+;/
const DATE_DECL_NEW = [
  "var iso8601DateOnlyRegex = /^\\d{4}-\\d{2}-\\d{2}$/;",
  "var obsidianDateTimeRegex = /^\\d{2}-\\d{2}-\\d{2}[ T]+\\d{2}:\\d{2}(?::\\d{2})?$/;",
  "var obsidianDateOnlyRegex = /^\\d{2}-\\d{2}-\\d{2}$/;",
].join("\n")

const COERCE_ANCHOR = "const dt = d === void 0 ?"
const COERCE_INJECT = [
  'if (typeof d === "string" && obsidianDateTimeRegex.test(d)) {',
  '  const parts = d.trim().split(/[ T]+/);',
  '  const [yy, mm, dd] = parts[0].split("-");',
  '  const t = parts[1].length === 5 ? `${parts[1]}:00` : parts[1];',
  '  d = `20${yy}-${mm}-${dd}T${t}`;',
  "}",
  'if (typeof d === "string" && obsidianDateOnlyRegex.test(d)) {',
  '  const [yy, mm, dd] = d.split("-");',
  "  d = `20${yy}-${mm}-${dd}T00:00:00`;",
  "}",
].join("\n  ") + "\n  "

const MODIFIED_OLD = "modified ||= data.frontmatter.modified;"
const MODIFIED_NEW = "modified ||= data.frontmatter.modified || data.frontmatter.updated;"

function patchOne(file) {
  if (!existsSync(file)) return "missing"
  let code = readFileSync(file, "utf8")
  if (code.includes(MARKER)) return "already"

  const before = code
  code = code.replace(DATE_DECL_RE, DATE_DECL_NEW)
  code = code.replace(COERCE_ANCHOR, COERCE_INJECT + COERCE_ANCHOR)
  code = code.replace(MODIFIED_OLD, MODIFIED_NEW)

  if (code === before) return "no-match"
  writeFileSync(file, code, "utf8")
  return "patched"
}

try {
  const results = []
  for (const t of TARGETS) {
    const r = patchOne(t)
    results.push({ file: t, result: r })
    const label = t.includes("node_modules") ? "npm 包" : ".quartz"
    const map = {
      patched: "✅ 补丁已应用",
      already: "⏭️  已打过补丁，跳过",
      missing: "—  路径不存在，跳过",
      "no-match": "⚠️  未匹配到目标代码（插件版本可能变了）",
    }
    console.log(`[patch-date] ${label}: ${map[r] ?? r}`)
  }

  const patched = results.filter((r) => r.result === "patched" || r.result === "already")
  if (patched.length === 0) {
    console.log("[patch-date] 未在任何已知路径上打补丁，构建将继续（不阻塞）")
  }
} catch (err) {
  console.warn("[patch-date] 补丁过程出错（忽略，不阻塞构建）：", err?.message ?? err)
}

process.exit(0)
