import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../components/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/Landing.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/Register.vue')
    },
    {
      path: '/Select_piso',
      name: 'Select_piso',
      component: () => import('@/views/Select_piso.vue')
    },
    {
      path: '/app',
      component: MainLayout,
      redirect: '/app/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/Dashboard.vue'),
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
        },
        {
          path: 'comunes',
          name: 'comunes',
          component: () => import('@/views/Comunes.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'pagos',
          name: 'pagos',
          component: () => import('@/views/Pagos.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'documentos',
          name: 'documentos',
          component: () => import('@/views/Documentos.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'admin/vecinos',
          name: 'admin-vecinos',
          component: () => import('@/views/AdminVecinos.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'admin/fincas',
          name: 'admin-fincas',
          component: () => import('@/views/AdminFincas.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');

  if (to.meta.requiresAuth && (!token || !userId || userId === 'null')) {
    localStorage.clear();
    next('/login');
  } else if (to.meta.requiresAdmin && role !== 'admin') {
    next('/app/dashboard');
  } else {
    next();
  }
})

export default router