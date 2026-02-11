import { createRouter, createWebHistory } from 'vue-router'
// Importamos el componente de Login que creamos antes
import Loging from '../views/Loging.vue'
import Register from '@/views/Register.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: Loging
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      // Esto es "Lazy Loading": carga la página solo cuando vas a ella
      component: () => import('../views/Dashboard.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: Register
    },
  ]
})

export default router