/**
 * ============================================
 * SHOP API SERVICE
 * ============================================
 * 
 * This module provides a mock backend for the shop functionality.
 * It simulates API responses with realistic data and delays.
 * 
 * MIGRATION TO REAL DATABASE:
 * ---------------------------
 * This is designed to be easily replaced with real API calls.
 * Each function follows a standard async pattern that can be
 * replaced with fetch/axios calls to your NeonDB + Cloudflare Workers backend.
 * 
 * See the SHOP_API_DOCUMENTATION.md file for migration instructions.
 */

// ============================================
// CONFIGURATION
// ============================================

const API_CONFIG = {
    // Simulate network delay (remove in production)
    MOCK_DELAY_MS: 300,

    // Pagination defaults
    DEFAULT_PAGE_SIZE: 12,
    MAX_PAGE_SIZE: 50,

    // Future API base URL (for NeonDB + Cloudflare Workers)
    // BASE_URL: 'https://your-worker.your-subdomain.workers.dev/api',
}

// ============================================
// MOCK DATA
// ============================================

// Furniture Product Images (using Unsplash)
const PRODUCT_IMAGES = {
    furniture: [
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&h=600&fit=crop',
    ],
    wallArt: [
        'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=600&fit=crop',
    ],
    decor: [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1602872030219-ad2b9a54315c?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop',
    ],
    lights: [
        'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=600&h=600&fit=crop',
    ],
}

// Room/Space Images
const SPACE_IMAGES = {
    living: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop',
    bedroom: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=600&fit=crop',
    kitchen: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=600&fit=crop',
    office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=600&fit=crop',
}

// Style Images
const STYLE_IMAGES = {
    minimalist: 'https://images.unsplash.com/photo-1598928506311-c55ez463084s?w=600&h=600&fit=crop',
    japandi: 'https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?w=600&h=600&fit=crop',
    brutalist: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=600&fit=crop',
    wabisabi: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=600&fit=crop',
}

// Brand names for products
const BRANDS = [
    'Nordic Home', 'Urban Studio', 'Comfort Living', 'Modern Craft',
    'Artisan Works', 'Nature\'s Touch', 'Pure Design', 'Heritage Co.',
    'Minimal Living', 'Scandic Home', 'Terra Studio', 'Warm Woods'
]

// Material types
const MATERIALS = [
    'Oak Wood', 'Walnut', 'Teak', 'Bamboo', 'Steel', 'Brass',
    'Ceramic', 'Glass', 'Velvet', 'Linen', 'Cotton', 'Leather',
    'Marble', 'Concrete', 'Rattan', 'Wicker'
]

// Color options
const COLORS = [
    { name: 'Natural', hex: '#E5D3B3' },
    { name: 'White', hex: '#F8F6F3' },
    { name: 'Cream', hex: '#F5F0E6' },
    { name: 'Beige', hex: '#D4C8B8' },
    { name: 'Warm Grey', hex: '#A8A095' },
    { name: 'Charcoal', hex: '#4A4641' },
    { name: 'Black', hex: '#1A1816' },
    { name: 'Terracotta', hex: '#C2785C' },
    { name: 'Sage', hex: '#9CAF88' },
    { name: 'Dusty Rose', hex: '#C9A9A2' },
    { name: 'Navy', hex: '#2C3E50' },
    { name: 'Olive', hex: '#6B7B4F' },
    { name: 'Rust', hex: '#B7472A' },
    { name: 'Mustard', hex: '#D4A84B' },
]

// ============================================
// CATEGORY DATA
// ============================================

const CATEGORIES = [
    {
        id: 'furniture',
        name: 'Furniture',
        slug: 'furniture',
        description: 'Discover our curated collection of modern and timeless furniture pieces.',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 8h-3V6c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1v4h2v-4h10v4h2v-4h1c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zM9 6h6v2H9V6zm11 8H4v-4h16v4z"/></svg>`,
        productCount: 156,
    },
    {
        id: 'wall-art',
        name: 'Wall Art',
        slug: 'wall-art',
        description: 'Transform your walls with our stunning selection of artwork and prints.',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15l4-4c.6-.6 1.5-.6 2.1 0L12 14l3-3c.6-.6 1.5-.6 2.1 0L21 15"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>`,
        productCount: 89,
    },
    {
        id: 'decor',
        name: 'Decor',
        slug: 'decor',
        description: 'Add personality to your space with our unique decorative accessories.',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V21h8v-6.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"/><path d="M9 21h6"/></svg>`,
        productCount: 234,
    },
    {
        id: 'lights',
        name: 'Lights',
        slug: 'lights',
        description: 'Illuminate your home with our designer lighting solutions.',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2v1"/><path d="M12 22v-4"/><circle cx="12" cy="12" r="5"/><path d="M12 7v5l3 3"/></svg>`,
        productCount: 78,
    },
]

// ============================================
// SPACE DATA
// ============================================

const SPACES = [
    { id: 'living', name: 'Living', slug: 'living', icon: 'sofa' },
    { id: 'bedroom', name: 'Bedroom', slug: 'bedroom', icon: 'bed' },
    { id: 'dining', name: 'Dining', slug: 'dining', icon: 'utensils' },
    { id: 'kitchen', name: 'Kitchen', slug: 'kitchen', icon: 'kitchen' },
    { id: 'office', name: 'Office', slug: 'office', icon: 'desk' },
    { id: 'bathroom', name: 'Bathroom', slug: 'bathroom', icon: 'bath' },
    { id: 'outdoor', name: 'Outdoor', slug: 'outdoor', icon: 'tree' },
    { id: 'kids', name: 'Kids Room', slug: 'kids', icon: 'blocks' },
]

// ============================================
// STYLE DATA
// ============================================

const STYLES = [
    {
        id: 'minimalist',
        name: 'Minimalist',
        slug: 'minimalist',
        image: STYLE_IMAGES.minimalist,
        description: 'Clean lines, neutral palettes, and purposeful simplicity.'
    },
    {
        id: 'japandi',
        name: 'Japandi',
        slug: 'japandi',
        image: STYLE_IMAGES.japandi,
        description: 'Japanese minimalism meets Scandinavian warmth.'
    },
    {
        id: 'brutalist',
        name: 'Brutalist',
        slug: 'brutalist',
        image: STYLE_IMAGES.brutalist,
        description: 'Bold concrete forms and raw structural beauty.'
    },
    {
        id: 'wabi-sabi',
        name: 'Wabi-Sabi',
        slug: 'wabi-sabi',
        image: STYLE_IMAGES.wabisabi,
        description: 'Embracing imperfection and the beauty of natural aging.'
    },
    {
        id: 'scandinavian',
        name: 'Scandinavian',
        slug: 'scandinavian',
        image: 'https://images.unsplash.com/photo-1598928506311-c55efa66a84d?w=600&h=600&fit=crop',
        description: 'Functional beauty with cozy hygge vibes.'
    },
    {
        id: 'mid-century',
        name: 'Mid-Century',
        slug: 'mid-century',
        image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&h=600&fit=crop',
        description: 'Retro elegance with organic curves and bold colors.'
    },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Simulate network delay
 */
const delay = (ms = API_CONFIG.MOCK_DELAY_MS) =>
    new Promise(resolve => setTimeout(resolve, ms))

/**
 * Generate a unique ID
 */
const generateId = () =>
    `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

/**
 * Get random items from array
 */
const getRandomItems = (arr, count) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
}

/**
 * Get random number in range
 */
const randomInRange = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min

/**
 * Generate mock product
 */
const generateProduct = (category, index) => {
    const categoryImages = PRODUCT_IMAGES[category.replace('-', '')] || PRODUCT_IMAGES.furniture
    const baseImage = categoryImages[index % categoryImages.length]
    const productColors = getRandomItems(COLORS, randomInRange(2, 5))
    const brand = BRANDS[randomInRange(0, BRANDS.length - 1)]
    const material = MATERIALS[randomInRange(0, MATERIALS.length - 1)]
    const price = randomInRange(49, 2999)
    const hasDiscount = Math.random() > 0.7
    const discountPercent = hasDiscount ? randomInRange(10, 30) : 0
    const originalPrice = hasDiscount ? Math.round(price / (1 - discountPercent / 100)) : null

    const productNames = {
        furniture: ['Modern Sofa', 'Accent Chair', 'Coffee Table', 'Dining Set', 'Bookshelf', 'Console Table', 'Ottoman', 'Side Table', 'Lounge Chair', 'Bar Stool'],
        'wall-art': ['Canvas Print', 'Framed Poster', 'Gallery Set', 'Metal Wall Art', 'Tapestry', 'Mirror Art', 'Sculpture', 'Photo Frame Set'],
        decor: ['Ceramic Vase', 'Throw Pillow Set', 'Candle Holder', 'Decorative Bowl', 'Plant Stand', 'Tray Set', 'Bookends', 'Clock', 'Sculpture'],
        lights: ['Pendant Light', 'Floor Lamp', 'Table Lamp', 'Chandelier', 'Wall Sconce', 'Desk Lamp', 'String Lights', 'Spotlight'],
    }

    const names = productNames[category] || productNames.furniture
    const name = `${brand} ${names[index % names.length]}`

    const daysAgo = randomInRange(0, 180)
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()

    return {
        id: generateId(),
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        price,
        originalPrice,
        discount: discountPercent,
        brand,
        category,
        material,
        colors: productColors.map(c => c.name),
        colorData: productColors,
        rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
        reviews: randomInRange(5, 500),
        popularity: randomInRange(50, 100),
        inStock: Math.random() > 0.1,
        stockCount: randomInRange(0, 50),
        isNew: daysAgo < 30,
        isBestSeller: Math.random() > 0.85,
        isFeatured: Math.random() > 0.9,
        images: [baseImage, baseImage, baseImage],
        thumbnail: baseImage,
        description: `Elevate your space with this beautifully crafted ${name.toLowerCase()}. Made with premium ${material.toLowerCase()}, this piece combines timeless design with exceptional quality.`,
        features: [
            `Premium ${material} construction`,
            'Handcrafted with attention to detail',
            'Sustainably sourced materials',
            'Easy assembly required',
        ],
        dimensions: {
            width: randomInRange(30, 200),
            height: randomInRange(30, 150),
            depth: randomInRange(20, 100),
            unit: 'cm',
        },
        weight: randomInRange(2, 50),
        createdAt,
        updatedAt: createdAt,
    }
}

/**
 * Generate products for a category
 */
const generateCategoryProducts = (category, count = 24) => {
    return Array.from({ length: count }, (_, i) => generateProduct(category, i))
}

// Pre-generate products for faster responses
const MOCK_PRODUCTS = {
    furniture: generateCategoryProducts('furniture', 48),
    'wall-art': generateCategoryProducts('wall-art', 32),
    decor: generateCategoryProducts('decor', 40),
    lights: generateCategoryProducts('lights', 28),
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get all categories
 * 
 * MIGRATION: Replace with:
 * const response = await fetch(`${API_CONFIG.BASE_URL}/categories`)
 * return response.json()
 */
export async function getCategories() {
    await delay()
    return {
        success: true,
        data: CATEGORIES,
        meta: {
            total: CATEGORIES.length,
        }
    }
}

/**
 * Get all spaces (rooms)
 */
export async function getSpaces() {
    await delay()
    return {
        success: true,
        data: SPACES,
        meta: {
            total: SPACES.length,
        }
    }
}

/**
 * Get all design styles
 */
export async function getStyles() {
    await delay()
    return {
        success: true,
        data: STYLES,
        meta: {
            total: STYLES.length,
        }
    }
}

/**
 * Get products with filtering, sorting, and pagination
 * 
 * @param {Object} options
 * @param {string} options.category - Filter by category
 * @param {string} options.space - Filter by room/space
 * @param {string} options.style - Filter by design style
 * @param {string} options.brand - Filter by brand
 * @param {string[]} options.colors - Filter by colors
 * @param {string} options.material - Filter by material
 * @param {number} options.minPrice - Minimum price
 * @param {number} options.maxPrice - Maximum price
 * @param {boolean} options.inStock - Only in-stock items
 * @param {boolean} options.onSale - Only discounted items
 * @param {boolean} options.isNew - Only new arrivals
 * @param {string} options.search - Search query
 * @param {string} options.sort - Sort field (price, rating, newest, popularity)
 * @param {string} options.order - Sort order (asc, desc)
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * 
 * MIGRATION: Replace with:
 * const params = new URLSearchParams(options)
 * const response = await fetch(`${API_CONFIG.BASE_URL}/products?${params}`)
 * return response.json()
 */
export async function getProducts(options = {}) {
    await delay()

    const {
        category,
        space,
        style,
        brand,
        colors = [],
        material,
        minPrice,
        maxPrice,
        inStock,
        onSale,
        isNew,
        search,
        sort = 'popularity',
        order = 'desc',
        page = 1,
        limit = API_CONFIG.DEFAULT_PAGE_SIZE,
    } = options

    // Get all products or category-specific
    let products = category
        ? [...(MOCK_PRODUCTS[category] || [])]
        : Object.values(MOCK_PRODUCTS).flat()

    // Apply filters
    if (brand) {
        products = products.filter(p => p.brand === brand)
    }

    if (colors.length > 0) {
        products = products.filter(p =>
            colors.some(color => p.colors.includes(color))
        )
    }

    if (material) {
        products = products.filter(p => p.material === material)
    }

    if (minPrice !== undefined) {
        products = products.filter(p => p.price >= minPrice)
    }

    if (maxPrice !== undefined) {
        products = products.filter(p => p.price <= maxPrice)
    }

    if (inStock) {
        products = products.filter(p => p.inStock)
    }

    if (onSale) {
        products = products.filter(p => p.discount > 0)
    }

    if (isNew) {
        products = products.filter(p => p.isNew)
    }

    if (search) {
        const searchLower = search.toLowerCase()
        products = products.filter(p =>
            p.name.toLowerCase().includes(searchLower) ||
            p.brand.toLowerCase().includes(searchLower) ||
            p.material.toLowerCase().includes(searchLower)
        )
    }

    // Apply sorting
    const sortMultiplier = order === 'desc' ? -1 : 1
    products.sort((a, b) => {
        switch (sort) {
            case 'price':
                return (a.price - b.price) * sortMultiplier
            case 'rating':
                return (a.rating - b.rating) * sortMultiplier
            case 'newest':
                return (new Date(a.createdAt) - new Date(b.createdAt)) * sortMultiplier
            case 'popularity':
            default:
                return (a.popularity - b.popularity) * sortMultiplier
        }
    })

    // Calculate pagination
    const total = products.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProducts = products.slice(startIndex, endIndex)

    // Calculate filter aggregations
    const aggregations = {
        brands: [...new Set(products.map(p => p.brand))].sort(),
        materials: [...new Set(products.map(p => p.material))].sort(),
        colors: [...new Set(products.flatMap(p => p.colors))].sort(),
        priceRange: {
            min: Math.min(...products.map(p => p.price)),
            max: Math.max(...products.map(p => p.price)),
        },
    }

    return {
        success: true,
        data: paginatedProducts,
        meta: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
        aggregations,
    }
}

/**
 * Get a single product by ID or slug
 */
export async function getProduct(idOrSlug) {
    await delay()

    const allProducts = Object.values(MOCK_PRODUCTS).flat()
    const product = allProducts.find(p => p.id === idOrSlug || p.slug === idOrSlug)

    if (!product) {
        return {
            success: false,
            error: 'Product not found',
        }
    }

    // Get related products (same category)
    const relatedProducts = allProducts
        .filter(p => p.category === product.category && p.id !== product.id)
        .slice(0, 4)

    return {
        success: true,
        data: {
            ...product,
            relatedProducts,
        },
    }
}

/**
 * Get featured products for homepage banners
 */
export async function getFeaturedProducts() {
    await delay()

    const allProducts = Object.values(MOCK_PRODUCTS).flat()
    const featured = allProducts.filter(p => p.isFeatured).slice(0, 6)
    const newArrivals = allProducts.filter(p => p.isNew).slice(0, 6)
    const bestSellers = allProducts.filter(p => p.isBestSeller).slice(0, 6)
    const onSale = allProducts.filter(p => p.discount > 0).slice(0, 6)

    return {
        success: true,
        data: {
            featured,
            newArrivals,
            bestSellers,
            onSale,
        },
    }
}

/**
 * Get available filter options
 */
export async function getFilterOptions(category = null) {
    await delay(100)

    const products = category
        ? MOCK_PRODUCTS[category] || []
        : Object.values(MOCK_PRODUCTS).flat()

    return {
        success: true,
        data: {
            brands: [...new Set(products.map(p => p.brand))].sort(),
            materials: [...new Set(products.map(p => p.material))].sort(),
            colors: COLORS,
            priceRange: {
                min: Math.min(...products.map(p => p.price)),
                max: Math.max(...products.map(p => p.price)),
            },
        },
    }
}

/**
 * Search products
 */
export async function searchProducts(query, limit = 10) {
    await delay(150)

    const allProducts = Object.values(MOCK_PRODUCTS).flat()
    const searchLower = query.toLowerCase()

    const results = allProducts
        .filter(p =>
            p.name.toLowerCase().includes(searchLower) ||
            p.brand.toLowerCase().includes(searchLower) ||
            p.category.toLowerCase().includes(searchLower)
        )
        .slice(0, limit)

    return {
        success: true,
        data: results,
        meta: {
            query,
            total: results.length,
        },
    }
}

// ============================================
// SPECIAL OFFERS DATA
// ============================================

export async function getSpecialOffers() {
    await delay()

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
// EXPORT ALL
// ============================================

export default {
    getCategories,
    getSpaces,
    getStyles,
    getProducts,
    getProduct,
    getFeaturedProducts,
    getFilterOptions,
    searchProducts,
    getSpecialOffers,
}
