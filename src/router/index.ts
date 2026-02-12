import { createRouter, createWebHistory } from 'vue-router'
// Importamos el componente de Login que creamos antes
import Loging from '../views/Loging.vue'
import Register from '@/views/Register.vue'
import Select_piso from '@/views/Select_piso.vue'

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
     {
      path: '/Select_piso',
      name: 'Select_piso',
      component: Select_piso
    },

  ]
})

export default router