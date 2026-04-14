import { copyFileSync, existsSync, renameSync } from 'fs'
import { join } from 'path'

// Change this to your Fooocus's outputs directory
const fooocusOutputDir = 'D:\\AI\\StabilityMatrix-win-x64\\Data\\Packages\\Fooocus\\outputs'
const distDir = join(import.meta.dirname, 'dist')

renameSync(join(distDir, 'index.html'), join(distDir, 'viewer.html'))

if (!existsSync(fooocusOutputDir)) {
  console.error(`Fooocus outputs directory not found: ${fooocusOutputDir}`)
  process.exit(1)
}

copyFileSync(join(distDir, 'viewer.html'), join(fooocusOutputDir, 'viewer.html'))

console.log(`Deployed to ${fooocusOutputDir}`)
console.log(`Access at: http://localhost:7860/file=outputs/viewer.html`)
