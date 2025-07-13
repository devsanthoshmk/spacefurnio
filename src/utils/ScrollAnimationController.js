export default class ScrollAnimationController {
  constructor(el) {
    console.log('ScrollAnimationController initialized with element:', el)
    this.productsSection = el
    this.productsGrid = el.querySelector('#products-grid')
    this.texts = [
      el.querySelector('#text-1'),
      el.querySelector('#text-2'),
      el.querySelector('#text-3'),
    ]
    this.bgLayers = [el.querySelector('#bg-layer-1'), el.querySelector('#bg-layer-2')]
    this.fadeOverlay = el.querySelector('#fade-overlay')

    // Using your actual images
    this.images = [
      '/images/linemeetslight.png',
      '/images/functionmeetsoul.png',
      '/images/taglinebg.png',
    ]

    this.currentImageIndex = 0
    this.currentLayerIndex = 0
    this.currentTextIndex = -1
    // this.isTransitioning = false;
    this.lastScrollProgress = 0
    //this.transitionLock = false;

    this.init()
  }

  init() {
    // Set initial background
    this.bgLayers[0].style.backgroundImage = `url('${this.images[0]}')`
    this.bgLayers[1].style.backgroundImage = `url('${this.images[1]}')`

    // Bind scroll handler
    this.handleScroll = this.handleScroll.bind(this)
    window.addEventListener('scroll', this.handleScroll)

    // Initial update
    this.updateAnimation()
  }

  handleScroll() {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.updateAnimation()
        this.ticking = false
      })
      this.ticking = true
    }
  }

  updateAnimation() {
    const rect = this.productsSection.getBoundingClientRect()
    const sectionHeight = this.productsSection.offsetHeight
    const viewportHeight = window.innerHeight

    // Calculate smooth scroll progress
    const scrollProgress = Math.max(0, Math.min(1, -rect.top / (sectionHeight - viewportHeight)))

    // Prevent rapid scroll issues by checking for major jumps
    const progressDiff = Math.abs(scrollProgress - this.lastScrollProgress)
    if (progressDiff > 0.1) {
      // Reset transition state if there's a major scroll jump
      this.resetTransitionState()
    }
    this.lastScrollProgress = scrollProgress

    // Define animation phases with smoother transitions
    const phases = [
      { start: 0, end: 0.12, type: 'image', index: 0, blur: false }, // Image 1 clear
      { start: 0.12, end: 0.18, type: 'blur-in', index: 0 }, // Start blur
      { start: 0.18, end: 0.28, type: 'text', index: 0, textIndex: 0 }, // Text 1 appears
      { start: 0.28, end: 0.35, type: 'text-out', index: 0, textIndex: 0 }, // Text 1 disappears
      { start: 0.35, end: 0.42, type: 'transition', from: 0, to: 1 }, // Transition to image 2

      { start: 0.42, end: 0.54, type: 'image', index: 1, blur: false }, // Image 2 clear
      { start: 0.54, end: 0.6, type: 'blur-in', index: 1 }, // Start blur
      { start: 0.6, end: 0.7, type: 'text', index: 1, textIndex: 1 }, // Text 2 appears
      { start: 0.7, end: 0.77, type: 'text-out', index: 1, textIndex: 1 }, // Text 2 disappears
      { start: 0.77, end: 0.84, type: 'transition', from: 1, to: 2 }, // Transition to image 3

      { start: 0.84, end: 0.96, type: 'image', index: 2, blur: false }, // Image 3 clear
      { start: 0.96, end: 1, type: 'text', index: 2, textIndex: 2 }, // Final text
    ]

    // Find current phase
    const currentPhase =
      phases.find((phase) => scrollProgress >= phase.start && scrollProgress < phase.end) ||
      phases[phases.length - 1]

    this.executePhase(currentPhase, scrollProgress)
  }

  executePhase(phase, scrollProgress) {
    const phaseProgress = (scrollProgress - phase.start) / (phase.end - phase.start)

    switch (phase.type) {
      case 'image':
        this.showImage(phase.index, false)
        this.hideAllTexts()
        break

      case 'blur-in':
        this.showImage(phase.index, true, phaseProgress)
        break

      case 'text':
        this.showImage(phase.index, true)
        this.showText(phase.textIndex, phaseProgress)
        break

      case 'text-out':
        this.showImage(phase.index, true)
        this.hideText(phase.textIndex, phaseProgress)
        break

      case 'transition':
        // simple crossfade, no locks
        this.transitionImage(phase.from, phase.to, phaseProgress)
        this.hideAllTexts()
        break
    }
  }

  showImage(index, blur = false, blurProgress = 1) {
    if (this.currentImageIndex !== index) {
      this.switchToImage(index)
    }

    const currentLayer = this.bgLayers[this.currentLayerIndex]

    if (blur) {
      const blurAmount = 15 * blurProgress
      const brightness = 0.7 + 0.3 * (1 - blurProgress)
      currentLayer.style.filter = `blur(${blurAmount}px) brightness(${brightness})`
      currentLayer.style.transform = `scale(${1 + 0.05 * blurProgress})`

      this.fadeOverlay.style.opacity = blurProgress * 0.3
    } else {
      currentLayer.style.filter = 'blur(0px) brightness(1)'
      currentLayer.style.transform = 'scale(1)'
      this.fadeOverlay.style.opacity = '0'
    }
  }

  switchToImage(index) {
    if (this.currentImageIndex === index) {
      return
    }

    // toggle which <div> is on top
    const oldLayerIndex = this.currentLayerIndex
    const newLayerIndex = 1 - oldLayerIndex
    this.currentLayerIndex = newLayerIndex
    this.currentImageIndex = index

    const oldLayer = this.bgLayers[oldLayerIndex]
    const newLayer = this.bgLayers[newLayerIndex]

    // prepare the new layer off‑screen/hidden
    newLayer.style.backgroundImage = `url('${this.images[index]}')`
    newLayer.style.opacity = '0'
    newLayer.style.transform = 'scale(1.1)'
    newLayer.style.filter = 'blur(15px) brightness(0.7)'

    // force a reflow so the browser registers the starting point
    void newLayer.offsetWidth

    // fade the old one out & blur it
    oldLayer.classList.remove('current')
    oldLayer.classList.add('blurred')
    oldLayer.style.opacity = '0'

    // fade the new one in
    newLayer.classList.remove('next')
    newLayer.classList.add('current')
    newLayer.style.opacity = '1'
    newLayer.style.transform = 'scale(1)'
    newLayer.style.filter = 'blur(0px) brightness(1)'

    // after the CSS transition finishes, clean up classes
    setTimeout(() => {
      oldLayer.classList.remove('blurred')
      oldLayer.classList.add('next')
    }, 1500)
  }

  resetTransitionState() {
    //this.isTransitioning = false;
    //                this.transitionLock = false;

    // Reset both layers to known states
    this.bgLayers.forEach((layer, index) => {
      layer.style.opacity = index === this.currentLayerIndex ? '1' : '0'
      layer.style.transform = 'scale(1)'
      layer.style.filter = 'blur(0px)'
    })
  }

  /**
   * Crossfade from `fromIndex` → `toIndex` based purely on `progress` [0–1].
   * Works in both directions automatically.
   */
  transitionImage(fromIndex, toIndex, progress) {
    const oldLayer = this.bgLayers[this.currentLayerIndex]
    const newLayer = this.bgLayers[1 - this.currentLayerIndex]

    // ensure the "next" layer has the correct image
    newLayer.style.backgroundImage = `url('${this.images[toIndex]}')`

    // easing
    const t = this.easeInOutCubic(progress)

    // fade out old, fade in new
    oldLayer.style.opacity = `${1 - t}`
    newLayer.style.opacity = `${t}`

    // add a little blur/scale flavor
    oldLayer.style.filter = `blur(${8 * t}px) brightness(${0.8 + 0.2 * (1 - t)})`
    oldLayer.style.transform = `scale(${1 + 0.05 * t})`

    newLayer.style.filter = `blur(${8 * (1 - t)}px) brightness(${0.7 + 0.3 * t})`
    newLayer.style.transform = `scale(${1.1 - 0.05 * t})`

    // once we’ve fully transitioned, swap the “currentLayerIndex”
    if (progress >= 1) {
      this.currentLayerIndex = 1 - this.currentLayerIndex
      this.currentImageIndex = toIndex
    }
  }

  updateImageTransition(progress) {
    const currentLayer = this.bgLayers[this.currentLayerIndex]
    const nextLayer = this.bgLayers[1 - this.currentLayerIndex]

    // Smooth easing function
    const easeProgress = this.easeInOutCubic(progress)

    // Fade out current, fade in next
    currentLayer.style.opacity = 1 - easeProgress
    nextLayer.style.opacity = easeProgress
    nextLayer.style.transform = `scale(${1.1 - 0.1 * easeProgress})`

    // Add subtle blur transition
    const blurAmount = 3 * (1 - Math.abs(0.5 - easeProgress) * 2)
    nextLayer.style.filter = `blur(${blurAmount}px)`
  }

  completeImageTransition(toIndex) {
    const nextLayerIndex = 1 - this.currentLayerIndex
    const nextLayer = this.bgLayers[nextLayerIndex]
    const currentLayer = this.bgLayers[this.currentLayerIndex]

    // Finalize transition
    nextLayer.style.opacity = '1'
    nextLayer.style.transform = 'scale(1)'
    nextLayer.style.filter = 'blur(0px)'

    // Hide previous layer
    currentLayer.style.opacity = '0'

    // Switch active layer
    this.currentLayerIndex = nextLayerIndex
    this.currentImageIndex = toIndex
    // this.isTransitioning = false;

    // Add small delay before allowing next transition
    setTimeout(() => {
      //this.transitionLock = false;
    }, 100)
  }

  showText(index, progress) {
    const text = this.texts[index]
    const easeProgress = this.easeOutCubic(progress)

    if (this.currentTextIndex !== index) {
      this.hideAllTexts()
      this.currentTextIndex = index
    }

    text.classList.remove('entering', 'leaving')
    text.classList.add('appear', 'breathing')
    text.style.opacity = easeProgress
    text.style.transform = `translate(-50%, -50%) translateY(${60 * (1 - easeProgress)}px) scale(${0.8 + 0.2 * easeProgress})`
    text.style.filter = `blur(${3 * (1 - easeProgress)}px)`
  }

  hideText(index, progress) {
    const text = this.texts[index]
    const easeProgress = this.easeInCubic(progress)

    text.classList.remove('appear', 'breathing')
    text.classList.add('leaving')
    text.style.opacity = 1 - easeProgress
    text.style.transform = `translate(-50%, -50%) translateY(${-60 * easeProgress}px) scale(${1 + 0.1 * easeProgress})`
    text.style.filter = `blur(${5 * easeProgress}px)`
  }

  hideAllTexts() {
    this.texts.forEach((text) => {
      text.classList.remove('appear', 'breathing')
      text.classList.add('entering')
      text.style.opacity = '0'
    })
    this.currentTextIndex = -1
  }

  // Easing functions
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3)
  }

  easeInCubic(t) {
    return t * t * t
  }
}
