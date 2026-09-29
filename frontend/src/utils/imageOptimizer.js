/**
 * SpaceFurnio Image Optimization Utility
 *
 * Programmatically optimizes image URLs for fast web delivery without sacrificing visual quality.
 * Handles dynamic CDN parameters for Unsplash, Google User Content, Cloudflare, local assets, and Amazon.
 */

const FALLBACK_PLACEHOLDER = '/images/placeholder.png'

/**
 * Optimizes an image URL for specific dimensions, format, and quality.
 *
 * @param {string|null|undefined} url - The source image URL or path
 * @param {Object} [options={}] - Optimization parameters
 * @param {number} [options.width] - Target display width in pixels
 * @param {number} [options.height] - Target display height in pixels
 * @param {number} [options.quality=82] - Output quality (1-100)
 * @param {string} [options.format='auto'] - Output format ('auto', 'webp', 'avif', etc.)
 * @param {string} [options.fit='crop'] - Resize mode ('crop', 'fill', 'inside', 'cover')
 * @returns {string} - The optimized URL
 */
export function optimizeImageUrl(url, options = {}) {
  if (!url || typeof url !== 'string') {
    return FALLBACK_PLACEHOLDER
  }

  const trimmed = url.trim()
  if (!trimmed) return FALLBACK_PLACEHOLDER

  const {
    width,
    height,
    quality = 82,
    format = 'auto',
    fit = 'crop',
  } = options

  // 1. Unsplash & Imgix CDN Images
  if (trimmed.includes('unsplash.com')) {
    try {
      const parsed = new URL(trimmed)
      parsed.searchParams.set('auto', format === 'auto' ? 'format' : format)
      parsed.searchParams.set('fit', fit)
      parsed.searchParams.set('q', String(quality))
      if (width) parsed.searchParams.set('w', String(Math.round(width)))
      if (height) parsed.searchParams.set('h', String(Math.round(height)))
      return parsed.toString()
    } catch {
      return trimmed
    }
  }

  // 2. Google User Content / LH3 URLs (eg. Collabs)
  if (trimmed.includes('googleusercontent.com')) {
    try {
      // Remove any existing suffix after = (e.g. =w500-h500-c)
      const base = trimmed.split('=')[0]
      const sizeParam = width ? `w${Math.round(width)}` : 'w1000'
      const rwParam = format === 'auto' || format === 'webp' ? '-rw' : ''
      return `${base}=${sizeParam}${rwParam}`
    } catch {
      return trimmed
    }
  }

  // 3. Amazon Media (m.media-amazon.com)
  if (trimmed.includes('media-amazon.com')) {
    try {
      if (width && trimmed.includes('._SX')) {
        return trimmed.replace(/\._SX\d+_/, `._SX${Math.round(width)}_`)
      }
      return trimmed
    } catch {
      return trimmed
    }
  }

  // 4. Local Static Assets (/images/... or images/...)
  if (trimmed.startsWith('/images/') || trimmed.startsWith('images/')) {
    // If requesting modern webp format and file is png/jpg, prefer .webp
    if (format === 'auto' || format === 'webp') {
      if (trimmed.endsWith('.png') || trimmed.endsWith('.jpg') || trimmed.endsWith('.jpeg')) {
        const withoutExt = trimmed.replace(/\.(png|jpe?g)$/i, '')
        // We know we generated .webp for all local public/images
        return `${withoutExt}.webp`
      }
    }
    return trimmed
  }

  return trimmed
}

/**
 * Generates an HTML srcset string for responsive image loading.
 *
 * @param {string} url - Source image URL
 * @param {number[]} [widths=[320, 640, 960, 1200, 1600]] - Array of target widths
 * @param {Object} [options={}] - Additional options for optimizeImageUrl
 * @returns {string} - srcset attribute string
 */
export function getImageSrcSet(url, widths = [320, 640, 960, 1200, 1600], options = {}) {
  if (!url || typeof url !== 'string') return ''
  return widths
    .map((w) => `${optimizeImageUrl(url, { ...options, width: w })} ${w}w`)
    .join(', ')
}

/**
 * Optimizes an image for thumbnail/avatar display (cart, navbar, mini cards).
 *
 * @param {string} url - Source image URL
 * @param {number} [size=160] - Thumbnail size in pixels
 * @returns {string}
 */
export function getOptimizedThumbnail(url, size = 160) {
  return optimizeImageUrl(url, { width: size, height: size, quality: 80, fit: 'crop' })
}

export default {
  optimizeImageUrl,
  getImageSrcSet,
  getOptimizedThumbnail,
}
