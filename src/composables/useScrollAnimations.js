import { onMounted, onUnmounted } from 'vue'

export function useScrollAnimations() {
  let observer = null

  const initScrollAnimations = () => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    // Observe all elements with data-aos attributes
    document.querySelectorAll('[data-aos]').forEach((el) => {
      observer.observe(el)
    })
  }

  const destroyScrollAnimations = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  onMounted(() => {
    // Initialize AOS with custom settings
    if (typeof AOS !== 'undefined') {
      AOS.refresh()
    }
    initScrollAnimations()
  })

  onUnmounted(() => {
    destroyScrollAnimations()
  })

  return {
    initScrollAnimations,
    destroyScrollAnimations
  }
}
