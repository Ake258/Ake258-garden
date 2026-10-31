// 把 content/ 副本里的 Obsidian 日期（YY-MM-DD [HH:mm]）改写成 Quartz 认的 ISO 格式。
//
// 为什么要这个脚本：
//   Quartz 的 created-modified-date 插件只认 frontmatter 里的 created / modified / published，
//   且不认两位年（26-10-25 15:43）。它拿到这种字符串后不会走 git/filesystem 兜底，
//   而是直接返回 new Date()，结果站上每篇笔记的日期都等于「构建时刻」。
//
// 规则（幂等，重复运行不会二次转换）：
//   created:   26-09-22 10:08  ->  created:  2026-09-22T10:08:00
//   updated:   26-10-25 15:24  ->  modified: 2026-10-25T15:24:00   （Quartz 不认 updated，改名）
//   modified / published 同理原地转 ISO
//
// 只改 content/ 下的副本，不动 Obsidian vault。
import { readdirSync, readFileSync, writeFileSync, statSync } from "fs"
import { join, extname } from "path"

const CONTENT = "content"
const DATE_KEYS = new Set(["created", "updated", "modified", "published", "date"])

// 26-10-25 15:43 / 26-10-25
const obsidianDateTime = /^(\d{2})-(\d{2})-(\d{2})[ T]+(\d{2}):(\d{2})(?::(\d{2}))?$/
const obsidianDateOnly = /^(\d{2})-(\d{2})-(\d{2})$/

function toIso(raw) {
  const m = raw.match(obsidianDateTime) || raw.match(obsidianDateOnly)
  if (!m) return null
  const [, yy, mm, dd, hh = "00", mi = "00", ss = "00"] = m
  return `20${yy}-${mm}-${dd}T${hh}:${mi}:${ss}`
}

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (extname(p) === ".md") out.push(p)
  }
  return out
}

let files = 0
let keys = 0

for (const fp of walk(CONTENT)) {
  const text = readFileSync(fp, "utf8")
  if (!text.startsWith("---")) continue

  const end = text.indexOf("\n---", 3)
  if (end === -1) continue

  const fm = text.slice(4, end)
  const body = text.slice(end)
  let changed = false

  const lines = fm.split("\n").map((line) => {
    // 只处理顶格 key: value，缩进的是 YAML 子项
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.+?)\s*$/)
    if (!m) return line
    const [, key, rawValue] = m
    if (!DATE_KEYS.has(key)) return line

    const value = rawValue.replace(/^["']|["']$/g, "")
    const iso = toIso(value)
    if (!iso) return line

    // Quartz 只认 created / modified / published，updated 要改名
    const outKey = key === "updated" ? "modified" : key === "date" ? "created" : key
    changed = true
    keys++
    return `${outKey}: ${iso}`
  })

  if (!changed) continue
  writeFileSync(fp, `---\n${lines.join("\n")}${body}`)
  files++
}

console.log(`✅ 日期规范化完成：改写 ${files} 个文件、${keys} 个日期字段`)
