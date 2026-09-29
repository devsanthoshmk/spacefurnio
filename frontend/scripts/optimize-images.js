import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT_DIR = path.resolve(__dirname, '..')
const TARGET_DIRS = [
  path.join(ROOT_DIR, 'public'),
  path.join(ROOT_DIR, 'src/images'),
]

// Rules for max dimensions and qualities to preserve visually lossless appearance
const CONFIG = {
  // Full-screen hero / background images
  background: {
    maxWidth: 2560,
    maxHeight: 1440,
    webpQuality: 88,
    jpegQuality: 88,
  },
  // Team / person photos
  team: {
    maxWidth: 1200,
    maxHeight: 1500,
    webpQuality: 88,
    jpegQuality: 88,
  },
  // Logos / brand graphics
  logo: {
    maxWidth: 1000,
    maxHeight: 1000,
    webpQuality: 92,
    jpegQuality: 90,
  },
  // Standard product / content images
  standard: {
    maxWidth: 1920,
    maxHeight: 1920,
    webpQuality: 88,
    jpegQuality: 88,
  },
}

function getCategory(filePath) {
  const lower = filePath.toLowerCase()
  if (lower.includes('logo') || lower.includes('favico') || lower.includes('clients')) {
    return 'logo'
  }
  if (lower.includes('team') || lower.includes('people')) {
    return 'team'
  }
  if (
    lower.includes('taglinebg') ||
    lower.includes('linemeetslight') ||
    lower.includes('functionmeetsoul') ||
    lower.includes('aboutus-back') ||
    lower.includes('hero') ||
    lower.includes('collabs-bg') ||
    lower.includes('coming-soon') ||
    lower.includes('screen')
  ) {
    return 'background'
  }
  return 'standard'
}

function getAllImageFiles(dir) {
  let results = []
  if (!fs.existsSync(dir)) return results
  const list = fs.readdirSync(dir)
  for (const file of list) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllImageFiles(fullPath))
    } else if (/\.(png|jpe?g|webp)$/i.test(file)) {
      results.push(fullPath)
    }
  }
  return results
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function optimizeFile(filePath) {
  const originalBuffer = fs.readFileSync(filePath)
  const originalSize = originalBuffer.length
  const ext = path.extname(filePath).toLowerCase()
  const baseWithoutExt = filePath.slice(0, -ext.length)
  const categoryName = getCategory(filePath)
  const config = CONFIG[categoryName]

  const metadata = await sharp(originalBuffer).metadata()
  const origWidth = metadata.width || 0
  const origHeight = metadata.height || 0

  // Calculate proportional resize if exceeds max dimensions
  let resizeOptions = null
  if (origWidth > config.maxWidth || origHeight > config.maxHeight) {
    resizeOptions = {
      width: config.maxWidth,
      height: config.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    }
  }

  // 1. Generate optimized WebP version
  let webpPipeline = sharp(originalBuffer)
  if (resizeOptions) {
    webpPipeline = webpPipeline.resize(resizeOptions)
  }
  const webpBuffer = await webpPipeline
    .webp({
      quality: config.webpQuality,
      effort: 6,
      smartSubsample: true,
    })
    .toBuffer()

  const webpPath = `${baseWithoutExt}.webp`
  fs.writeFileSync(webpPath, webpBuffer)

  // 2. Re-optimize the original file format (PNG or JPG) in place
  let optBuffer = null
  let optPipeline = sharp(originalBuffer)
  if (resizeOptions) {
    optPipeline = optPipeline.resize(resizeOptions)
  }

  if (ext === '.png') {
    optBuffer = await optPipeline
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true,
      })
      .toBuffer()
  } else if (ext === '.jpg' || ext === '.jpeg') {
    optBuffer = await optPipeline
      .jpeg({
        quality: config.jpegQuality,
        mozjpeg: true,
      })
      .toBuffer()
  } else if (ext === '.webp') {
    optBuffer = webpBuffer
  }

  if (optBuffer && optBuffer.length < originalSize) {
    fs.writeFileSync(filePath, optBuffer)
  }

  const finalOrigSize = fs.statSync(filePath).size
  const finalWebpSize = fs.statSync(webpPath).size

  return {
    filePath: path.relative(ROOT_DIR, filePath),
    category: categoryName,
    dimensions: `${origWidth}x${origHeight}`,
    originalSize,
    optimizedSize: finalOrigSize,
    webpSize: finalWebpSize,
    savedBytes: originalSize - Math.min(finalOrigSize, finalWebpSize),
  }
}

async function run() {
  console.log('🖼️ Starting Programmatic Image Optimization Pipeline...\n')
  const allFiles = TARGET_DIRS.flatMap((dir) => getAllImageFiles(dir))

  // Filter out any temp files
  const uniqueFiles = [...new Set(allFiles)]
  console.log(`Found ${uniqueFiles.length} image files to process.\n`)

  let totalOriginal = 0
  let totalOptimized = 0
  let totalWebp = 0
  const report = []

  for (const file of uniqueFiles) {
    try {
      const res = await optimizeFile(file)
      totalOriginal += res.originalSize
      totalOptimized += res.optimizedSize
      totalWebp += res.webpSize
      report.push(res)
      console.log(
        `✓ ${res.filePath} (${res.dimensions})` +
          `\n   Original: ${formatBytes(res.originalSize)}` +
          ` | Optimized: ${formatBytes(res.optimizedSize)}` +
          ` | WebP: ${formatBytes(res.webpSize)}` +
          ` (Saved: ${((1 - res.webpSize / res.originalSize) * 100).toFixed(1)}% via WebP)`
      )
    } catch (err) {
      console.error(`✗ Failed to optimize ${file}:`, err.message)
    }
  }

  console.log('\n========================================')
  console.log('🚀 IMAGE OPTIMIZATION SUMMARY')
  console.log('========================================')
  console.log(`Total Original Size:   ${formatBytes(totalOriginal)}`)
  console.log(`Total In-Place Format: ${formatBytes(totalOptimized)} (Saved: ${formatBytes(totalOriginal - totalOptimized)})`)
  console.log(`Total WebP Size:       ${formatBytes(totalWebp)} (Saved: ${formatBytes(totalOriginal - totalWebp)} / ${((1 - totalWebp / totalOriginal) * 100).toFixed(1)}%)`)
  console.log('========================================\n')
}

run()
