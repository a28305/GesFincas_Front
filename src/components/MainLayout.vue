<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '@/store/userstore';
import { useUiStore } from '@/store/Uistore';
import { useRouter } from 'vue-router';
import AppBrand from '../components/AppBrand.vue';
import LangSelector from '../components/LangSelector.vue';

const userStore = useUserStore();
const ui = useUiStore();
const router = useRouter();
const isMenuOpen = ref(false);

const nombreUsuario = computed(() => userStore.userName);
const nombreVivienda = computed(() => userStore.viviendaNombre);
const userRole = computed(() => userStore.userRole);

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

function toggleDark() {
  ui.toggleDarkMode();
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
          <i class="icon icon-stats-dots"></i> Menu
        </router-link>
        <router-link to="/app/incidencias" class="nav-item" @click="isMenuOpen = false">
          <i class="icon icon-warning"></i> Incidencias
        </router-link>
        <router-link to="/app/anuncios" class="nav-item" @click="isMenuOpen = false">
          <i class="icon icon-bullhorn"></i> Tablón
        </router-link>
        <router-link to="/app/comunes" class="nav-item" @click="isMenuOpen = false">
          <i class="icon icon-home3"></i> Zonas Comunes
        </router-link>
        <router-link to="/app/pagos" class="nav-item" @click="isMenuOpen = false">
          <i class="icon icon-credit-card"></i> Pagos
        </router-link>
        <router-link to="/app/documentos" class="nav-item" @click="isMenuOpen = false">
          <i class="icon icon-file-text"></i> Documentos
        </router-link>
        <router-link to="/app/chat" class="nav-item" @click="isMenuOpen = false">
          <i class="icon icon-bubbles"></i> Chat
        </router-link>
        <router-link to="/app/proveedores" class="nav-item" @click="isMenuOpen = false">
          <i class="icon icon-wrench"></i> Proveedores
        </router-link>

        <div v-if="userRole === 'admin'" class="admin-section">
          <div class="divider">ADMINISTRACIÓN</div>
          <router-link to="/app/admin/vecinos" class="nav-item" @click="isMenuOpen = false">
            <i class="icon icon-users"></i> Gestión Vecinos
          </router-link>
          <router-link to="/app/admin/fincas" class="nav-item" @click="isMenuOpen = false">
            <i class="icon icon-settings"></i> Configurar Fincas
          </router-link>
        </div>

        <!-- ── Toggle dark mode ── -->
        <div class="dark-toggle-wrap">
          <button class="dark-toggle" @click="toggleDark" :title="ui.darkMode ? 'Modo claro' : 'Modo oscuro'">
            <span class="toggle-track" :class="{ active: ui.darkMode }">
              <span class="toggle-thumb"><i :class="ui.darkMode ? 'icon-unlocked' : 'icon-lock'"></i></span>
            </span>
            <span class="toggle-label">{{ ui.darkMode ? 'Modo oscuro' : 'Modo claro' }}</span>
          </button>
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
@import '@/assets/icomoon/icomoon.css';
.app-wrapper {
  display: flex; height: 100vh; width: 100vw;
  overflow: hidden; background-color: var(--bg-app);
  position: fixed; top: 0; left: 0;
  transition: background-color 0.3s;
}

.sidebar {
  width: 260px; min-width: 260px; max-width: 260px; height: 100vh;
  background-color: var(--bg-sidebar);
  display: flex; flex-direction: column; padding: 20px;
  transition: background-color 0.3s, left 0.3s;
  z-index: 100; flex-shrink: 0;
  overflow-x: hidden; overflow-y: auto;
  scrollbar-width: none; -ms-overflow-style: none;
}
.sidebar::-webkit-scrollbar { width: 0; }

.logo-container { text-align: center; margin-bottom: 30px; padding: 10px; user-select: none; pointer-events: none; }

.nav-links { display: flex; flex-direction: column; gap: 6px; flex: 1; }

.nav-item {
  display: flex; align-items: center; padding: 12px 15px;
  color: var(--text-nav); text-decoration: none; border-radius: 10px;
  transition: 0.2s; border: none; background: transparent;
  width: 100%; text-align: left; font-size: 0.92rem; cursor: pointer;
}
.nav-item:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }
.router-link-active { background-color: #ff8c00 !important; color: white !important; font-weight: 600; box-shadow: 0 4px 12px rgba(255,140,0,0.25); }
.icon { margin-right: 12px; font-size: 1.1rem; display: inline-block; color: #a0522d; }
.nav-item.active .icon, .nav-item.router-link-active .icon { color: #ff8c00; }

.admin-section { margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-color); }
.divider { font-size: 0.65rem; font-weight: bold; color: var(--text-muted); margin-bottom: 10px; padding-left: 15px; letter-spacing: 1px; text-transform: uppercase; }

/* ── TOGGLE ── */
.dark-toggle-wrap { padding: 8px 4px; }
.dark-toggle {
  display: flex; align-items: center; gap: 10px;
  background: none; border: none; cursor: pointer;
  width: 100%; padding: 10px 12px; border-radius: 10px; transition: background 0.2s;
}
.dark-toggle:hover { background: rgba(255,255,255,0.08); }

.toggle-track {
  width: 44px; height: 24px; border-radius: 12px; background: #d1d5db;
  display: flex; align-items: center; padding: 2px;
  transition: background 0.3s; flex-shrink: 0;
}
.toggle-track.active { background: #ff8c00; justify-content: flex-end; }
.toggle-thumb {
  width: 20px; height: 20px; border-radius: 50%; background: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; box-shadow: 0 1px 4px rgba(0,0,0,0.2); transition: all 0.3s;
}
.toggle-label { font-size: 0.88rem; color: var(--text-nav); font-weight: 500; }

/* ── PERFIL ── */
.sidebar-footer { margin-top: auto; padding-top: 16px; border-top: 1px solid var(--border-color); }
.user-profile-mini {
  display: flex; align-items: center; gap: 12px; padding: 12px;
  background: rgba(255,255,255,0.12); border-radius: 12px; cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.user-profile-mini:hover { background: rgba(255,255,255,0.22); transform: translateY(-1px); }
.user-profile-mini:active { transform: translateY(0); }
.avatar-mini { width: 38px; height: 38px; background: #ff8c00; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: bold; color: white; flex-shrink: 0; }
.user-info-mini { display: flex; flex-direction: column; overflow: hidden; flex: 1; }
.name-mini { font-size: 0.88rem; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; color: var(--text-primary); }
.vivienda-mini { font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.perfil-arrow { font-size: 1.2rem; color: #ff8c00; font-weight: 700; flex-shrink: 0; opacity: 0; transition: opacity 0.2s; }
.user-profile-mini:hover .perfil-arrow { opacity: 1; }

/* ── MAIN ── */
.main-content {
  flex: 1; display: flex; flex-direction: column; height: 100vh; overflow-y: auto;
  background-color: var(--bg-app); transition: background-color 0.3s;
}

.mobile-toggle { display: none; }

@media (max-width: 768px) {
  .sidebar { position: fixed; left: -260px; height: 100vh; width: 260px; }
  .sidebar.mobile-open { left: 0; }
  .mobile-toggle {
    display: flex; align-items: center; justify-content: center;
    position: fixed; top: 15px; right: 15px; z-index: 1000;
    background: #ff8c00; color: white; border: none;
    padding: 10px; width: 40px; height: 40px; border-radius: 8px;
    cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  }
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(2px); z-index: 90; }
}
</style>