import 'dotenv/config'
import express from 'express'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFile, writeFile, unlink, stat, readdir, rm, rename, copyFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

const OUTPUTS_DIR = process.env.FOOOCUS_OUTPUTS_DIR || process.cwd()
const FAVORITES_DIR = join(OUTPUTS_DIR, 'favorites')
const FAVORITES_INDEX = join(FAVORITES_DIR, 'index.json')

app.use(express.json({ limit: '1mb' }))

async function ensureFavoritesDir() {
  if (!existsSync(FAVORITES_DIR)) {
    await mkdir(FAVORITES_DIR, { recursive: true })
  }
}

async function readFavoritesIndex() {
  try {
    const content = await readFile(FAVORITES_INDEX, 'utf-8')
    return JSON.parse(content)
  } catch {
    return {}
  }
}

async function writeFavoritesIndex(index) {
  await ensureFavoritesDir()
  await writeFile(FAVORITES_INDEX, JSON.stringify(index, null, 2), 'utf-8')
}

const DIV_OPEN_REGEX = /<div\s+[^>]*\bid=["']([^"']*_(?:png|jpg|jpeg|webp))["'][^>]*>/gi

function extractDivBlock(html, targetDivId) {
  DIV_OPEN_REGEX.lastIndex = 0
  let match
  while ((match = DIV_OPEN_REGEX.exec(html)) !== null) {
    const divId = match[1]
    if (divId !== targetDivId) continue

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
    return html.slice(startIdx, pos)
  }
  return null
}

function removeDivBlock(html, targetDivId) {
  DIV_OPEN_REGEX.lastIndex = 0
  let match
  while ((match = DIV_OPEN_REGEX.exec(html)) !== null) {
    const divId = match[1]
    if (divId !== targetDivId) continue

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
    return html.slice(0, startIdx) + html.slice(pos)
  }
  return html
}

function insertDivBlock(html, divBlock) {
  const firstDivMatch = html.match(DIV_OPEN_REGEX)
  if (firstDivMatch && firstDivMatch.index > 0) {
    return html.slice(0, firstDivMatch.index) + divBlock + '\n' + html.slice(firstDivMatch.index)
  }
  return html + divBlock + '\n'
}

async function moveFileWithFallback(srcPath, destPath) {
  try {
    await rename(srcPath, destPath)
  } catch (err) {
    if (err.code === 'EXDEV') {
      await copyFile(srcPath, destPath)
      await unlink(srcPath)
    } else {
      throw err
    }
  }
}

function extractMultipleDivBlocks(html, targetIds) {
  const idSet = new Set(targetIds)
  const blocks = {}
  const removals = []

  DIV_OPEN_REGEX.lastIndex = 0
  let match
  while ((match = DIV_OPEN_REGEX.exec(html)) !== null) {
    const divId = match[1]
    if (!idSet.has(divId)) continue

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

    blocks[divId] = html.slice(startIdx, pos)
    removals.push({ start: startIdx, end: pos })
  }

  for (let i = removals.length - 1; i >= 0; i--) {
    html = html.slice(0, removals[i].start) + html.slice(removals[i].end)
  }

  return { cleanedHtml: html, blocks }
}

app.get('/api/favorites', async (_req, res) => {
  try {
    const index = await readFavoritesIndex()
    res.json({ favorites: Object.keys(index) })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.post('/api/favorites/toggle', async (req, res) => {
  const { src, dt } = req.body
  if (!src || typeof src !== 'string') {
    return res.status(400).json({ success: false, error: 'src string required' })
  }

  try {
    const index = await readFavoritesIndex()
    const dateStr = dt || src.split('_')[0]
    const isFavorited = src in index

    if (!isFavorited) {
      await ensureFavoritesDir()

      const srcImagePath = join(OUTPUTS_DIR, dateStr, src)
      const destImagePath = join(FAVORITES_DIR, src)
      await moveFileWithFallback(srcImagePath, destImagePath)

      const logPath = join(OUTPUTS_DIR, dateStr, 'log.html')
      let html = await readFile(logPath, 'utf-8')
      const divId = src.replace(/\.(png|jpg|jpeg|webp)$/, '_$1')
      const divBlock = extractDivBlock(html, divId)

      if (divBlock) {
        html = removeDivBlock(html, divId)
        await writeFile(logPath, html, 'utf-8')
      }

      index[src] = { dateStr, metadata: divBlock || '' }
      await writeFavoritesIndex(index)
    } else {
      const originalDateStr = index[src].dateStr
      const originalDir = join(OUTPUTS_DIR, originalDateStr)
      const dirExists = existsSync(originalDir)

      if (!dirExists) {
        await mkdir(originalDir, { recursive: true })
      }

      const srcImagePath = join(FAVORITES_DIR, src)
      const destImagePath = join(originalDir, src)
      await moveFileWithFallback(srcImagePath, destImagePath)

      if (index[src].metadata) {
        const logPath = join(originalDir, 'log.html')
        const logExists = existsSync(logPath)

        if (logExists) {
          let html = await readFile(logPath, 'utf-8')
          html = insertDivBlock(html, index[src].metadata)
          await writeFile(logPath, html, 'utf-8')
        } else {
          const html = `<!DOCTYPE html>\n<html><body>\n${index[src].metadata}\n</body></html>`
          await writeFile(logPath, html, 'utf-8')
        }
      }

      delete index[src]
      await writeFavoritesIndex(index)
    }

    res.json({ favorites: Object.keys(index), added: !isFavorited })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.post('/api/favorites/batch-toggle', async (req, res) => {
  const { images } = req.body
  if (!Array.isArray(images)) {
    return res.status(400).json({ success: false, error: 'images array required' })
  }

  try {
    await ensureFavoritesDir()
    const index = await readFavoritesIndex()
    let added = 0

    const byDate = {}
    for (const { src, dt } of images) {
      if (!src || typeof src !== 'string') continue
      if (src in index) continue
      const dateStr = dt || src.split('_')[0]
      if (!byDate[dateStr]) byDate[dateStr] = []
      byDate[dateStr].push(src)
    }

    await Promise.all(Object.entries(byDate).map(async ([dateStr, srcs]) => {
      const logPath = join(OUTPUTS_DIR, dateStr, 'log.html')
      let html = null
      try {
        html = await readFile(logPath, 'utf-8')
      } catch {
        // log.html may not exist
      }

      const divIds = srcs.map(src => src.replace(/\.(png|jpg|jpeg|webp)$/, '_$1'))
      let blocks = {}

      if (html) {
        const result = extractMultipleDivBlocks(html, divIds)
        html = result.cleanedHtml
        blocks = result.blocks
      }

      await Promise.all(srcs.map(async (src) => {
        try {
          const srcImagePath = join(OUTPUTS_DIR, dateStr, src)
          const destImagePath = join(FAVORITES_DIR, src)
          await moveFileWithFallback(srcImagePath, destImagePath)

          const divId = src.replace(/\.(png|jpg|jpeg|webp)$/, '_$1')
          const divBlock = blocks[divId] || ''

          index[src] = { dateStr, metadata: divBlock }
          added++
        } catch (err) {
          console.warn(`[batch-favorite] Could not favorite ${src}: ${err.message}`)
        }
      }))

      if (html !== null) {
        await writeFile(logPath, html, 'utf-8')
      }
    }))

    await writeFavoritesIndex(index)
    res.json({ favorites: Object.keys(index), added })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.post('/api/delete-images', async (req, res) => {
  const { images } = req.body
  if (!Array.isArray(images)) {
    return res.status(400).json({ success: false, error: 'images array required' })
  }

  const deleted = []
  const failed = []
  const index = await readFavoritesIndex()

  for (const { dateStr, src } of images) {
    try {
      const logDateStr = dateStr || src.split('_')[0]
      let imagePath = join(OUTPUTS_DIR, logDateStr, src)

      try {
        await stat(imagePath)
        await unlink(imagePath)
      } catch (e) {
        const favPath = join(FAVORITES_DIR, src)
        try {
          await stat(favPath)
          await unlink(favPath)
        } catch (e2) {
          // file may already be gone
        }
      }

      if (src in index) {
        delete index[src]
        await writeFavoritesIndex(index)
      }

      const logPath = join(OUTPUTS_DIR, logDateStr, 'log.html')
      try {
        let html = await readFile(logPath, 'utf-8')
        const divId = src.replace(/\.(png|jpg|jpeg|webp)$/, '_$1')
        const newHtml = removeDivBlock(html, divId)

        if (newHtml !== html) {
          await writeFile(logPath, newHtml, 'utf-8')
        }
      } catch (e) {
        console.warn(`[delete] Could not update log.html for ${src}`)
      }

      deleted.push({ dateStr: logDateStr, src })
    } catch (err) {
      failed.push({ dateStr, src, error: err.message })
    }
  }

  res.json({ success: failed.length === 0, deleted, failed })
})

app.post('/api/delete-day', async (req, res) => {
  const { dateStr } = req.body
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return res.status(400).json({ success: false, error: 'Valid dateStr required (YYYY-MM-DD)' })
  }

  const dirPath = join(OUTPUTS_DIR, dateStr)

  try {
    await stat(dirPath)
  } catch (e) {
    return res.status(404).json({ success: false, error: `Folder ${dateStr} not found` })
  }

  try {
    const files = await readdir(dirPath)
    let deletedCount = 0

    for (const file of files) {
      try {
        await unlink(join(dirPath, file))
        deletedCount++
      } catch (e) {
        console.warn(`[delete-day] Could not delete file ${file}: ${e.message}`)
      }
    }

    await rm(dirPath, { recursive: true, force: true })

    res.json({ success: true, dateStr, deletedCount })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Serve Fooocus outputs (date folders, images, log.html)
app.use(express.static(OUTPUTS_DIR))

// Serve built SPA
const distPath = join(__dirname, '../dist')
app.use(express.static(distPath))

// SPA fallback
app.get('*', (req, res) => {
  // Don't serve SPA for date-folder data requests
  if (/^\/\d{4}-\d{2}-\d{2}\b/.test(req.path)) {
    return res.status(404).send('Not found')
  }

  const viewerPath = join(distPath, 'viewer.html')
  const indexPath = join(distPath, 'index.html')
  if (existsSync(viewerPath)) {
    res.sendFile(viewerPath)
  } else if (existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send('Build not found. Run npm run build first.')
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Serving Fooocus outputs from: ${OUTPUTS_DIR}`)
})
