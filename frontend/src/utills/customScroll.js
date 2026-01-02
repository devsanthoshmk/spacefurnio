/**
 * Section-based scrolling utility that synchronizes wheel, touch, and keyboard navigation
 * while managing optional navigation dots. Designed for full-height layouts where each
 * child section occupies the viewport and should snap into view.
 */
const SCROLL_DIRECTION = {
  UP: -1,
  DOWN: 1
}

/**
 * Default behavioural options for the scroller. Consumers can override any subset via the
 * `config` argument when creating a scroller instance.
 *
 * @type {Readonly<{
 *   scrollDelay: number,
 *   bounceDistance: number,
 *   bounceDuration: number,
 *   touchThreshold: number,
 *   transitionTiming: string,
 *   enableResizeListener: boolean
 * }>}
 */
const DEFAULT_OPTIONS = Object.freeze({
  scrollDelay: 400,
  bounceDistance: 100,
  bounceDuration: 250,
  touchThreshold: 30,
  transitionTiming: 'cubic-bezier(0.5, 0, 0.2, 1)',
  emmitSectionChangeEvent: true,
  enableResizeListener: true
})
// Add pixel snap tolerance
const ALIGN_EPSILON = 2

/**
 * Normalises a DOM element reference that may be passed directly or via a ref-like wrapper
 * such as Vue's `ref`.
 *
 * @template {HTMLElement} T
 * @param {T | { value: T } | null | undefined} candidate
 * @returns {T | null}
 */
const toElement = candidate => candidate?.value ?? candidate ?? null

/**
 * Retrieves all child sections matching the configured class name.
 *
 * @param {HTMLElement} wrapperEl
 * @param {string} childClass
 * @returns {HTMLElement[]}
 */
const queryChildSections = (wrapperEl, childClass) =>
  Array.from(wrapperEl.querySelectorAll(`.${childClass}`))

/**
 * Determines the current viewport height, accounting for SSR-compatible fallbacks.
 *
 * @returns {number}
 */
const getViewportHeight = () => window.innerHeight || document.documentElement.clientHeight

/**
 * Calculates the minimum translate offset required to keep the final section in view.
 *
 * @param {HTMLElement} wrapperEl
 * @param {number} viewportHeight
 * @returns {number}
 */
const computeMinOffset = (wrapperEl, viewportHeight) => {
  const maxScroll = wrapperEl.scrollHeight - viewportHeight
  return maxScroll > 0 ? -maxScroll : 0
}

/**
 * Restricts a numeric value between inclusive bounds.
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

/**
 * Applies a transition style to the wrapper element so the translate animations are eased.
 *
 * @param {HTMLElement} wrapperEl
 * @param {number} duration
 * @param {string} timing
 */
const applyTransition = (wrapperEl, duration, timing) => {
  wrapperEl.style.transition = `transform ${duration}ms ${timing}`
}

/**
 * Highlights a section with the `.active` class by index while clearing previous selections.
 *
 * @param {HTMLElement[]} sections
 * @param {number} activeIndex
 */
const highlightSections = (sections, activeIndex) => {
  sections.forEach((section, index) => {
    if (index === activeIndex) {
      section.classList.add('active')
    } else {
      section.classList.remove('active')
    }
  })
}

/**
 * Updates dot navigation to mirror the active section. No-op when navigation dots are absent.
 *
 * @param {HTMLElement | null} navDotsEl
 * @param {number} activeIndex
 */
const highlightDots = (navDotsEl, activeIndex) => {
  if (!navDotsEl) return
  const dots = navDotsEl.querySelectorAll('.dot')
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === activeIndex)
  })
}

/**
 * Synchronises DOM state (sections and dots) to the currently active index.
 *
 * @param {ReturnType<typeof createScrollState>} state
 */
const updateActiveState = state => {
  highlightSections(state.childElements, state.currentIndex);
  highlightDots(state.navDotsEl, state.currentIndex);
  // Emit custom event for section change
  if (state.options.emmitSectionChangeEvent) {
    const event = new CustomEvent('sectionChange', {
      detail: {
        currentIndex: state.currentIndex,
        currentSection: state.childElements[state.currentIndex]
       }
    });
    state.wrapperEl.dispatchEvent(event);
  }
}

/**
 * Applies a translate offset to the wrapper while clamping it within scroll bounds.
 *
 * @param {ReturnType<typeof createScrollState>} state
 * @param {number} nextOffset
 */
const applyOffset = (state, nextOffset) => {
  // Snap to integer to avoid sub-pixel accumulation (-772.4 -> -773)
  state.offset = Math.round(clamp(nextOffset, state.minOffset, state.maxOffset))
  state.wrapperEl.style.transform = `translateY(${state.offset}px)`
}

/**
 * Refreshes cached measurements (viewport and boundaries) and reapplies the current offset.
 * Useful when called on resize.
 *
 * @param {ReturnType<typeof createScrollState>} state
 */
const updateDimensions = state => {
  state.viewportHeight = getViewportHeight()
  state.minOffset = computeMinOffset(state.wrapperEl, state.viewportHeight)
  applyOffset(state, state.offset)
}

/**
 * Calculates the wrapper offset required to reveal the section at the provided index.
 *
 * @param {ReturnType<typeof createScrollState>} state
 * @param {number} targetIndex
 * @returns {number}
 */
const getOffsetForIndex = (state, targetIndex) => {
  let offsetSum = 0
  for (let i = 0; i < targetIndex; i++) {
    offsetSum -= state.childElements[i].offsetHeight
  }
  return clamp(offsetSum, state.minOffset, state.maxOffset)
}

/**
 * Directly navigates to a specific section, updating offsets and active styles.
 *
 * @param {ReturnType<typeof createScrollState>} state
 * @param {number} targetIndex
 */
const jumpToIndex = (state, targetIndex) => {
  const nextIndex = clamp(targetIndex, 0, state.itemCount - 1)
  const nextOffset = getOffsetForIndex(state, nextIndex)
  applyOffset(state, nextOffset)
  state.currentIndex = nextIndex
  updateActiveState(state)
  state.lastScrollTime = Date.now()
}

/**
 * Builds navigation dots that mirror the number of sections and wires click handlers for
 * direct navigation.
 *
 * @param {ReturnType<typeof createScrollState>} state
 * @param {(index: number) => void} onSelectIndex
 * @returns {() => void} Cleanup function that detaches listeners.
 */
const setupNavDots = (state, onSelectIndex) => {
  if (!state.navDotsEl) return () => {}

  state.navDotsEl.innerHTML = ''
  const fragment = document.createDocumentFragment()

  for (let i = 0; i < state.itemCount; i++) {
    const dot = document.createElement('div')
    dot.classList.add('dot')
    dot.dataset.index = String(i)
    fragment.appendChild(dot)
  }

  state.navDotsEl.appendChild(fragment)

  const handleClick = event => {
    const target = event.target.closest('.dot')
    if (!target || !state.navDotsEl.contains(target)) return
    const index = Number.parseInt(target.dataset.index ?? '', 10)
    if (!Number.isNaN(index)) {
      onSelectIndex(index)
    }
  }

  state.navDotsEl.addEventListener('click', handleClick)

  return () => {
    state.navDotsEl.removeEventListener('click', handleClick)
  }
}

/**
 * Checks whether the scroll handler should ignore the current event due to throttle delay.
 *
 * @param {ReturnType<typeof createScrollState>} state
 * @returns {boolean}
 */
const isThrottled = state => Date.now() - state.lastScrollTime < state.options.scrollDelay

/**
 * Determines if the scroll is already at the boundary in the requested direction.
 *
 * @param {ReturnType<typeof createScrollState>} state
 * @param {number} direction
 * @returns {boolean}
 */
const isAtBoundary = (state, direction) => {
  if (direction === SCROLL_DIRECTION.UP) {
    return state.currentIndex === 0 && state.offset >= state.maxOffset
  }
  console.log("currentIndex:", state.currentIndex, "itemCount:", state.itemCount, "offset:", state.offset, "minOffset:", state.minOffset,"return:", state.currentIndex === state.itemCount - 1 && state.offset <= state.minOffset);
  return state.currentIndex === state.itemCount - 1 && state.offset <= state.minOffset
}

/**
 * Provides a subtle bounce animation when the user attempts to scroll beyond boundaries.
 *
 * @param {ReturnType<typeof createScrollState>} state
 * @param {number} direction
 */
const bounce = (state, direction) => {
  const temporaryOffset = state.offset + state.options.bounceDistance * -direction
  state.wrapperEl.style.transform = `translateY(${temporaryOffset}px)`

  window.setTimeout(() => {
    state.wrapperEl.style.transform = `translateY(${state.offset}px)`
  }, state.options.bounceDuration)
}

/**
 * Attempts to consume scroll deltas within the currently active section before triggering
 * navigation to neighbouring sections.
 *
 * @param {ReturnType<typeof createScrollState>} state
 * @param {number} direction
 * @returns {boolean} True when the scroll was handled inside the section.
 */
const scrollWithinSection = (state, direction) => {
  const section = state.childElements[state.currentIndex]
  const rect = section.getBoundingClientRect()

  // Near top boundary when scrolling up: treat as aligned and allow section transition
  if (direction === SCROLL_DIRECTION.UP && rect.top < 0) {
    if (rect.top > -ALIGN_EPSILON) {
      // Snap precisely, then let performDirectionalScroll proceed to moveToAdjacentSection
      applyOffset(state, getOffsetForIndex(state, state.currentIndex))
      return false
    }
    const scrollAmount = Math.min(state.viewportHeight, Math.abs(rect.top))
    applyOffset(state, state.offset + scrollAmount)
    return true
  }

  // Near bottom boundary when scrolling down
  if (direction === SCROLL_DIRECTION.DOWN && rect.bottom > state.viewportHeight) {
    const overflow = rect.bottom - state.viewportHeight
    if (overflow < ALIGN_EPSILON) {
      applyOffset(state, getOffsetForIndex(state, state.currentIndex))
      return false
    }
    const scrollAmount = Math.min(state.viewportHeight, overflow)
    applyOffset(state, state.offset - scrollAmount)
    return true
  }

  return false
}

/**
 * Moves focus to the next or previous section based on direction. Supports sections taller
 * than the viewport by incrementally moving one viewport height at a time.
 *
 * @param {ReturnType<typeof createScrollState>} state
 * @param {number} direction
 * @returns {boolean} True when a section transition occurred.
 */
const moveToAdjacentSection = (state, direction) => {
  const nextIndex = state.currentIndex + direction
  if (nextIndex < 0 || nextIndex >= state.itemCount) return false

  const sectionHeight = state.childElements[direction === SCROLL_DIRECTION.DOWN ? nextIndex : state.currentIndex].offsetHeight //for down, we look at nextIndex, for up, currentIndex because we are moving up from current
  const delta = sectionHeight > state.viewportHeight ? state.viewportHeight : sectionHeight
  const nextOffset = state.offset - delta * direction

  applyOffset(state, nextOffset)
  console.log("sectionHeight:", sectionHeight, "viewportHeight:", state.viewportHeight, "delta:", delta, "nextOffset:", nextOffset, "OFFSET:", state.offset, "direction:", direction);
  state.currentIndex = nextIndex
  updateActiveState(state)
  return true
}
/** * Traverses the DOM to find the next element sibling, climbing up the hierarchy as needed.
 *
 * @param {Element} node
 * @returns {Element}
 */

// eslint-disable-next-line no-unused-vars
function getNextElement(node) {
  if (!(node instanceof Element)) {
    throw new TypeError('getNextElement: argument must be a DOM Element');
  }

  let next = node.nextElementSibling;

  while (!next && node.parentElement) {
    node = node.parentElement;
    next = node.nextElementSibling;
  }

  if (!next) {
    throw new Error('No next element found in the DOM hierarchy.');
  }

  return next;
}

/**
 * Centralised handler that orchestrates throttling, boundary bounce, section scrolling, and
 * cross-section navigation for any directional input.
 *
 * @param {ReturnType<typeof createScrollState>} state
 * @param {number} direction
 */
const performDirectionalScroll = (state, direction) => {
  if (isThrottled(state)) return

  const now = Date.now()

  if (isAtBoundary(state, direction)) {
    bounce(state, direction)
    state.lastScrollTime = now
    return
  }

  if (scrollWithinSection(state, direction)) {
    state.lastScrollTime = now;
    return
  }

  if (moveToAdjacentSection(state, direction)) {
    state.lastScrollTime = now
    return
  }

}

/**
 * Creates a wheel listener that converts delta values into directional section navigation.
 *
 * @param {ReturnType<typeof createScrollState>} state
 * @returns {(event: WheelEvent) => void}
 */
const createWheelHandler = state => event => {
  event.preventDefault()
  event.stopPropagation()
  const direction = event.deltaY < 0 ? SCROLL_DIRECTION.UP : SCROLL_DIRECTION.DOWN
  performDirectionalScroll(state, direction)
}

/**
 * Creates touch event listeners (start/move) to support swipe-based navigation on mobile
 * devices.
 *
 * @param {ReturnType<typeof createScrollState>} state
 * @returns {{ touchStart: (event: TouchEvent) => void, touchMove: (event: TouchEvent) => void }}
 */
const createTouchHandlers = state => {
  const touchStart = event => {
    state.touchStartY = event.touches[0].clientY
  }

  const touchMove = event => {
    event.preventDefault()
    event.stopPropagation()

    const touchY = event.touches[0].clientY
    const deltaY = state.touchStartY - touchY

    if (Math.abs(deltaY) > state.options.touchThreshold) {
      performDirectionalScroll(state, deltaY > 0 ? SCROLL_DIRECTION.DOWN : SCROLL_DIRECTION.UP)
      state.touchStartY = touchY
    }
  }

  return { touchStart, touchMove }
}

/**
 * Creates a keyboard handler that maps navigation keys to directional scrolling.
 *
 * @param {ReturnType<typeof createScrollState>} state
 * @returns {(event: KeyboardEvent) => void}
 */
const createKeyHandler = state => event => {
  event.stopPropagation()

  switch (event.key) {
    case 'ArrowUp':
    case 'PageUp':
      event.preventDefault()
      performDirectionalScroll(state, SCROLL_DIRECTION.UP)
      break
    case 'ArrowDown':
    case 'PageDown':
      event.preventDefault()
      performDirectionalScroll(state, SCROLL_DIRECTION.DOWN)
      break
    case 'Home':
      event.preventDefault()
      jumpToIndex(state, 0)
      break
    case 'End':
      event.preventDefault()
      jumpToIndex(state, state.itemCount - 1)
      break
  }
}

/**
 * Wires up all DOM event listeners required for the scroller and provides a cleanup function
 * that removes them. Consumers should call the cleanup function when tearing down the view.
 *
 * @param {ReturnType<typeof createScrollState>} state
 * @returns {() => void}
 */
const setupEventHandlers = state => {
  const wheelHandler = createWheelHandler(state)
  const { touchStart, touchMove } = createTouchHandlers(state)
  const keyHandler = createKeyHandler(state)
  const resizeHandler = () => updateDimensions(state)

  state.wrapperEl.addEventListener('wheel', wheelHandler, { passive: false })
  state.wrapperEl.addEventListener('touchstart', touchStart, { passive: true })
  state.wrapperEl.addEventListener('touchmove', touchMove, { passive: false })
  document.addEventListener('keydown', keyHandler)

  if (state.options.enableResizeListener) {
    window.addEventListener('resize', resizeHandler)
  }

  return () => {
    state.wrapperEl.removeEventListener('wheel', wheelHandler)
    state.wrapperEl.removeEventListener('touchstart', touchStart)
    state.wrapperEl.removeEventListener('touchmove', touchMove)
    document.removeEventListener('keydown', keyHandler)

    if (state.options.enableResizeListener) {
      window.removeEventListener('resize', resizeHandler)
    }
  }
}

/**
 * Creates the internal state object used across scroller helpers. The state stores cached
 * measurements, navigation pointers, and configuration options.
 *
 * @param {HTMLElement} wrapperEl
 * @param {string} childClass
 * @param {HTMLElement | null} navDotsEl
 * @param {typeof DEFAULT_OPTIONS} options
 * @returns {{
 *   wrapperEl: HTMLElement,
 *   navDotsEl: HTMLElement | null,
 *   childClass: string,
 *   childElements: HTMLElement[],
 *   itemCount: number,
 *   viewportHeight: number,
 *   offset: number,
 *   minOffset: number,
 *   maxOffset: number,
 *   currentIndex: number,
 *   lastScrollTime: number,
 *   touchStartY: number,
 *   options: typeof DEFAULT_OPTIONS
 * }}
 */
const createScrollState = (wrapperEl, childClass, navDotsEl, options) => {
  const childElements = queryChildSections(wrapperEl, childClass)

  return {
    wrapperEl,
    navDotsEl,
    childClass,
    childElements,
    itemCount: childElements.length,
    viewportHeight: getViewportHeight(),
    offset: 0,
    minOffset: computeMinOffset(wrapperEl, getViewportHeight()),
    maxOffset: 0,
    currentIndex: 0,
    lastScrollTime: 0,
    touchStartY: 0,
    options
  }
}

/**
 * Factory that initialises the scrolling behaviour for a given wrapper and returns a cleanup
 * callback. The wrapper should contain child sections identified by `childClass`.
 *
 * @param {HTMLElement | { value: HTMLElement } | null} wrapper
 * @param {string} childClass
 * @param {HTMLElement | { value: HTMLElement } | null} navDotsContainer
 * @param {Partial<typeof DEFAULT_OPTIONS>} [config]
 * @returns {() => void} Cleanup callback that detaches listeners and nav dots.
 */
export const scroller = (wrapper, childClass, navDotsContainer, config = {}) => {
  const wrapperEl = toElement(wrapper)
  const navDotsEl = toElement(navDotsContainer)

  if (!wrapperEl) {
    console.warn('[customScroll] No wrapper element provided.')
    return () => {}
  }

  const options = { ...DEFAULT_OPTIONS, ...config }
  const state = createScrollState(wrapperEl, childClass, navDotsEl, options)

  if (state.itemCount === 0) {
    console.warn('[customScroll] No child sections found for selector.', childClass)
    return () => {}
  }

  applyTransition(state.wrapperEl, state.options.scrollDelay, state.options.transitionTiming)

  const navDotsCleanup = setupNavDots(state, index => jumpToIndex(state, index))

  updateActiveState(state)

  const removeEvents = setupEventHandlers(state)

  return () => {
    removeEvents()
    navDotsCleanup()
  }
}


