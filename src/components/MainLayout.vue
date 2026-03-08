<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '@/store/userstore';
import { useRouter } from 'vue-router';
import AppBrand from '../components/AppBrand.vue';
import LangSelector from '../components/LangSelector.vue';

const userStore = useUserStore();
const router = useRouter();
const isMenuOpen = ref(false);

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
  const parts = name.trim().split(' ');
  if (parts.length >= 2 && parts[0] && parts[1]) return (parts[0][0]! + parts[1][0]!).toUpperCase();
  return name.trim().substring(0, 2).toUpperCase();
};

function irAPerfil() {
  isMenuOpen.value = false;
  router.push('/app/perfil');
}
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

        <router-link to="/app/chat" class="nav-item" @click="isMenuOpen = false">
          <span class="icon">💬</span> Chat
        </router-link>

        <router-link to="/app/proveedores" class="nav-item" @click="isMenuOpen = false">
          <span class="icon">🏪</span> Proveedores
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

        <!-- ── Perfil clickable abajo ── -->
        <div class="sidebar-footer">
          <div class="user-profile-mini" @click="irAPerfil" title="Ver mi perfil">
            <span class="avatar-mini">{{ getInitials(nombreUsuario) }}</span>
            <div class="user-info-mini">
              <span class="name-mini">{{ nombreUsuario }}</span>
              <small class="vivienda-mini">{{ nombreVivienda }}</small>
            </div>
            <span class="perfil-arrow">›</span>
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
.app-wrapper {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #f4f7f6;
  position: fixed;
  top: 0;
  left: 0;
}

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
  flex-shrink: 0;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.sidebar::-webkit-scrollbar { width: 0px; background: transparent; }

.logo-container {
  text-align: center;
  margin-bottom: 30px;
  padding: 10px;
  user-select: none;
  pointer-events: none;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
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
  color: #555;
}

.router-link-active {
  background-color: #ff8c00 !important;
  color: white !important;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.2);
}

.icon { margin-right: 12px; font-size: 1.1rem; }

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

/* ── PERFIL CLICKABLE ── */
.sidebar-footer {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.user-profile-mini {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  position: relative;
}

.user-profile-mini:hover {
  background: rgba(255, 255, 255, 0.85);
  transform: translateY(-1px);
}

.user-profile-mini:active {
  transform: translateY(0);
}

.avatar-mini {
  width: 38px;
  height: 38px;
  background: #ff8c00;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
}

.user-info-mini {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
}

.name-mini {
  font-size: 0.88rem;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  color: #1a1a2e;
}

.vivienda-mini {
  font-size: 0.72rem;
  color: #a0a0b8;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.perfil-arrow {
  font-size: 1.2rem;
  color: #ff8c00;
  font-weight: 700;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.user-profile-mini:hover .perfil-arrow {
  opacity: 1;
}

/* ── CONTENIDO PRINCIPAL ── */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
  position: relative;
}
.main-content::-webkit-scrollbar { width: 8px; }
.main-content::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }

.mobile-toggle { display: none; }

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -260px;
    height: 100vh;
    width: 260px;
  }
  .sidebar.mobile-open { left: 0; }
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