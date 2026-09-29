import { execSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DIST_DIR = path.resolve(__dirname, '../dist')

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
}

/**
 * Start a minimal static HTTP server with SPA fallback
 */
function createStaticServer(distDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url, 'http://localhost')
        let filePath = path.join(distDir, decodeURIComponent(parsedUrl.pathname))

        // If path is a directory or has no extension, try static file first, then fallback to index.html
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html')
        }

        if (!fs.existsSync(filePath)) {
          filePath = path.join(distDir, 'index.html')
        }

        const ext = path.extname(filePath).toLowerCase()
        const contentType = MIME_MAP[ext] || 'application/octet-stream'

        fs.readFile(filePath, (err, data) => {
          if (err) {
            res.writeHead(500)
            res.end('Error loading ' + filePath)
            return
          }
          res.writeHead(200, { 'Content-Type': contentType })
          res.end(data)
        })
      } catch (e) {
        res.writeHead(500)
        res.end('Server error: ' + e.message)
      }
    })

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve({
        port,
        close: () => new Promise((res) => server.close(res)),
      })
    })

    server.on('error', reject)
  })
}

/**
 * Discover non-storefront marketing & content routes to prerender.
 * Storefront pages (/shop, /shop/product/*) and Admin (/admin-spacefurnio/*) are kept dynamic CSR.
 */
function discoverRoutes() {
  const contentRoutes = [
    '/',
    '/about',
    '/portfolio',
    '/collabs',
    '/contact',
    '/shopping',
  ]

  console.log(`Prerendering ${contentRoutes.length} content/marketing pages (storefront & admin kept dynamic CSR).`)
  return contentRoutes
}

/**
 * Safely launch Chromium with auto-install fallback
 */
async function launchBrowser() {
  try {
    return await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
  } catch {
    console.warn('Chromium executable not found. Attempting automatic installation...')
    try {
      execSync('npx playwright install chromium', { stdio: 'inherit' })
      return await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      })
    } catch (err) {
      console.warn('Failed to launch headless browser in environment:', err.message)
      return null
    }
  }
}

/**
 * Worker pool for parallel prerendering
 */
async function prerenderRoutes(routes, baseUrl) {
  const browser = await launchBrowser()
  if (!browser) {
    console.warn('Prerendering skipped due to browser unavailability. Serving standard SPA build.')
    return { completed: 0, failed: 0 }
  }

  const CONCURRENCY = Math.min(routes.length, 6)
  console.log(`Prerendering ${routes.length} routes with concurrency = ${CONCURRENCY}...`)
  const queue = [...routes]
  let completed = 0
  let failed = 0

  async function worker() {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()

    while (queue.length > 0) {
      const currentRoute = queue.shift()
      if (!currentRoute) break

      const targetUrl = `${baseUrl}${currentRoute}`
      try {
        await page.goto(targetUrl, {
          waitUntil: 'networkidle',
          timeout: 25000,
        }).catch(async () => {
          await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
        })

        // Wait for Vue root `#app` to be populated
        await page.waitForFunction(
          () => {
            const app = document.getElementById('app')
            return app && app.children.length > 0
          },
          { timeout: 10000 },
        ).catch(() => {})

        // Small buffer for DOM animations / text styling
        await page.waitForTimeout(250)

        // Capture rendered HTML
        const html = await page.content()

        // Determine destination file
        let relativePath = currentRoute === '/' ? 'index.html' : path.join(currentRoute.replace(/^\//, ''), 'index.html')
        const targetPath = path.join(DIST_DIR, relativePath)

        fs.mkdirSync(path.dirname(targetPath), { recursive: true })
        fs.writeFileSync(targetPath, html, 'utf-8')

        completed++
        process.stdout.write(`  [${completed}/${routes.length}] Prerendered ${currentRoute}\n`)
      } catch (err) {
        failed++
        console.error(`  [FAILED] ${currentRoute}: ${err.message}`)
      }
    }

    await page.close()
    await context.close()
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker())
  await Promise.all(workers)

  await browser.close()
  return { completed, failed }
}

async function main() {
  const startTime = Date.now()

  if (!fs.existsSync(DIST_DIR)) {
    console.error('Error: dist directory does not exist. Run "vite build" first.')
    process.exit(1)
  }

  console.log('--- Starting SpaceFurnio SSG Prerender Pipeline ---')
  const routes = discoverRoutes()
  const server = await createStaticServer(DIST_DIR)
  const baseUrl = `http://127.0.0.1:${server.port}`

  try {
    const { completed, failed } = await prerenderRoutes(routes, baseUrl)
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`\n SSG Prerender complete in ${elapsed}s! (${completed} rendered, ${failed} failed)`)
  } finally {
    await server.close()
  }
}

main().catch((err) => {
  console.error('Fatal SSG Prerender Error:', err)
  process.exit(1)
})
