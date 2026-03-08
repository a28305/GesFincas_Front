import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import 'primeicons/primeicons.css'
import './assets/dark-theme.css'

import App from './App.vue'
import router from './router'
import i18n from './i18n'

// Aplicar dark mode al cargar si estaba activado
if (localStorage.getItem('darkMode') === 'true') {
  document.documentElement.classList.add('dark-theme')
}

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark-theme'
    }
  }
})

app.mount('#app')