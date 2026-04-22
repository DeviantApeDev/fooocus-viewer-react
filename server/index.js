import 'dotenv/config'
import express from 'express'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFile, writeFile, unlink, stat } from 'fs/promises'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

const OUTPUTS_DIR = process.env.FOOOCUS_OUTPUTS_DIR || process.cwd()

app.use(express.json({ limit: '1mb' }))

const DIV_OPEN_REGEX = /<div\s+[^>]*\bid=["']([^"']*_(?:png|jpg|jpeg|webp))["'][^>]*>/gi

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

app.post('/api/delete-images', async (req, res) => {
  const { images } = req.body
  if (!Array.isArray(images)) {
    return res.status(400).json({ success: false, error: 'images array required' })
  }

  const deleted = []
  const failed = []

  for (const { dateStr, src } of images) {
    try {
      const dirPath = join(OUTPUTS_DIR, dateStr)
      const imagePath = join(dirPath, src)

      try {
        await stat(imagePath)
        await unlink(imagePath)
      } catch (e) {
        // file may already be gone
      }

      const logPath = join(dirPath, 'log.html')
      let html = await readFile(logPath, 'utf-8')
      const divId = src.replace(/\.(png|jpg|jpeg|webp)$/, '_$1')
      const newHtml = removeDivBlock(html, divId)

      if (newHtml !== html) {
        await writeFile(logPath, newHtml, 'utf-8')
      } else {
        console.warn(`[delete] Div block not found in log.html for ${src}`)
      }

      deleted.push({ dateStr, src })
    } catch (err) {
      failed.push({ dateStr, src, error: err.message })
    }
  }

  res.json({ success: failed.length === 0, deleted, failed })
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
