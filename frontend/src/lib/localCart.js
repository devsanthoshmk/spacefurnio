const LOCAL_CART_KEY = 'spacefurnio_local_cart'
const LOCAL_WISHLIST_KEY = 'spacefurnio_local_wishlist'

export function getLocalCart() {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(LOCAL_CART_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('Error reading local cart:', e)
    return []
  }
}

export function setLocalCart(items) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Error saving local cart:', e)
  }
}

export function addToLocalCart(productId, quantity = 1, price = null) {
  const items = getLocalCart()
  const existingIndex = items.findIndex(item => item.productId === productId)

  if (existingIndex >= 0) {
    items[existingIndex].quantity += quantity
    if (price) items[existingIndex].priceSnapshot = price
  } else {
    items.push({
      productId,
      quantity,
      priceSnapshot: price,
      addedAt: Date.now()
    })
  }

  setLocalCart(items)
  return items
}

export function updateLocalCartItem(productId, quantity) {
  const items = getLocalCart()
  const index = items.findIndex(item => item.productId === productId)

  if (index >= 0) {
    if (quantity <= 0) {
      items.splice(index, 1)
    } else {
      items[index].quantity = quantity
    }
  }

  setLocalCart(items)
  return items
}

export function removeFromLocalCart(productId) {
  const items = getLocalCart().filter(item => item.productId !== productId)
  setLocalCart(items)
  return items
}

export function clearLocalCart() {
  setLocalCart([])
}

export function getLocalWishlist() {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(LOCAL_WISHLIST_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('Error reading local wishlist:', e)
    return []
  }
}

export function setLocalWishlist(items) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(items))
  } catch (e) {
    console.error('Error saving local wishlist:', e)
  }
}

export function addToLocalWishlist(productId) {
  const items = getLocalWishlist()
  
  if (!items.some(item => item.productId === productId)) {
    items.push({
      productId,
      addedAt: Date.now()
    })
    setLocalWishlist(items)
  }
  
  return items
}

export function removeFromLocalWishlist(productId) {
  const items = getLocalWishlist().filter(item => item.productId !== productId)
  setLocalWishlist(items)
  return items
}

export function clearLocalWishlist() {
  setLocalWishlist([])
}

export function hasLocalCart() {
  return getLocalCart().length > 0
}

export function hasLocalWishlist() {
  return getLocalWishlist().length > 0
}