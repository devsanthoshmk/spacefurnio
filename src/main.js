import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'

// v4+ static themes live here:
import Lara from '@primeuix/themes/lara'
import AnimateOnScroll from 'primevue/animateonscroll'

// main.js or main.ts
import 'primeicons/primeicons.css'

// import AOS from 'aos'
// import 'aos/dist/aos.css' // Import AOS CSS

// // In your main Vue file, within the app initialization
// AOS.init()

const app = createApp(App)
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Lara,
    options: {
      prefix: 'p',
      darkModeSelector: 'light',
      cssLayer: false,
    },
  },
})

app.directive('animateonscroll', AnimateOnScroll)

app.mount('#app')
