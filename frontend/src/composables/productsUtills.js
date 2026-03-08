// --- Helpers ---

export const formatNameHelper = (slug) => {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const getColorHexHelper = (colorName) => {
  const colors = {
    Natural: '#E5D3B3',
    'Dark Brown': '#4A3728',
    Black: '#1A1A1A',
    White: '#F5F5F5',
    Grey: '#808080',
    Blue: '#3B82F6',
    Red: '#EF4444',
    Green: '#10B981',
    Yellow: '#F59E0B',
    Beige: '#F5F5DC',
    Walnut: '#5D4037',
    Oak: '#C19A6B',
    Teak: '#8B5A2B',
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
