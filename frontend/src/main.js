import './assets/main.css'
import './assets/base.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura' // ✅ Aura preset (light/dark built-in)
import AnimateOnScroll from 'primevue/animateonscroll'
import ToastService from 'primevue/toastservice'

import AOS from 'aos'
import 'aos/dist/aos.css'
import 'animate.css' // be skptical
import 'primeicons/primeicons.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ToastService)
app.directive('animateonscroll', AnimateOnScroll)
app.use(PrimeVue, {
  theme: {
    preset: Aura, // Aura supports multiple color schemes (light/dark)
    options: {
      prefix: 'p',
      darkModeSelector: 'dark', // you can toggle light/dark by adding/removing "dark" class to <html>
      cssLayer: false,
    },
  },
})

app.mount('#app')

// Initialize AOS after Vue has mounted
setTimeout(() => {
  AOS.init({
    duration: 1000,
    easing: 'ease-out',
    once: true,
    offset: 100
  })
}, 100)

