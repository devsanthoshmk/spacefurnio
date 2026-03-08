/**
 * ============================================
 * SHOP API SERVICE — PRODUCTION (NeonDB)
 * ============================================
 *
 * Connects directly to NeonDB (PostgreSQL) using the
 * @neondatabase/serverless HTTP driver.
 *
 * Database: icy-union-81751721 (products)
 * Tables:   products, brands, categories, spaces, styles,
 *           rooms, materials, colors, product_colors, product_images
 */

import { neon } from '@neondatabase/serverless'

// ============================================
// DATABASE CONNECTION
// ============================================

const DATABASE_URL =
  import.meta.env.VITE_PRODUCTS_DB_URL ||
  'postgresql://neondb_owner:npg_tnCUizvkR76D@ep-flat-brook-a1h1dgii-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

function sanitizeGuestJwt(token) {
  if (typeof token !== 'string') return null
  const trimmed = token.trim()
  if (!trimmed) return null

  // Accept env values written as "token" or 'token'
  const unquoted = trimmed.replace(/^['"]|['"]$/g, '')
  if (!unquoted || unquoted === 'your_guest_jwt_token_here') return null
  return unquoted
}

function isAuthTokenError(error) {
  const message = String(error?.message || error || '').toLowerCase()
  return (
    message.includes('jwk not found') ||
    message.includes('invalid jwt') ||
    message.includes('jwt') ||
    message.includes('invalid token') ||
    message.includes('token is expired') ||
    message.includes('invalid authorization')
  )
}

const GUEST_JWT = sanitizeGuestJwt(import.meta.env.VITE_GUEST_JWT)
const sqlPublic = neon(DATABASE_URL)
const sqlWithGuest = GUEST_JWT ? neon(DATABASE_URL, { authToken: GUEST_JWT }) : null

let shouldUseGuestAuth = Boolean(sqlWithGuest)
let authFallbackLogged = false

async function runWithAuthFallback(executor) {
  const useGuestForThisCall = Boolean(shouldUseGuestAuth && sqlWithGuest)
  const client = useGuestForThisCall ? sqlWithGuest : sqlPublic

  try {
    return await executor(client)
  } catch (error) {
    if (useGuestForThisCall && isAuthTokenError(error)) {
      shouldUseGuestAuth = false

      if (!authFallbackLogged) {
        console.warn(
          'Guest JWT authentication failed. Retrying with public Neon connection:',
          error?.message || error,
        )
        authFallbackLogged = true
      }

      return executor(sqlPublic)
    }

    throw error
  }
}

// Query wrapper with one-time auth fallback.
const sql = Object.assign(
  async function sqlTag(strings, ...values) {
    return runWithAuthFallback((client) => client(strings, ...values))
  },
  {
    query(text, params = []) {
      return runWithAuthFallback((client) => client.query(text, params))
    },
  },
)

// ============================================
// COLOR HEX MAP  (DB has null hex_code values)
// ============================================

const COLOR_HEX_MAP = {
  Natural: '#E5D3B3',
  'Dark Brown': '#4A3728',
  'Navy Blue': '#1F3A5F',
  'Emerald Green': '#2E8B57',
  'Blush Pink': '#F4C2C2',
  Black: '#1A1A1A',
  'Rustic Brown': '#8B6914',
  'Multi-Color': '#FF6B6B',
  'Black & White': '#808080',
  Green: '#4CAF50',
  Sepia: '#704214',
  'Vintage Brown': '#6B4226',
  White: '#F5F5F5',
  Terracotta: '#C2785C',
  'Sage Green': '#9CAF88',
  Cream: '#FFFDD0',
  Mustard: '#D4A84B',
  'Rust Orange': '#B7472A',
  Brass: '#B5A642',
  Copper: '#B87333',
  Gold: '#D4A84B',
  Clear: '#E8E8E8',
  Amber: '#FFBF00',
  'Dark Walnut': '#5D4037',
  'Natural Oak': '#C19A6B',
  Chrome: '#C0C0C0',
  Oak: '#C19A6B',
  Mahogany: '#C04000',
  'White Oak': '#D5C7A9',
  Gray: '#808080',
  Espresso: '#3C1414',
  Charcoal: '#36454F',
  Beige: '#F5F0E6',
  Navy: '#1F3A5F',
  'White Light': '#FAFAFA',
  'Warm Light': '#FFF4E0',
  Bronze: '#CD7F32',
  Emerald: '#50C878',
  Blush: '#DE5D83',
  'Black Steel': '#2C2C2C',
  'Raw Steel': '#71797E',
  'White Stain': '#F0EDE8',
  'Natural Reclaimed': '#A0845C',
  'Weathered Gray': '#8C8C8C',
  'Natural Bamboo': '#E3D4A0',
  Metallic: '#AAA9AD',
  'Earth Tone': '#9B7653',
  'Matte Black': '#28282B',
  'Natural Weathered': '#A69279',
  'Rich Mahogany': '#6E210A',
  Cherry: '#DE3163',
  'Red & Gold': '#C41E3A',
  'Blue & Cream': '#6495ED',
  Burgundy: '#800020',
  'Forest Green': '#228B22',
  'Antique Gold': '#C5A258',
  'Natural Ash': '#C4B8A9',
  Tan: '#D2B48C',
  'Blue & White': '#6495ED',
  'Black & Gold': '#2C2C2C',
  Nickel: '#727472',
}

function getColorHex(name) {
  return COLOR_HEX_MAP[name] || '#CCCCCC'
}

// ============================================
// CATEGORY ICONS (SVG)
// ============================================

const CATEGORY_ICONS = {
  furniture: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 8h-3V6c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1v4h2v-4h10v4h2v-4h1c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zM9 6h6v2H9V6zm11 8H4v-4h16v4z"/></svg>`,
  'wall-art': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15l4-4c.6-.6 1.5-.6 2.1 0L12 14l3-3c.6-.6 1.5-.6 2.1 0L21 15"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>`,
  decor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V21h8v-6.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"/><path d="M9 21h6"/></svg>`,
  lights: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2v1"/><path d="M12 22v-4"/><circle cx="12" cy="12" r="5"/><path d="M12 7v5l3 3"/></svg>`,
}

// ============================================
// SPACE ICON MAP
// ============================================

const SPACE_ICON_MAP = {
  foyer: 'sofa',
  dining: 'utensils',
  kitchen: 'kitchen',
  'home-office': 'desk',
  bedroom: 'bed',
  bathroom: 'bath',
  balcony: 'tree',
  lounge: 'sofa',
  poolside: 'tree',
}

// ============================================
// STYLE IMAGE MAP
// ============================================

const STYLE_IMAGE_MAP = {
  brutalist: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=600&fit=crop',
  minimalist: 'https://images.unsplash.com/photo-1598928506311-c55efa66a84d?w=600&h=600&fit=crop',
  sustainable: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=600&fit=crop',
  parametric: 'https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?w=600&h=600&fit=crop',
  'wabi-sabi': 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=600&fit=crop',
  traditional: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&h=600&fit=crop',
  'vintage-retro': 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&h=600&fit=crop',
  victorian: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&h=600&fit=crop',
  japandi: 'https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?w=600&h=600&fit=crop',
  moroccan: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=600&fit=crop',
}

// ============================================
// IN-MEMORY CACHE
// ============================================

const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCached(key) {
  if (cache.has(key)) {
    const entry = cache.get(key)
    if (Date.now() - entry.ts < CACHE_TTL) return entry.data
    cache.delete(key)
  }
  return null
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() })
}

// ============================================
// PRODUCT TRANSFORMER
// ============================================

/**
 * Transform a raw DB row into the shape the frontend expects.
 */
function transformProduct(row) {
  const priceDollars = row.price_cents / 100

  // Build color data from joined arrays
  let colorData = []
  let colorNames = []

  if (row.colors && Array.isArray(row.colors)) {
    colorData = row.colors.map((c) => ({
      name: c.name,
      hex: c.hex || getColorHex(c.name),
    }))
    colorNames = row.colors.map((c) => c.name)
  }

  // Build images array
  let images = []
  if (row.images && Array.isArray(row.images)) {
    images = row.images
  } else if (row.thumbnail) {
    images = [row.thumbnail]
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: priceDollars,
    originalPrice: null,
    discount: 0,
    brand: row.brand_name || '',
    category: row.category_slug || '',
    categoryName: row.category_name || '',
    space: row.space_slug || '',
    spaceName: row.space_name || '',
    style: row.style_slug || '',
    styleName: row.style_name || '',
    material: row.material_name || '',
    room: row.room_name || '',
    listingType: row.listing_type,
    colors: colorNames,
    colorData,
    rating: row.rating ? parseFloat(row.rating) : 0,
    reviews: row.review_count || 0,
    popularity: row.popularity || 50,
    inStock: true, // DB doesn't have stock fields yet
    stockCount: 10,
    isNew: false,
    isBestSeller: (row.popularity || 0) >= 90,
    isFeatured: (row.popularity || 0) >= 85,
    images,
    thumbnail: row.thumbnail || (images.length > 0 ? images[0] : ''),
    description:
      row.description ||
      `Elevate your space with this beautifully crafted ${(row.name || '').toLowerCase()}. Made with premium ${(row.material_name || 'materials').toLowerCase()}, this piece combines timeless design with exceptional quality.`,
    features: [
      `Premium ${row.material_name || 'crafted'} construction`,
      'Handcrafted with attention to detail',
      'Sustainably sourced materials',
      'Easy assembly required',
    ],
    href: row.href || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ============================================
// BASE PRODUCT QUERY (shared CTE)
// ============================================

const PRODUCT_BASE_QUERY = `
  SELECT
    p.id, p.name, p.slug, p.price_cents, p.listing_type,
    p.rating, p.review_count, p.popularity, p.description, p.href,
    p.created_at, p.updated_at,
    b.name  AS brand_name,
    c.name  AS category_name, c.slug AS category_slug,
    s.name  AS space_name,    s.slug AS space_slug,
    st.name AS style_name,    st.slug AS style_slug,
    m.name  AS material_name,
    r.name  AS room_name,
    (SELECT pi.src FROM product_images pi
       WHERE pi.product_id = p.id AND pi.is_primary = true
       LIMIT 1)                          AS thumbnail,
    (SELECT json_agg(pi2.src ORDER BY pi2.sort_order)
       FROM product_images pi2
       WHERE pi2.product_id = p.id)      AS images,
    (SELECT json_agg(json_build_object('name', cl.name, 'hex', cl.hex_code))
       FROM product_colors pc
       JOIN colors cl ON cl.id = pc.color_id
       WHERE pc.product_id = p.id)       AS colors
  FROM products p
  LEFT JOIN brands     b  ON b.id  = p.brand_id
  LEFT JOIN categories c  ON c.id  = p.category_id
  LEFT JOIN spaces     s  ON s.id  = p.space_id
  LEFT JOIN styles     st ON st.id = p.style_id
  LEFT JOIN materials  m  ON m.id  = p.material_id
  LEFT JOIN rooms      r  ON r.id  = p.room_id
`

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get all categories
 */
export async function getCategories() {
  const cacheKey = 'categories'
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const rows = await sql`SELECT id, name, slug FROM categories ORDER BY id`

    // Get product counts per category
    const counts = await sql`
      SELECT category_id, COUNT(*)::int AS cnt
      FROM products
      WHERE category_id IS NOT NULL
      GROUP BY category_id`

    const countMap = {}
    counts.forEach((r) => {
      countMap[r.category_id] = r.cnt
    })

    const data = rows.map((cat) => ({
      id: cat.slug,
      name: cat.name,
      slug: cat.slug,
      description: `Browse our ${cat.name.toLowerCase()} collection.`,
      icon: CATEGORY_ICONS[cat.slug] || CATEGORY_ICONS.furniture,
      productCount: countMap[cat.id] || 0,
    }))

    const result = { success: true, data, meta: { total: data.length } }
    setCache(cacheKey, result)
    return result
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { success: false, data: [], meta: { total: 0 } }
  }
}

/**
 * Get all spaces (rooms)
 */
export async function getSpaces() {
  const cacheKey = 'spaces'
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const rows = await sql`SELECT id, name, slug FROM spaces ORDER BY id`

    const data = rows.map((sp) => ({
      id: sp.slug,
      name: sp.name,
      slug: sp.slug,
      icon: SPACE_ICON_MAP[sp.slug] || 'sofa',
    }))

    const result = { success: true, data, meta: { total: data.length } }
    setCache(cacheKey, result)
    return result
  } catch (error) {
    console.error('Error fetching spaces:', error)
    return { success: false, data: [], meta: { total: 0 } }
  }
}

/**
 * Get all design styles
 */
export async function getStyles() {
  const cacheKey = 'styles'
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const rows = await sql`SELECT id, name, slug FROM styles ORDER BY id`

    const data = rows.map((st) => ({
      id: st.slug,
      name: st.name,
      slug: st.slug,
      image:
        STYLE_IMAGE_MAP[st.slug] ||
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=600&fit=crop',
      description: `Explore our ${st.name} collection.`,
    }))

    const result = { success: true, data, meta: { total: data.length } }
    setCache(cacheKey, result)
    return result
  } catch (error) {
    console.error('Error fetching styles:', error)
    return { success: false, data: [], meta: { total: 0 } }
  }
}

/**
 * Get products with filtering, sorting, and pagination.
 *
 * Supports filtering by categories, spaces, styles (arrays), brand, colors,
 * material, price range, search, and sorting/pagination.
 */
export async function getProducts(options = {}) {
  const {
    categories,
    spaces,
    styles,
    brand,
    colors = [],
    material,
    minPrice,
    maxPrice,
    search,
    sort = 'popularity',
    order = 'desc',
    page = 1,
    limit = 12,
    listingType,
  } = options

  try {
    // --- Build WHERE clauses ---
    const conditions = []
    const params = []
    let idx = 1

// Categories - can be array or single value
// Include products with NULL category_id (uncategorized products)
if (categories && Array.isArray(categories) && categories.length > 0) {
  conditions.push(`(c.slug = ANY($${idx++}) OR p.category_id IS NULL)`)
  params.push(categories)
} else if (categories && typeof categories === 'string') {
  conditions.push(`(c.slug = $${idx++} OR p.category_id IS NULL)`)
  params.push(categories)
}

// Spaces - can be array or single value
// Include products with NULL space_id (can be used in any space)
if (spaces && Array.isArray(spaces) && spaces.length > 0) {
  conditions.push(`(s.slug = ANY($${idx++}) OR p.space_id IS NULL)`)
  params.push(spaces)
} else if (spaces && typeof spaces === 'string') {
  conditions.push(`(s.slug = $${idx++} OR p.space_id IS NULL)`)
  params.push(spaces)
}

// Styles - can be array or single value
// Include products with NULL style_id (no specific style)
if (styles && Array.isArray(styles) && styles.length > 0) {
  conditions.push(`(st.slug = ANY($${idx++}) OR p.style_id IS NULL)`)
  params.push(styles)
} else if (styles && typeof styles === 'string') {
  conditions.push(`(st.slug = $${idx++} OR p.style_id IS NULL)`)
  params.push(styles)
}

    if (listingType) {
      conditions.push(`p.listing_type = $${idx++}`)
      params.push(listingType)
    }

    if (brand) {
      conditions.push(`b.name = $${idx++}`)
      params.push(brand)
    }

    if (material) {
      conditions.push(`m.name = $${idx++}`)
      params.push(material)
    }

    if (minPrice !== undefined && minPrice !== null) {
      conditions.push(`p.price_cents >= $${idx++}`)
      params.push(Math.round(minPrice * 100))
    }

    if (maxPrice !== undefined && maxPrice !== null) {
      conditions.push(`p.price_cents <= $${idx++}`)
      params.push(Math.round(maxPrice * 100))
    }

    if (search) {
      conditions.push(`p.name ILIKE $${idx++}`)
      params.push(`%${search}%`)
    }

    if (colors.length > 0) {
      conditions.push(`EXISTS (
        SELECT 1 FROM product_colors pc2
        JOIN colors cl2 ON cl2.id = pc2.color_id
        WHERE pc2.product_id = p.id AND cl2.name = ANY($${idx++})
      )`)
      params.push(colors)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    // --- Sort ---
    const SORT_MAP = {
      price: 'p.price_cents',
      rating: 'p.rating',
      newest: 'p.created_at',
      popularity: 'p.popularity',
    }
    const sortCol = SORT_MAP[sort] || 'p.popularity'
    const sortDir = order === 'asc' ? 'ASC' : 'DESC'

    // --- Pagination ---
    const safeLimit = Math.min(Math.max(limit, 1), 50)
    const offset = (Math.max(page, 1) - 1) * safeLimit

    // --- Count query ---
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM products p
      LEFT JOIN brands     b  ON b.id  = p.brand_id
      LEFT JOIN categories c  ON c.id  = p.category_id
      LEFT JOIN spaces     s  ON s.id  = p.space_id
      LEFT JOIN styles     st ON st.id = p.style_id
      LEFT JOIN materials  m  ON m.id  = p.material_id
      LEFT JOIN rooms      r  ON r.id  = p.room_id
      ${whereClause}
    `

    // --- Products query ---
    const productsQuery = `
      ${PRODUCT_BASE_QUERY}
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir} NULLS LAST
      LIMIT ${safeLimit} OFFSET ${offset}
`

// --- Aggregations query (for filters) ---
// No scoping needed - show all filter options
const aggQuery = `
SELECT
  (SELECT json_agg(DISTINCT b2.name ORDER BY b2.name)
  FROM products p2 JOIN brands b2 ON b2.id = p2.brand_id
  ) AS brands,
  (SELECT json_agg(DISTINCT m2.name ORDER BY m2.name)
  FROM products p2 JOIN materials m2 ON m2.id = p2.material_id
  ) AS materials,
  (SELECT json_agg(json_build_object('name', cl.name, 'hex', cl.hex_code))
  FROM (SELECT DISTINCT cl.name, cl.hex_code
  FROM product_colors pc JOIN colors cl ON cl.id = pc.color_id
  JOIN products p2 ON p2.id = pc.product_id
  ORDER BY cl.name) cl
  ) AS colors,
  (SELECT json_build_object(
    'min', COALESCE(MIN(p2.price_cents) / 100, 0),
    'max', COALESCE(MAX(p2.price_cents) / 100, 5000))
  FROM products p2
  ) AS price_range
`

// Execute in parallel
const [countResult, productRows, aggResult] = await Promise.all([
  sql.query(countQuery, params),
  sql.query(productsQuery, params),
  sql.query(aggQuery),
])

    const total = countResult[0]?.total || 0
    const totalPages = Math.ceil(total / safeLimit)

    const products = productRows.map(transformProduct)

    // Build aggregations
    const agg = aggResult[0] || {}
    const aggregations = {
      brands: agg.brands || [],
      materials: agg.materials || [],
      colors: (agg.colors || []).map((c) => ({
        name: c.name,
        hex: c.hex || getColorHex(c.name),
      })),
      priceRange: agg.price_range || { min: 0, max: 5000 },
    }

    return {
      success: true,
      data: products,
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      aggregations,
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    return {
      success: true,
      data: [],
      meta: { total: 0, page: 1, limit: 12, totalPages: 0, hasNextPage: false, hasPrevPage: false },
      aggregations: { brands: [], materials: [], colors: [], priceRange: { min: 0, max: 5000 } },
    }
  }
}

/**
 * Get a single product by ID (integer) or slug
 */
export async function getProduct(idOrSlug) {
  try {
    const isNumericId = /^\d+$/.test(String(idOrSlug))

    const where = isNumericId ? 'WHERE p.id = $1' : 'WHERE p.slug = $1'
    const param = isNumericId ? parseInt(idOrSlug, 10) : idOrSlug

    const rows = await sql.query(`${PRODUCT_BASE_QUERY} ${where} LIMIT 1`, [param])

    if (rows.length === 0) {
      return { success: false, error: 'Product not found' }
    }

    const product = transformProduct(rows[0])

    // Get related products (same listing type + category/space/style)
    let relatedWhere = 'WHERE p.id != $1'
    const relatedParams = [rows[0].id]

    if (rows[0].category_slug) {
      relatedWhere += ' AND c.slug = $2'
      relatedParams.push(rows[0].category_slug)
    } else if (rows[0].space_slug) {
      relatedWhere += ' AND s.slug = $2'
      relatedParams.push(rows[0].space_slug)
    } else if (rows[0].style_slug) {
      relatedWhere += ' AND st.slug = $2'
      relatedParams.push(rows[0].style_slug)
    }

    const relatedRows = await sql.query(
      `${PRODUCT_BASE_QUERY} ${relatedWhere} ORDER BY p.popularity DESC LIMIT 4`,
      relatedParams,
    )

    const relatedProducts = relatedRows.map(transformProduct)

    return {
      success: true,
      data: { ...product, relatedProducts },
    }
  } catch (error) {
    console.error('Error fetching product:', error)
    return { success: false, error: 'Failed to fetch product' }
  }
}

/**
 * Get featured products (popular items for the shop home page)
 */
export async function getFeaturedProducts() {
  const cacheKey = 'featured'
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const rows = await sql.query(`
      ${PRODUCT_BASE_QUERY}
      ORDER BY p.popularity DESC
      LIMIT 12
    `)

    const products = rows.map(transformProduct)

    const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 6)
    const featured = products.slice(0, 6)

    const result = {
      success: true,
      data: {
        featured,
        newArrivals: products.slice(0, 6),
        bestSellers,
        onSale: [],
      },
    }
    setCache(cacheKey, result)
    return result
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return {
      success: true,
      data: { featured: [], newArrivals: [], bestSellers: [], onSale: [] },
    }
  }
}

/**
 * Get available filter options for a category
 */
export async function getFilterOptions(category = null) {
  try {
    const catFilter = category ? `JOIN categories c ON c.id = p.category_id WHERE c.slug = $1` : ''
    const params = category ? [category] : []

    const [brandsRes, materialsRes, colorsRes, priceRes] = await Promise.all([
      sql.query(
        `SELECT DISTINCT b.name FROM products p JOIN brands b ON b.id = p.brand_id ${catFilter} ORDER BY b.name`,
        params,
      ),
      sql.query(
        `SELECT DISTINCT m.name FROM products p JOIN materials m ON m.id = p.material_id ${catFilter} ORDER BY m.name`,
        params,
      ),
      sql.query(
        `SELECT DISTINCT cl.name, cl.hex_code FROM product_colors pc JOIN colors cl ON cl.id = pc.color_id JOIN products p ON p.id = pc.product_id ${catFilter} ORDER BY cl.name`,
        params,
      ),
      sql.query(
        `SELECT COALESCE(MIN(p.price_cents)/100, 0) AS min, COALESCE(MAX(p.price_cents)/100, 5000) AS max FROM products p ${catFilter}`,
        params,
      ),
    ])

    return {
      success: true,
      data: {
        brands: brandsRes.map((r) => r.name),
        materials: materialsRes.map((r) => r.name),
        colors: colorsRes.map((r) => ({
          name: r.name,
          hex: r.hex_code || getColorHex(r.name),
        })),
        priceRange: {
          min: priceRes[0]?.min || 0,
          max: priceRes[0]?.max || 5000,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching filter options:', error)
    return {
      success: true,
      data: { brands: [], materials: [], colors: [], priceRange: { min: 0, max: 5000 } },
    }
  }
}

/**
 * Search products by name
 */
export async function searchProducts(query, limit = 10) {
  try {
    const rows = await sql.query(
      `${PRODUCT_BASE_QUERY} WHERE p.name ILIKE $1 ORDER BY p.popularity DESC LIMIT $2`,
      [`%${query}%`, limit],
    )

    return {
      success: true,
      data: rows.map(transformProduct),
      meta: { query, total: rows.length },
    }
  } catch (error) {
    console.error('Error searching products:', error)
    return { success: true, data: [], meta: { query, total: 0 } }
  }
}

/**
 * Get special offer banners
 */
export async function getSpecialOffers() {
  return {
    success: true,
    data: [
      {
        id: 'new-arrivals',
        title: 'New',
        subtitle: 'Latest collection of minimalist home essentials',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        link: '/shop/category?filter=new',
        badge: 'New Arrivals',
      },
      {
        id: 'best-sellers',
        title: 'Best',
        subtitle: 'Our most loved pieces by customers',
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop',
        link: '/shop/category?filter=bestseller',
        badge: 'Trending',
      },
    ],
  }
}

// ============================================
// PRODUCT ENRICHMENT UTILITIES
// ============================================

/**
 * Enrich items with product details from catalog DB.
 * Used when items only have productId but need full product data (name, image, price).
 *
 * @param {Array} items - Array of items with productId property
 * @param {Function} transformFn - Optional function to transform product data to item format
 * @returns {Promise<Array>} - Items enriched with product data
 */
export async function enrichItemsWithProducts(items, transformFn = null) {
  if (!items || items.length === 0) return []

  const productIds = items.map((item) => item.productId).filter(Boolean)
  if (productIds.length === 0) return items

  const results = await Promise.all(productIds.map((id) => getProduct(id)))

  return items.map((item, index) => {
    const productResult = results[index]
    if (productResult.success && productResult.data) {
      const product = productResult.data
      if (transformFn) {
        return transformFn(item, product)
      }
      return {
        ...item,
        name: product.name,
        image: product.thumbnail || product.images?.[0] || null,
        primaryImage: product.thumbnail,
        slug: product.slug,
        originalPrice: product.originalPrice,
        discount: product.discount,
        price: product.price,
        colors: product.colors,
        inStock: product.inStock,
      }
    }
    return {
      ...item,
      name: item.name || 'Product',
      image: null,
      primaryImage: null,
      slug: null,
    }
  })
}

/**
 * Enrich order items with product details.
 * Order items have product_id (not productId), and use product_name in response.
 */
export async function enrichOrderItems(orderItems) {
  if (!orderItems || orderItems.length === 0) return []

  return enrichItemsWithProducts(
    orderItems.map((item) => ({ productId: item.product_id, ...item })),
    (item, product) => ({
      ...item,
      product_name: product.name,
      product_image: product.thumbnail || product.images?.[0] || null,
      product_slug: product.slug,
    }),
  )
}

// ============================================
// EXPORT ALL
// ============================================

export default {
  getCategories,
  getSpaces,
  getStyles,
  getProducts,
  getProduct,
  getFeaturedProducts,
  enrichItemsWithProducts,
  enrichOrderItems,
  getFilterOptions,
  searchProducts,
  getSpecialOffers,
}
