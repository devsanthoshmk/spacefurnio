import { ref, onMounted, onUnmounted } from 'vue'

export function useParallax() {
  const parallaxElements = ref([])

  const handleScroll = () => {
    const scrolled = window.pageYOffset
    const rate = scrolled * -0.5

    parallaxElements.value.forEach((element) => {
      if (element) {
        element.style.transform = `translateY(${rate}px)`
      }
    })
  }

  const addParallaxElement = (element) => {
    if (element) {
      parallaxElements.value.push(element)
    }
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll)
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  return {
    addParallaxElement,
    handleScroll
  }
}
