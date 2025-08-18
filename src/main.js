import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura' // ✅ Aura preset (light/dark built-in)

import AOS from 'aos'
import 'aos/dist/aos.css'
import 'primeicons/primeicons.css'

const app = createApp(App)

app.use(router)
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

AOS.init()
