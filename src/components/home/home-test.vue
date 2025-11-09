<template>
  <div id="scroll-wrapper" ref="wrapper">
    <section class="section" id="section-0" style="height: 150vh;">
      <div class="image-side"
        style="background-image: url('https://picsum.photos/1200/900?image=1011'); height: 100%;"></div>
      <div class="content-side">
        <h2>Section One</h2>
        <p>Welcome to the full-page scroller. Use your mouse wheel, keyboard, or touch to navigate.</p>
      </div>
    </section>

    <section class="section" id="section-1" style="height: 150vh;">
      <div class="image-side"
        style="background-image: url('https://picsum.photos/1200/900?image=1012'); height: 100%;"></div>
      <div class="content-side">
        <h2>Section Two</h2>
        <p>The logic is identical to your original code, but we use `window.innerHeight` as the scroll distance.</p>
      </div>
    </section>

    <section>
      <section class="section" id="section-2">
        <div class="image-side" style="background-image: url('https://picsum.photos/1200/900?image=1013')">
        </div>
        <div class="content-side">
          <h2>Section Three</h2>
          <p>We use an `isScrolling` flag based on the `transitionend` event for robust control.</p>
        </div>
      </section>

      <section class="section" id="section-3">
        <div class="image-side" style="background-image: url('https://picsum.photos/1200/900?image=1014')">
        </div>
        <div class="content-side">
          <h2>Section Four</h2>
          <p>This layout also adapts to window resizing, recalculating heights and positions.</p>
        </div>
      </section>
    </section>

    <section class="section" id="section-4">
      <div class="image-side" style="background-image: url('https://picsum.photos/1200/900?image=1014')"></div>
      <div class="content-side">
        <h2>Section Four</h2>
        <p>This layout also adapts to window resizing, recalculating heights and positions.</p>
      </div>
    </section>
  </div>

  <div class="nav-dots" id="nav-dots" ref="navDotsContainer"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const wrapper = ref(null)
const navDotsContainer = ref(null)

let child_elms = []
let itemCount = 0

let offset = 0
let lastScrollTime = 0
const scrollDelay = 400
let currentIndex = 0

let viewportHeight = window.innerHeight || document.documentElement.clientHeight
let maxOffset = 0
let minOffset = 0

onMounted(() => {
  const wrapperEl = wrapper.value
  const navDotsEl = navDotsContainer.value

  // initialize child elements and counts
  child_elms = Array.from(wrapperEl.querySelectorAll('.section'))
  itemCount = child_elms.length

  viewportHeight = window.innerHeight || document.documentElement.clientHeight
  maxOffset = 0
  minOffset = -(wrapperEl.scrollHeight - viewportHeight)

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

    const dots = document.querySelectorAll('.dot')
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex)
    })
  }

  function scrollUp() {
    const now = Date.now()
    if (now - lastScrollTime < scrollDelay) return

    if (currentIndex === 0 && offset >= maxOffset) {
      const h = child_elms[currentIndex].offsetHeight
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

  createNavDots()
  highlightActiveSection()

  // Wheel
  const wheelHandler = function (e) {
    e.preventDefault()
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
  onBeforeUnmount(() => {
    wrapperEl.removeEventListener('wheel', wheelHandler)
    wrapperEl.removeEventListener('touchstart', touchStartHandler)
    wrapperEl.removeEventListener('touchmove', touchMoveHandler)
    document.removeEventListener('keydown', keyHandler)
    // nav dots click listeners removed with container cleanup on unmount
  })
})
</script>

<style scoped>
/* using the same CSS as your original */


#scroll-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.section {
  width: 100%;
  height: 100vh;
  display: flex;
  overflow: hidden;
}

.section:nth-child(odd) {
  flex-direction: row-reverse;
}

.image-side,
.content-side {
  width: 50%;
  height: 100vh;
  position: relative;
}

.image-side {
  background-size: cover;
  background-position: center;
}

.content-side {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  box-sizing: border-box;
  text-align: center;
}

.content-side h2 {
  font-size: 3rem;
  margin-bottom: 20px;
}

.content-side p {
  font-size: 1.2rem;
  max-width: 500px;
  line-height: 1.6;
}

.content-side h2,
.content-side p {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out 0.4s, transform 0.6s ease-out 0.4s;
}

.section.active .content-side h2,
.section.active .content-side p {
  opacity: 1;
  transform: translateY(0);
}

.nav-dots {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 100;
}

.dot {
  width: 12px;
  height: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border: 1px solid #fff;
  cursor: pointer;
  transition: background 0.3s;
}

.dot.active {
  background: #fff;
}
</style>
