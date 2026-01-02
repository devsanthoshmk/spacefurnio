

export const scroller = (wrapper,child_class, navDotsContainer) => {
  const wrapperEl = wrapper.value
  const navDotsEl = navDotsContainer?.value || null

  // initialize child elements and counts
  let child_elms = Array.from(wrapperEl.querySelectorAll("."+child_class))
  let itemCount = child_elms.length
  console.log('Initialized with', itemCount, 'sections.',child_elms)
  let viewportHeight = window.innerHeight || document.documentElement.clientHeight
  let maxOffset = 0
  let minOffset = -(wrapperEl.scrollHeight - viewportHeight)
  let offset = 0
  let currentIndex = 0
  let lastScrollTime = 0
  const scrollDelay = 400 // milliseconds

  wrapperEl.style.transition = `transform ${scrollDelay}ms cubic-bezier(0.5, 0, 0.2, 1)`

  function createNavDots() {
    navDotsEl.innerHTML = ''
    for (let i = 0; i < itemCount; i++) {
      const dot = document.createElement('div')
      dot.classList.add('dot')
      dot.addEventListener('click', () => {
        let heights = 0
        child_elms.slice(0, i).forEach(section => {
          heights += section.offsetHeight
        })
        offset = -heights
        wrapperEl.style.transform = `translateY(${offset}px)`
        currentIndex = i
        highlightActiveSection()
      })
      navDotsEl.appendChild(dot)
    }
  }

  function highlightActiveSection() {
    child_elms.forEach((section, index) => {
      if (index === currentIndex) {
        section.classList.add('active')
      } else {
        section.classList.remove('active')
      }
    })

    if (navDotsEl) {
      const dots = document.querySelectorAll('.dot')
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex)
      })
    }
  }

  function scrollUp() {
    const now = Date.now()
    if (now - lastScrollTime < scrollDelay) return

    if (currentIndex === 0 && offset >= maxOffset) {
      const h = child_elms[currentIndex].offsetHeight;
      console.log('At top boundary, cannot scroll up further. Current height:', h);
      wrapperEl.style.transform = `translateY(${offset + 100}px)`
      lastScrollTime = now
      setTimeout(() => {
        wrapperEl.style.transform = `translateY(${offset}px)`
        lastScrollTime = now
      }, 250)
      return
    }

    const rect = child_elms[currentIndex].getBoundingClientRect()
    console.log('Current rect in scrollup:', rect)

    if (rect.top < 0) {
      const scrollAmount = Math.min(viewportHeight, Math.abs(rect.top))
      offset += scrollAmount
      console.log('Scrolling up within section, offset:', offset)
      wrapperEl.style.transform = `translateY(${offset}px)`
      lastScrollTime = now
      return
    }

    if (currentIndex > 0) {
      const h = child_elms[currentIndex - 1].offsetHeight

      if (h > viewportHeight) {
        offset += viewportHeight
      } else {
        offset += h
      }

      wrapperEl.style.transform = `translateY(${offset}px)`
      currentIndex = Math.max(0, currentIndex - 1)
      highlightActiveSection()
      lastScrollTime = now
    }
  }

  function scrollDown() {
    const now = Date.now()
    if (now - lastScrollTime < scrollDelay) return

    const h = child_elms[currentIndex].offsetHeight
    console.log('Current index:', currentIndex, 'Item count:', itemCount, 'Height:', h, "offset:", offset)

    if (currentIndex === itemCount - 1 && offset <= minOffset) {
      wrapperEl.style.transform = `translateY(${offset - 100}px)`
      lastScrollTime = now
      setTimeout(() => {
        wrapperEl.style.transform = `translateY(${offset}px)`
        lastScrollTime = now
      }, 250)
      return
    }

    const rect = child_elms[currentIndex].getBoundingClientRect()
    console.log('Current rect:', rect)

    if (rect.bottom > viewportHeight) {
      const scrollAmount = Math.min(viewportHeight, rect.bottom - viewportHeight)
      offset -= scrollAmount
      console.log('Scrolling down within section, offset:', offset)
      wrapperEl.style.transform = `translateY(${offset}px)`
      lastScrollTime = now
      return
    }

    if (currentIndex < itemCount - 1) {
      const nextH = child_elms[currentIndex + 1].offsetHeight

      if (nextH > viewportHeight) {
        offset -= viewportHeight
      } else {
        offset -= nextH
      }

      wrapperEl.style.transform = `translateY(${offset}px)`
      currentIndex = Math.min(itemCount - 1, currentIndex + 1)
      highlightActiveSection()
      lastScrollTime = now
    }
  }
  if (navDotsEl) {
    createNavDots()
  }
  highlightActiveSection()

  // Wheel
  const wheelHandler = function (e) {
    e.preventDefault()
    e.stopPropagation()
    if (e.deltaY < 0) {
      scrollUp()
    } else {
      scrollDown()
    }
  }

  wrapperEl.addEventListener('wheel', wheelHandler, { passive: false })

  // Touch
  let touchStartY = 0
  const touchStartHandler = function (e) {
    touchStartY = e.touches[0].clientY
  }

  const touchMoveHandler = function (e) {
    e.preventDefault()
    e.stopPropagation()
    const touchY = e.touches[0].clientY
    const deltaY = touchStartY - touchY

    if (Math.abs(deltaY) > 30) {
      if (deltaY > 0) {
        scrollDown()
      } else {
        scrollUp()
      }
      touchStartY = touchY
    }
  }

  wrapperEl.addEventListener('touchstart', touchStartHandler, { passive: true })
  wrapperEl.addEventListener('touchmove', touchMoveHandler, { passive: false })

  // Keyboard
  const keyHandler = function (e) {
    e.stopPropagation()
    switch (e.key) {
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault()
        scrollUp()
        break
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault()
        scrollDown()
        break
      case 'Home':
        e.preventDefault()
        offset = maxOffset
        wrapperEl.style.transform = `translateY(${offset}px)`
        currentIndex = 0
        highlightActiveSection()
        break
      case 'End':
        e.preventDefault()
        offset = minOffset
        wrapperEl.style.transform = `translateY(${offset}px)`
        currentIndex = itemCount - 1
        highlightActiveSection()
        break
    }
  }

  document.addEventListener('keydown', keyHandler)

  // cleanup on unmount
  const cleanup = () => {
    wrapperEl.removeEventListener('wheel', wheelHandler)
    wrapperEl.removeEventListener('touchstart', touchStartHandler)
    wrapperEl.removeEventListener('touchmove', touchMoveHandler)
    document.removeEventListener('keydown', keyHandler)
    // nav dots click listeners removed with container cleanup on unmount
  }
  return cleanup
}
