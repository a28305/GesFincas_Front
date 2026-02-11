import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router) // Aquí es donde se activa el "GPS" de tu web

app.mount('#app')