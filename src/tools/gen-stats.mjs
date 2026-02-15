import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const postsDir = path.resolve('src/content/posts')
const outDir = path.resolve('src/generated')
const outFile = path.join(outDir, 'stats.json')

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory())
      files.push(...walk(p))
    else files.push(p)
  }
  return files
}

function stripFrontmatter(md) {
  // remove leading --- ... --- frontmatter
  if (md.startsWith('---')) {
    const idx = md.indexOf('\n---', 3)
    if (idx !== -1)
      return md.slice(idx + 4)
  }
  return md
}

function countCJKAndWords(text) {
  // 简单：中文按字符算；英文按单词算
  const cjk = (text.match(/[\u4E00-\u9FFF]/g) || []).length
  const enWords = (text.match(/[a-z0-9]+(?:'[a-z0-9]+)?/gi) || []).length
  return { cjk, enWords }
}

if (!fs.existsSync(postsDir)) {
  console.error('找不到 posts 目录：', postsDir)
  process.exit(1)
}

const mdFiles = walk(postsDir).filter(f => f.toLowerCase().endsWith('.md'))

let totalCJK = 0
let totalEnWords = 0

for (const file of mdFiles) {
  const raw = fs.readFileSync(file, 'utf8')
  const body = stripFrontmatter(raw)
  const { cjk, enWords } = countCJKAndWords(body)
  totalCJK += cjk
  totalEnWords += enWords
}

const now = new Date()
const stats = {
  posts: mdFiles.length,
  totalCJKChars: totalCJK,
  totalEnglishWords: totalEnWords,
  updatedAt: now.toISOString(),
  updatedAtLocal: now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-'),
}

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(outFile, JSON.stringify(stats, null, 2), 'utf8')

console.warn('✅ stats generated:', outFile)
console.warn(stats)
