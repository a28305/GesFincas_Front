import { createRouter, createWebHistory } from 'vue-router'
import Loging from '../views/Loging.vue'
import Register from '@/views/Register.vue'
import Select_piso from '@/views/Select_piso.vue'
// IMPORTANTE: Importa el Layout y las vistas nuevas
import MainLayout from '../components/MainLayout.vue'
import Dashboard from '@/views/Dashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: Loging
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
    // RUTAS CON MENÚ LATERAL (Layout)
    {
      path: '/app', // Usamos un prefijo para agruparlas
      component: MainLayout,
      redirect: '/app/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: Dashboard,
          meta: { requiresAuth: true }
        },
        {
          path: 'incidencias',
          name: 'incidencias',
          component: () => import('@/views/Incidencias.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'anuncios',
          name: 'anuncios',
          component: () => import('@/views/Anuncios.vue'),
          meta: { requiresAuth: true }
        }
      ]
    }
  ]
})

// GUARDIA PARA EVITAR EL ERROR "NULL"
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  // Si la ruta requiere autenticación y no hay datos, al login
  if (to.meta.requiresAuth && (!token || !userId || userId === 'null')) {
    localStorage.clear();
    next('/');
  } else {
    next();
  }
});

export default router