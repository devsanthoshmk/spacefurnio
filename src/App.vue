<template>
  <div id="app" class="font-poppins">
    <Navigation ref="navbar" />
    <BrandingSection />
    <NewArrivalsSection />
    <TaglinesSection ref="tagline"/>
    <ProjectHighlights />
    <FooterSection />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

import Navigation from './components/Navigation.vue'
import BrandingSection from './components/BrandingSection.vue'
import NewArrivalsSection from './components/NewArrivalsSection.vue'
import TaglinesSection from './components/TaglinesSection.vue'
import ProjectHighlights from './components/ProjectHighlights.vue'
import FooterSection from './components/FooterSection.vue'

// 1. Declare these refs at the top level so Vue can bind them via `ref="..."`
const navbar = ref(null)
const tagline = ref(null)

// 2. If you want a counter that increments:
let testEve = 0

const onSectionReachTop = () => {
  console.log('✅ Section reached the top!')
  testEve += 1
  if (testEve % 2 === 0) {
    navbar.value.navels.forEach((el)=>{
      el.classList.remove("text-gray-700")
      el.classList.add("text-white")
    })
  } else{
    navbar.value.navels.forEach((el)=>{
      el.classList.add("text-gray-700")
      el.classList.remove("text-white")
    })
  }
}

const onSectionPassed = () => {
  console.log('⬆️ Section scrolled past the top!')
  navbar.value.navels.forEach((el)=>{
    el.classList.remove("text-gray-700")
    el.classList.add("text-white")

  })
}

onMounted(() => {
  // 3. At this point, `tagline.value` is the child component instance
  //    and `tagline.value.whitebg` is the DOM <section> that TaglinesSection exposed.
  const sectionEl = tagline.value?.whitebg
  if (!sectionEl) {
    console.warn('⚠️  Unable to find the <section> in TaglinesSection!')
    return
  }

  // 4. Observe when that <section> hits the top and when it scrolls past
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          onSectionReachTop()
        } else if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          onSectionPassed()
        }
      })
    },
    {
      root: null,
      threshold: 0,
      rootMargin: '0px 0px -99% 0px',
    }
  )

  observer.observe(sectionEl)
})
</script>
