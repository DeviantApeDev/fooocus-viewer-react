import { readdir, readFile, writeFile, stat } from 'fs/promises'
import { join } from 'path'
import { createInterface } from 'readline'

const DEFAULT_OUTPUTS = process.cwd()
const DIV_ID_REGEX = /^(.+)\_(png|jpg|jpeg|webp)$/
const DIV_OPEN_REGEX = /<div\s+[^>]*\bid=["']([^"']*_(?:png|jpg|jpeg|webp))["'][^>]*>/gi

function findDivBlocks(html) {
  DIV_OPEN_REGEX.lastIndex = 0
  const blocks = []
  let match
  while ((match = DIV_OPEN_REGEX.exec(html)) !== null) {
    const divId = match[1]
    const startIdx = match.index
    let depth = 1
    let pos = match.index + match[0].length
    while (depth > 0 && pos < html.length) {
      const nextOpen = html.indexOf('<div', pos)
      const nextClose = html.indexOf('</div>', pos)
      if (nextClose === -1) break
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++
        pos = nextOpen + 4
      } else {
        depth--
        pos = nextClose + 6
      }
    }
    blocks.push({ fullMatch: html.slice(startIdx, pos), divId, innerContent: html.slice(match.index + match[0].length, pos - 6) })
  }
  return blocks
}

const deleteMode = process.argv.includes('--delete')

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer.trim()) }))
}

async function getOutputsDir() {
  const argDir = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1])
  if (argDir) return argDir

  console.log(`Default: ${DEFAULT_OUTPUTS}`)
  const answer = await ask('Outputs directory path (Enter for default): ')
  return answer || DEFAULT_OUTPUTS
}

function idToFilename(divId) {
  const match = divId.match(DIV_ID_REGEX)
  if (!match) return null
  return `${match[1]}.${match[2]}`
}

function extractSettingsText(htmlContent) {
  const pMatch = htmlContent.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  if (pMatch) {
    const text = pMatch[1].replace(/<[^>]*>/g, '').trim()
    if (text) return text.substring(0, 60) + (text.length > 60 ? '...' : '')
  }

  const rows = htmlContent.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi)
  if (rows) {
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const keyMatch = row.match(/<td[^>]*class=["'][^"']*(?:label|key)[^"']*["'][^>]*>([\s\S]*?)<\/td>/i)
      const valMatch = row.match(/<td[^>]*class=["'][^"']*value[^"']*["'][^>]*>([\s\S]*?)<\/td>/i)
      if (keyMatch && valMatch) {
        const key = keyMatch[1].replace(/<[^>]*>/g, '').trim()
        if (key === 'Prompt') {
          const text = valMatch[1].replace(/<[^>]*>/g, '').trim()
          return text.substring(0, 60) + (text.length > 60 ? '...' : '')
        }
      }
    }
  }
  return '(no prompt)'
}

async function processDir(dirPath, dateStr) {
  const logPath = join(dirPath, 'log.html')
  let html
  try {
    html = await readFile(logPath, 'utf-8')
  } catch {
    return null
  }

  const toRemove = []
  const blocks = findDivBlocks(html)

  for (const { fullMatch, divId, innerContent } of blocks) {
    const filename = idToFilename(divId)
    if (!filename) continue

    const imagePath = join(dirPath, filename)
    let exists = true
    try {
      await stat(imagePath)
    } catch {
      exists = false
    }

    if (!exists) {
      toRemove.push({ fullMatch, filename, preview: extractSettingsText(innerContent) })
    }
  }

  return { html, toRemove, logPath }
}

async function main() {
  const outputsDir = await getOutputsDir()

  let dirEntries
  try {
    dirEntries = await readdir(outputsDir, { withFileTypes: true })
  } catch (err) {
    console.error(`Cannot read directory: ${outputsDir}`)
    console.error(err.message)
    process.exit(1)
  }

  const dateDirs = dirEntries
    .filter(e => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
    .map(e => e.name)
    .sort()

  console.log('')
  console.log(`Scanning ${dateDirs.length} date directories in:`)
  console.log(outputsDir)
  console.log(`Mode: ${deleteMode ? 'DELETE' : 'DRY-RUN (--delete to modify)'}`)
  console.log('')

  let totalDirs = 0
  let totalRemoved = 0

  for (const dateStr of dateDirs) {
    const dirPath = join(outputsDir, dateStr)
    const result = await processDir(dirPath, dateStr)
    if (!result) continue

    const { html, toRemove, logPath } = result
    if (toRemove.length === 0) continue

    totalDirs++
    console.log(`[${dateStr}] ${toRemove.length} entries with missing images:`)

    for (const { filename, preview } of toRemove) {
      console.log(`  - ${filename}`)
      console.log(`    ${preview}`)
    }

    if (deleteMode) {
      let newHtml = html
      for (const { fullMatch } of toRemove) {
        newHtml = newHtml.replace(fullMatch, '')
      }
      await writeFile(logPath, newHtml, 'utf-8')
      console.log(`  ✓ Updated log.html`)
    }

    totalRemoved += toRemove.length
  }

  console.log('')
  console.log('---')
  if (totalRemoved === 0) {
    console.log('No missing image entries found.')
  } else {
    console.log(`${totalRemoved} entries with missing images across ${totalDirs} days.`)
    if (!deleteMode) {
      console.log('Run with --delete to remove them.')
    } else {
      console.log('Entries have been removed and log.html files updated.')
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
