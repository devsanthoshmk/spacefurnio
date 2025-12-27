export default class ScrollAnimationController {
  constructor(el) {
    if (!el) throw new Error('Element is required')

    // Core elements
    this.section = el
    this.grid = el.querySelector('#products-grid')
    this.texts = [
      el.querySelector('#text-1'),
      el.querySelector('#text-2'),
      el.querySelector('#text-3'),
    ].filter(Boolean)

    // Use existing background layers
    this.bgLayers = [el.querySelector('#bg-layer-1'), el.querySelector('#bg-layer-2')].filter(
      Boolean,
    )

    this.overlay = el.querySelector('#fade-overlay')
    this.images = ['/images/linemeetslight.png', '/images/functionmeetsoul.png', '/images/f2.png']

    // Simple state management
    this.state = {
      currentStep: -1,
      activeImageIndex: -1,
      isTransitioning: false,
      scrollProgress: 0,
      lastScrollTime: 0,
      scrollVelocity: 0,
      transitionDuration: 1000, // Track transition duration
    }

    // Performance tracking
    this.performance = {
      ticking: false,
      rafId: null,
    }

    // Cached measurements
    this.measurements = {
      sectionHeight: 0,
      viewportHeight: 0,
      lastUpdate: 0,
    }

    this.init()
  }

  init() {
    this.preloadImages()
      .then(() => {
        this.setupInitialState()
        this.bindEvents()
        this.handleScroll() // Initial check
      })
      .catch((err) => console.error('Failed to preload images:', err))
  }

  preloadImages() {
    console.log('Preloading images...')
    const promises = this.images.map((src, index) => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          console.log(`Image ${index + 1} loaded: ${src}`)
          resolve(src)
        }
        img.onerror = () => {
          console.error(`Failed to load image: ${src}`)
          reject(src)
        }
        img.src = src
      })
    })

    return Promise.all(promises).then(() => console.log('All images preloaded successfully'))
  }

  setupInitialState() {
    console.log('Setting up initial state...')

    if (this.bgLayers.length < 2) {
      console.error('Need at least 2 background layers')
      return
    }

    // Setup primary layer (always visible)
    this.bgLayers[0].style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('${this.images[0]}');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      opacity: 1;
      z-index: 2;
      transform: translate3d(0, 0, 0) scale(1);
      filter: blur(0px) brightness(1);
      transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform, filter;
      backface-visibility: hidden;
    `

    // Setup secondary layer (for transitions)
    this.bgLayers[1].style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;  // Fixed typo: no-range -> no-repeat
      opacity: 0;
      z-index: 1;
      transform: translate3d(0, 0, 0) scale(1.1);
      filter: blur(0px) brightness(1);
      transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform, filter, opacity;
      backface-visibility: hidden;
    `

    this.state.activeImageIndex = 0
    console.log('First image set:', this.images[0])

    // Setup text elements
    this.texts.forEach((text, index) => {
      if (text) {
        text.style.cssText = `
          opacity: 0;
          visibility: hidden;
          transform: translate3d(-50%, -50%, 0) translateY(30px) scale(0.9);
          filter: blur(0px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, opacity, filter;
          backface-visibility: hidden;
        `
      }
    })

    // Setup overlay
    if (this.overlay) {
      this.overlay.style.cssText = `
        opacity: 0;
        transition: opacity 0.6s ease-out;
        will-change: opacity;
      `
    }

    console.log('Initial state setup complete')
  }

  bindEvents() {
    let lastScrollY = window.scrollY // Use scrollY instead of pageYOffset

    this.scrollHandler = () => {
      const currentScrollY = window.scrollY // Use scrollY instead of pageYOffset
      const scrollDelta = currentScrollY - lastScrollY

      // Calculate scroll velocity for fast scroll detection
      const now = performance.now()
      const timeDelta = now - this.state.lastScrollTime
      this.state.scrollVelocity = Math.abs(scrollDelta) / Math.max(timeDelta, 1)
      this.state.lastScrollTime = now

      lastScrollY = currentScrollY

      if (!this.performance.ticking) {
        this.performance.ticking = true
        this.performance.rafId = requestAnimationFrame(() => {
          this.handleScroll()
          this.performance.ticking = false
        })
      }
    }

    window.addEventListener('scroll', this.scrollHandler, { passive: true })
  }

  updateMeasurements() {
    const now = performance.now()
    if (now - this.measurements.lastUpdate > 100) {
      this.measurements.sectionHeight = this.section.offsetHeight
      this.measurements.viewportHeight = window.innerHeight
      this.measurements.lastUpdate = now
    }
  }

  handleScroll() {
    this.updateMeasurements()

    const rect = this.section.getBoundingClientRect()
    const { sectionHeight, viewportHeight } = this.measurements

    // Early exit if section not visible
    if (rect.top > viewportHeight || rect.top < -sectionHeight) {
      return
    }

    // Calculate progress (0 to 1)
    const progress = Math.max(0, Math.min(1, -rect.top / (sectionHeight - viewportHeight)))
    this.state.scrollProgress = progress

    // Map to 9 distinct steps for 3 cycles (image → blur → text) × 3
    const step = Math.floor(progress * 9)

    if (step !== this.state.currentStep) {
      console.log(
        `Step changed: ${this.state.currentStep} → ${step} (progress: ${progress.toFixed(3)})`,
      )
      this.state.currentStep = step
      this.executeStep(step)
    }
  }

  executeStep(step) {
    console.log(`Executing step ${step}`)

    // Handle fast scrolling - reduce transition times
    const isFastScrolling = this.state.scrollVelocity > 2
    const transitionSpeed = isFastScrolling ? '0.3s' : '1s'
    this.state.transitionDuration = isFastScrolling ? 300 : 1000 // Store duration in ms

    // Update transition speeds for fast scrolling
    this.updateTransitionSpeeds(transitionSpeed)

    switch (step) {
      case 0: // Image 1 clear
        this.showImage(0, false)
        this.hideAllTexts()
        break

      case 1: // Image 1 blur
        this.showImage(0, true)
        this.hideAllTexts()
        break

      case 2: // Image 1 + Text 1
        this.showImage(0, true)
        this.showText(0)
        break

      case 3: // Transition to Image 2 + clear
        this.transitionToImage(1)
        this.hideAllTexts()
        break

      case 4: // Image 2 blur
        this.showImage(1, true)
        this.hideAllTexts()
        break

      case 5: // Image 2 + Text 2
        this.showImage(1, true)
        this.showText(1)
        break

      case 6: // Transition to Image 3 + clear
        this.transitionToImage(2)
        this.hideAllTexts()
        break

      case 7: // Image 3 blur
        this.showImage(2, true)
        this.hideAllTexts()
        break

      case 8: // Image 3 + Text 3 (final state)
        this.showImage(2, true)
        this.showText(2)
        break
    }

    // Reset transition speeds after fast scrolling
    if (isFastScrolling) {
      setTimeout(() => {
        this.updateTransitionSpeeds('1s')
        this.state.transitionDuration = 1000
      }, 300)
    }
  }

  updateTransitionSpeeds(speed) {
    this.bgLayers.forEach((layer) => {
      if (layer) {
        layer.style.transition = `all ${speed} cubic-bezier(0.4, 0, 0.2, 1)`
      }
    })

    this.texts.forEach((text) => {
      if (text) {
        text.style.transition = `all ${speed} cubic-bezier(0.4, 0, 0.2, 1)`
      }
    })
  }

  showImage(imageIndex, blur = false) {
    console.log(`Showing image ${imageIndex}, blur: ${blur}`)

    // Ensure correct image is loaded
    if (this.state.activeImageIndex !== imageIndex && !this.state.isTransitioning) {
      this.setActiveImage(imageIndex)
    }

    const activeLayer = this.bgLayers[0]
    if (!activeLayer) return

    // Apply effects
    if (blur) {
      activeLayer.style.filter = 'blur(8px) brightness(0.8)'
      activeLayer.style.transform = 'translate3d(0, 0, 0) scale(1.05)'
      if (this.overlay) {
        this.overlay.style.opacity = '0.3'
      }
    } else {
      activeLayer.style.filter = 'blur(0px) brightness(1)'
      activeLayer.style.transform = 'translate3d(0, 0, 0) scale(1)'
      if (this.overlay) {
        this.overlay.style.opacity = '0'
      }
    }
  }

  setActiveImage(imageIndex) {
    console.log(`Setting active image to ${imageIndex}: ${this.images[imageIndex]}`)

    if (imageIndex < 0 || imageIndex >= this.images.length) return

    this.state.activeImageIndex = imageIndex

    const activeLayer = this.bgLayers[0]
    if (activeLayer) {
      activeLayer.style.backgroundImage = `url('${this.images[imageIndex]}')`
      activeLayer.style.opacity = '1'
      console.log('Image set on layer:', activeLayer.style.backgroundImage)
    }
  }

  transitionToImage(imageIndex) {
    console.log(`Transitioning to image ${imageIndex}`)

    if (
      this.state.isTransitioning ||
      this.state.activeImageIndex === imageIndex ||
      imageIndex < 0 ||
      imageIndex >= this.images.length
    ) {
      return
    }

    this.state.isTransitioning = true

    const frontLayer = this.bgLayers[0] // Current visible layer
    const backLayer = this.bgLayers[1] // Layer for new image
    const duration = this.state.transitionDuration

    // Setup new image on back layer
    backLayer.style.backgroundImage = `url('${this.images[imageIndex]}')`
    backLayer.style.opacity = '0'
    backLayer.style.transform = 'translate3d(0, 0, 0) scale(1.1)'
    backLayer.style.filter = 'blur(0px) brightness(1)'
    backLayer.style.zIndex = '1'

    // Ensure front layer is on top
    frontLayer.style.zIndex = '2'

    // Force reflow
    backLayer.offsetHeight

    // Start transition
    requestAnimationFrame(() => {
      // Fade in new image
      backLayer.style.opacity = '1'
      backLayer.style.transform = 'translate3d(0, 0, 0) scale(1)'

      // Fade out current image after slight delay
      setTimeout(() => {
        frontLayer.style.opacity = '0'
        frontLayer.style.transform = 'translate3d(0, 0, 0) scale(0.95)'
      }, 100)

      // Complete transition
      setTimeout(() => {
        // Swap layers
        frontLayer.style.backgroundImage = `url('${this.images[imageIndex]}')`
        frontLayer.style.opacity = '1'
        frontLayer.style.transform = 'translate3d(0, 0, 0) scale(1)'
        frontLayer.style.filter = 'blur(0px) brightness(1)'
        frontLayer.style.zIndex = '2'

        // Reset back layer
        backLayer.style.opacity = '0'
        backLayer.style.transform = 'translate3d(0, 0, 0) scale(1.1)'
        backLayer.style.zIndex = '1'

        this.state.activeImageIndex = imageIndex
        this.state.isTransitioning = false

        console.log(`Transition to image ${imageIndex} completed`)
      }, 100 + duration) // Use dynamic duration
    })
  }

  showText(textIndex) {
    console.log(`Showing text ${textIndex}`)

    if (textIndex < 0 || textIndex >= this.texts.length) return

    const text = this.texts[textIndex]
    if (!text) return

    // Hide all other texts first
    this.hideAllTexts()

    // Show target text
    text.style.opacity = '1'
    text.style.visibility = 'visible'
    text.style.transform = 'translate3d(-50%, -50%, 0) translateY(0px) scale(1)'
    text.style.filter = 'blur(0px)'

    console.log(`Text ${textIndex} shown: "${text.textContent?.substring(0, 30)}..."`)
  }

  hideAllTexts() {
    this.texts.forEach((text, index) => {
      if (text && text.style.opacity !== '0') {
        text.style.opacity = '0'
        text.style.visibility = 'hidden'
        text.style.transform = 'translate3d(-50%, -50%, 0) translateY(30px) scale(0.9)'
        text.style.filter = 'blur(0px)'
      }
    })
  }

  destroy() {
    // Cancel pending animations
    if (this.performance.rafId) {
      cancelAnimationFrame(this.performance.rafId)
    }

    // Remove event listeners
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler)
    }

    // Clear references
    this.section = null
    this.grid = null
    this.texts = null
    this.bgLayers = null
    this.overlay = null

    console.log('ScrollAnimationController destroyed')
  }
}
