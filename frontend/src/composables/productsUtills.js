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
    Grey: '#808080',
    Gray: '#808080',
    Blue: '#3B82F6',
    Red: '#EF4444',
    Yellow: '#F59E0B',
    Beige: '#F5F0E6',
    Walnut: '#5D4037',
    Teak: '#8B5A2B',
    Espresso: '#3C1414',
    Charcoal: '#36454F',
    'Charcoal Grey': '#36454F',
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
