<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '@/store/userstore';
import { useRouter } from 'vue-router';
import AppBrand from '../components/AppBrand.vue';
import LangSelector from '../components/LangSelector.vue';

const userStore = useUserStore();
const router = useRouter();
const isMenuOpen = ref(false);

// IMPORTANTE: Sacamos los datos de Pinia, no de otro .vue
const nombreUsuario = computed(() => userStore.userName);
const nombreVivienda = computed(() => userStore.viviendaNombre);
const userRole = computed(() => userStore.userRole);

const logout = () => {
  localStorage.clear();
  userStore.$reset();
  router.push('/login');
};

const getInitials = (name: string) => {
  if (!name || name === 'Usuario') return 'U';
  return name.trim().substring(0, 2).toUpperCase();
};
</script>

<template>
  <div class="app-wrapper">
    <button class="mobile-toggle" @click="isMenuOpen = !isMenuOpen">
      {{ isMenuOpen ? '✕' : '☰' }}
    </button>

    <aside :class="['sidebar', { 'mobile-open': isMenuOpen }]">
      <div class="logo-container">
        <AppBrand :width="200" class="brand-logo"/>
      </div>
      
      <nav class="nav-links">
        <router-link to="/app/dashboard" class="nav-item" @click="isMenuOpen = false">
          <span class="icon">📊</span> Dashboard
        </router-link>
        
        <router-link to="/app/incidencias" class="nav-item" @click="isMenuOpen = false">
          <span class="icon">⚠️</span> Incidencias
        </router-link>
        
        <router-link to="/app/anuncios" class="nav-item" @click="isMenuOpen = false">
          <span class="icon">📢</span> Tablón
        </router-link>

        <router-link to="/app/comunes" class="nav-item" @click="isMenuOpen = false">
          <span class="icon">🌳</span> Zonas Comunes
        </router-link>

        <router-link to="/app/pagos" class="nav-item" @click="isMenuOpen = false">
          <span class="icon">💳</span> Pagos
        </router-link>
        
        <router-link to="/app/documentos" class="nav-item" @click="isMenuOpen = false">
          <span class="icon">📄</span> Documentos
        </router-link>

        <div v-if="userRole === 'admin'" class="admin-section">
          <div class="divider">ADMINISTRACIÓN</div>
          <router-link to="/app/admin/vecinos" class="nav-item" @click="isMenuOpen = false">
            <span class="icon">👥</span> Gestión Vecinos
          </router-link>
          <router-link to="/app/admin/fincas" class="nav-item" @click="isMenuOpen = false">
            <span class="icon">🏢</span> Configurar Fincas
          </router-link>
        </div>

        <div class="sidebar-footer">
          <div class="user-profile-mini">
            <span class="avatar-mini">{{ getInitials(nombreUsuario) }}</span>
            <div class="user-info-mini">
              <span class="name-mini">{{ nombreUsuario }}</span>
              <small class="vivienda-mini">{{ nombreVivienda }}</small>
            </div>
          </div>
        </div>
      </nav>
    </aside>

    <main class="main-content">
      <router-view />
    </main>

    <div v-if="isMenuOpen" class="overlay" @click="isMenuOpen = false"></div>
  </div>
</template>

<style scoped>
/* ESTRUCTURA PRINCIPAL */
.app-wrapper {
  display: flex;
  /* Fijamos la altura al tamaño de la ventana */
  height: 100vh; 
  width: 100vw;
  overflow: hidden; /* Evita que toda la página haga scroll */
  background-color: #f4f7f6; 
  position: fixed; /* Opcional: fija el contenedor a la pantalla */
    top: 0;
     left: 0;
}

/* SIDEBAR (ESCRITORIO) */
.sidebar {
  width: 260px;
  min-width: 260px; 
  max-width: 260px;
  height: 100vh;
  background-color: #FEEBC6;
  display: flex;
  flex-direction: column;
  padding: 20px;
  transition: all 0.3s ease;
  z-index: 100;
  flex-shrink: 0; /* Evita que la barra se encoja */
  overflow-x: hidden;
  overflow-y: auto; /* Si tienes muchos links, el sidebar tendrá su propio scroll */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.sidebar::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}

.logo-container {
  text-align: center;
  margin-bottom: 30px;
  padding: 10px;
  user-select: none;
  pointer-events: none;
  outline: none;
  -webkit-user-select: none;
}
/* NAVEGACIÓN */
.nav-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1; /* Esto permite que el contenido crezca y empuje el footer al fondo */
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  color: #a0a0b8;
  text-decoration: none;
  border-radius: 10px;
  transition: 0.3s;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  font-size: 0.92rem;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.router-link-active {
  background-color: #ff8c00 !important;
  color: white !important;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.2);
}

.icon { margin-right: 12px; font-size: 1.1rem; }

/* SECCIÓN ADMINISTRACIÓN */
.admin-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.divider {
  font-size: 0.65rem;
  font-weight: bold;
  color: #636e72;
  margin-bottom: 10px;
  padding-left: 15px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* FOOTER DEL SIDEBAR (PERFIL Y LOGOUT) */
.sidebar-footer {
  margin-top:0%; /* Empuja el perfil abajo del todo */
  padding-top: 40px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-left: 40px;
}

.user-profile-mini {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  margin-bottom: 10px;
}

.avatar-mini {
  width: 35px;
  height: 35px;
  background: #ff8c00;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: bold;
  flex-shrink: 0;
}

.user-info-mini {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.name-mini { 
  font-size: 0.88rem; 
  font-weight: 600; 
  white-space: nowrap; 
  text-overflow: ellipsis; 
  overflow: hidden; 
}

.vivienda-mini { 
  font-size: 0.72rem; 
  color: #a0a0b8; 
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.logout-link {
  width: 100%;
  background: transparent;
  border: none;
  color: #ff6b6b;
  padding: 10px 15px;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  border-radius: 8px;
  transition: 0.3s;
}

.logout-link:hover { 
  background: rgba(255, 107, 107, 0.1); 
}

/* CONTENIDO PRINCIPAL */
.main-content { 
  flex: 1; 
  display: flex;
  flex-direction: column;
  /* AQUÍ ESTÁ EL TRUCO: Solo esta zona tiene scroll */
  height: 100vh;
  overflow-y: auto; 
  position: relative; 
}
.main-content::-webkit-scrollbar {
  width: 8px;
}
.main-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

/* BOTÓN HAMBURGUESA (OCULTO EN PC) */
.mobile-toggle {
  display: none; 
}

/* --- MÓVIL (PANTALLAS PEQUEÑAS) --- */
@media (max-width: 768px) {
  .sidebar { 
    position: fixed; 
    left: -260px; 
    height: 100vh; 
    width: 260px;
  }
  
  .sidebar.mobile-open { 
    left: 0; 
  }

  .mobile-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed; 
    top: 15px; 
    right: 15px; 
    z-index: 1000;
    background: #FFA040; 
    color: white; 
    border: none; 
    padding: 10px; 
    width: 40px;
    height: 40px;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  }

  .overlay { 
    position: fixed; 
    inset: 0; 
    background: rgba(0,0,0,0.5); 
    backdrop-filter: blur(2px);
    z-index: 90; 
  }
}
</style>