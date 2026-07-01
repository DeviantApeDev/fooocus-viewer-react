import 'dotenv/config'
import { copyFileSync, existsSync, renameSync } from 'fs'
import { join } from 'path'

const fooocusOutputDir = process.env.FOOOCUS_OUTPUTS_DIR || process.cwd()
const distDir = join(import.meta.dirname, 'dist')

renameSync(join(distDir, 'index.html'), join(distDir, 'viewer.html'))

if (!existsSync(fooocusOutputDir)) {
  console.error(`Fooocus outputs directory not found: ${fooocusOutputDir}`)
  process.exit(1)
}

copyFileSync(join(distDir, 'viewer.html'), join(fooocusOutputDir, 'viewer.html'))

console.log(`Deployed to ${fooocusOutputDir}`)
console.log(`Access at: http://localhost:7860/file=outputs/viewer.html`)
