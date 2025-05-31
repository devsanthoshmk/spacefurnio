import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import AOS from 'aos'
import 'aos/dist/aos.css'
import './style.css'

const app = createApp(App)

app.use(PrimeVue)
app.mount('#app')

// Initialize AOS
AOS.init({
  duration: 1200,
  easing: 'ease-out-cubic',
  once: true,
  offset: 100,
})
