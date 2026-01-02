


// --- Helpers ---

export const formatNameHelper = (slug) => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const getColorHexHelper = (colorName) => {
  const colors = {
    'Natural': '#E5D3B3',
    'Dark Brown': '#4A3728',
    'Black': '#1A1A1A',
    'White': '#F5F5F5',
    'Grey': '#808080',
    'Blue': '#3B82F6',
    'Red': '#EF4444',
    'Green': '#10B981',
    'Yellow': '#F59E0B',
    'Beige': '#F5F5DC',
    'Walnut': '#5D4037',
    'Oak': '#C19A6B',
    'Teak': '#8B5A2B'
  }
  return colors[colorName] || '#CCCCCC'
}


// --- Actions ---

export const addToCart = (product) => {
  // Placeholder for cart logic
  console.log('Added to cart:', product)
  // You would typically use a store here, e.g., cartStore.addItem(product)
}

export const toggleWishlist = (product) => {
  // Placeholder for wishlist logic
  console.log('Toggled wishlist:', product)
}

const files={
  category: () => import('@/data/category.json').then(d=>d.default || d),
  style: () => import('@/data/design-style.json').then(d=>d.default || d),
  space: () => import('@/data/design-space.json').then(d=>d.default || d),
}
// Derive shop type & category/design from the URL and returns everything needed for each category type
export const useCurrentShop = (route) => {
  if (route.path.includes('/shop/design')) {
    if (route.path.includes('/shop/design/space'))
      return {type:'space',breadcrumbName: "Shop By Space", importJson: files.space, route: "/shop/design" }
    else
      return {type:'style',breadcrumbName: "Shop By Style", importJson: files.style, route: "/shop/design" }
  } else {
    return {type:'category',breadcrumbName: "Shop By Category", importJson: files.category, route: "/shop/category" }
  }
}

// --- Data Loading ---
const cache = {}

export const getShopTypeProducts= async (route) => {
  try {
    const shop = useCurrentShop(route)
    if (!cache[shop.type]) {
      // import products based on shop type
      let data = await shop.importJson()

      // Normalize and enhance data for UI
      const products = data.map(p => {
        // Ensure images array exists. If only imageSrc, create array.
        // For demo purposes, we duplicate the image to show carousel functionality
        // In production, this would come from the API
        const images = p.images || (p.imageSrc ? [p.imageSrc, p.imageSrc, p.imageSrc] : [])

        return {
          ...p,
          images,
          // Ensure other fields exist
          rating: p.rating || 0,
          reviews: p.reviews || 0,
          colors: p.colors || [],
        }
      })
      cache[shop.type] = products
      return products
    }
    return cache[shop.type]

  } catch (err) {
    console.error('Error importing products json:', err)
    return []
  }
}

export const getAllProducts = async () => {
  try {
    Object.keys(files).forEach(async (key) => {
      if (!cache[key]) {
        let data = await files[key]()

        // Normalize and enhance data for UI
        const products = data.map(p => {
          // Ensure images array exists. If only imageSrc, create array.
          // For demo purposes, we duplicate the image to show carousel functionality
          // In production, this would come from the API
          const images = p.images || (p.imageSrc ? [p.imageSrc, p.imageSrc, p.imageSrc] : [])

          return {
            ...p,
            images,
            // Ensure other fields exist
            rating: p.rating || 0,
            reviews: p.reviews || 0,
            colors: p.colors || [],
          }
        })
        cache[key] = products
      }
    })
    // Combine all products into a single object
    const jsons = {}
    Object.keys(cache).forEach(key => jsons[key] = cache[key])
    return jsons
  } catch (err) {
    console.error('Error importing all products json:', err)
    return {}
  }

}
