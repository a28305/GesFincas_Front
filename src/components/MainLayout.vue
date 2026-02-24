<template>
  <div class="app-wrapper">
    <button class="mobile-toggle" @click="isMenuOpen = !isMenuOpen">
      ☰
    </button>

    <aside :class="['sidebar', { 'mobile-open': isMenuOpen }]">
      <div class="logo-container">
        <img src="../assets/logo_gesfincas.png" alt="GesFincas" class="sidebar-logo">
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
        
        <div v-if="userRole === 'admin'" class="admin-section">
          <div class="divider">ADMINISTRACIÓN</div>
          <router-link to="/app/admin/vecinos" class="nav-item" @click="isMenuOpen = false">
            <span class="icon">👥</span> Gestión Vecinos
          </router-link>
          <router-link to="/app/admin/comunidades" class="nav-item" @click="isMenuOpen = false">
            <span class="icon">🏢</span> Comunidades
          </router-link>
        </div>
      </nav>

      <button class="logout-btn" @click="handleLogout">
        <span class="icon">🚪</span> Cerrar Sesión
      </button>
    </aside>

    <main class="main-content">
      <router-view /> 
    </main>

    <div v-if="isMenuOpen" class="overlay" @click="isMenuOpen = false"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const isMenuOpen = ref(false);
const userRole = localStorage.getItem('role');
const router = useRouter();

const handleLogout = () => {
  localStorage.clear();
  router.push('/'); // Te manda al login (que es la ruta '/')
};
</script>

<style scoped>
.app-wrapper {
  display: flex;
  min-height: 100vh;
  background-color: #f8f9fa; /* Fondo gris claro profesional */
}

.sidebar {
  width: 260px;
  background-color: #e8dab2; /* Café oscuro corporativo */
  color: white;
  display: flex;
  flex-direction: column;
  padding: 25px 15px;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 1000;
}

.sidebar-logo {
  width: 100%;
  max-width: 180px;
  margin-bottom: 30px;
  padding: 0 10px;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  color: #e0d4d1;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.3s;
  font-weight: 500;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

/* Estilo para la página activa */
.router-link-active {
  background-color: #ff8c00 !important; /* Naranja corporativo */
  color: white !important;
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3);
}

.icon {
  margin-right: 12px;
  font-size: 1.2rem;
}

.admin-section {
  margin-top: 20px;
}

.divider {
  font-size: 0.7rem;
  font-weight: bold;
  color: #a1887f;
  margin-bottom: 10px;
  padding-left: 15px;
  letter-spacing: 1px;
}

.main-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.logout-btn {
  margin-top: auto;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-btn:hover {
  background: #c62828; /* Rojo al pasar el ratón */
  border-color: transparent;
}

/* RESPONSIVE MÓVIL */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -260px;
    transition: left 0.3s ease;
  }
  .sidebar.mobile-open {
    left: 0;
  }
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999;
  }
  .mobile-toggle {
    display: block;
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #ff8c00;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    color: white;
    font-size: 24px;
    border: none;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    z-index: 1001;
  }
}
</style>