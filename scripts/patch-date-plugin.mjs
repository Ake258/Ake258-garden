/**
 * 兼容 Cloudflare Pages 构建命令的旧脚本（已改造为「非致命 + 顺带做日期规范化」）
 *
 * 背景：CF Pages 里配置的构建命令是
 *   npx quartz plugin install && node scripts/patch-date-plugin.mjs && npx quartz build
 *
 * 原本这里会 hot-patch `.quartz/plugins/created-modified-date/dist/index.js`，
 * 但插件源从 github: 迁移到 npm（@quartz-community/*）之后，代码落到了 node_modules，
 * 旧路径不存在 → readFileSync 抛 ENOENT → 退出码 1 → 后面的 `npx quartz build` 根本不会执行
 * （表现：CF 报告 "🚫 Build failed"，线上一直保留最后一次成功的旧版本）。
 *
 * 现在的行为：
 *   1. 旧路径若还在（理论上不会再有）才打补丁，失败也忽略
 *   2. 统一调用 scripts/normalize-dates.mjs 做日期规范化（幂等）
 *      —— 很重要：CF 的命令是直接 `npx quartz build`，不会触发 npm 的 prebuild，
 *         所以日期规范化的活放在这里做
 *   3. 无论发生什么都 exit 0 —— 绝不能挡住后面的构建步骤
 */
import { existsSync } from "fs"
import { readFile, writeFile } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const LEGACY_DIST = join(
  __dirname,
  "..",
  ".quartz",
  "plugins",
  "created-modified-date",
  "dist",
  "index.js",
)

async function patchLegacy() {
  if (!existsSync(LEGACY_DIST)) {
    console.log("[patch-date] 旧插件路径不存在（插件已迁到 npm），跳过 hot-patch")
    return
  }
  try {
    let code = await readFile(LEGACY_DIST, "utf-8")
    if (code.includes("obsidianDateTimeRegex")) {
      console.log("[patch-date] 旧插件已打过补丁，跳过")
      return
    }
    code = code.replace(
      /var iso8601DateOnlyRegex = [^;]+;/,
      `var iso8601DateOnlyRegex = /^\\d{4}-\\d{2}-\\d{2}$/;
var obsidianDateTimeRegex = /^\\d{2}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}$/;
var obsidianDateOnlyRegex = /^\\d{2}-\\d{2}-\\d{2}$/`,
    )
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
  }`,
    )
    code = code.replace(
      /modified \|\|= data\.frontmatter\.modified;/,
      "modified ||= data.frontmatter.modified || data.frontmatter.updated;",
    )
    await writeFile(LEGACY_DIST, code)
    console.log("[patch-date] 旧插件补丁已应用")
  } catch (err) {
    console.warn("[patch-date] 旧插件补丁失败（忽略）：", err?.message ?? err)
  }
}

async function normalizeDates() {
  try {
    await import("./normalize-dates.mjs")
  } catch (err) {
    console.warn("[patch-date] 日期规范化失败（忽略）：", err?.message ?? err)
  }
}

try {
  await patchLegacy()
  await normalizeDates()
} catch (err) {
  console.warn("[patch-date] 未预期的错误（忽略）：", err?.message ?? err)
}

process.exit(0)
