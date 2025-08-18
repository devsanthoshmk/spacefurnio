<script setup>
import { RouterView, useRoute } from 'vue-router'
import { ref, onMounted, onUnmounted, watch } from 'vue'
import NavComponent from './components/Nav-component.vue'
import FooterComponent from './components/Footer-component.vue'

const route = useRoute()
const showNav = ref(false)

const handleScroll = () => {
  const scrollY = window.scrollY
  const screenHeight = window.innerHeight
  showNav.value = scrollY >= screenHeight * 0.2
}

function setupScrollForHome() {
  window.addEventListener('scroll', handleScroll)
  handleScroll() // check once on load
}

function cleanupScroll() {
  window.removeEventListener('scroll', handleScroll)
}

// ✅ run once on mount
onMounted(() => {
  if (route.path === '/') {
    setupScrollForHome()
  } else {
    showNav.value = true
  }
})

// ✅ clean up
onUnmounted(() => {
  cleanupScroll()
})

// ✅ react when route changes (SPA navigation)
watch(
  () => route.path,
  (newPath) => {
    cleanupScroll()
    if (newPath === '/') {
      setupScrollForHome()
    } else {
      showNav.value = true
    }
  }
)

</script>


<template>
  <header>
    <NavComponent v-if="showNav" />
  </header>

  <main>
    <RouterView />
  </main>

  <footer>
    <FooterComponent />
  </footer>

</template>

