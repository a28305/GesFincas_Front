<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from '@/store/userstore';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();

const nombreUsuario = computed(() => userStore.userName || 'Usuario');
const nombreVivienda = computed(() => userStore.viviendaNombre || 'Mi Comunidad');
const rolUsuario = computed(() => userStore.userRole || 'vecino');
const userEmail = localStorage.getItem('userEmail') || 'No disponible';
const userId = localStorage.getItem('userId') || '-';

const mostrarPerfil = ref(false);

const getInitials = (name: string) => {
  if (!name || name === 'Usuario') return 'U';
  return name.trim().substring(0, 2).toUpperCase();
};

function cerrarSesion(): void {
  localStorage.clear();
  userStore.$reset();
  router.push('/login');
}
</script>

<template>
  <header class="main-header">
    <div class="welcome-section">
      <h1>{{ nombreVivienda }}</h1>
      <p>Bienvenido de nuevo, <strong>{{ nombreUsuario }}</strong></p>
    </div>

    <div class="profile-pill" @click="mostrarPerfil = true">
      <div class="user-text">
        <span class="u-name">{{ nombreUsuario }}</span>
        <small class="vivienda-tag">{{ nombreVivienda }}</small>
      </div>
      <span class="avatar">{{ getInitials(nombreUsuario) }}</span>
    </div>

    <!-- MODAL PERFIL -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="mostrarPerfil" class="perfil-overlay" @click.self="mostrarPerfil = false">
          <div class="perfil-card">
            <button class="perfil-close" @click="mostrarPerfil = false">✕</button>
            
            <div class="perfil-avatar-section">
              <div class="perfil-avatar">{{ getInitials(nombreUsuario) }}</div>
              <h3>{{ nombreUsuario }}</h3>
              <span :class="['perfil-role', rolUsuario === 'admin' ? 'role-admin' : 'role-vecino']">
                {{ rolUsuario === 'admin' ? 'Administrador' : 'Vecino' }}
              </span>
            </div>

            <div class="perfil-info">
              <div class="perfil-row">
                <span class="perfil-label">📧 Email</span>
                <span class="perfil-value">{{ userEmail}}</span>
              </div>
              <div class="perfil-row">
                <span class="perfil-label">🏢 Comunidad</span>
                <span class="perfil-value">{{ nombreVivienda }}</span>
              </div>
              <div class="perfil-row">
                <span class="perfil-label">🔑 ID Usuario</span>
                <span class="perfil-value">#{{userId}}</span>
              </div>
            </div>

            <div class="perfil-actions">
              <button class="btn-cerrar-sesion" @click="cerrarSesion">🚪 Cerrar Sesión</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<style scoped>
.main-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 30px; background: transparent; margin-bottom: 20px; }
.welcome-section h1 { font-size: 1.5rem; color: #1a1a2e; margin: 0; }
.welcome-section p { color: #7f8c8d; margin: 5px 0 0 0; font-size: 0.9rem; }
.profile-pill { background: white; padding: 8px 20px; border-radius: 50px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); cursor: pointer; transition: 0.2s; }
.profile-pill:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.1); transform: translateY(-1px); }
.user-text { display: flex; flex-direction: column; text-align: right; }
.u-name { font-weight: 700; font-size: 0.9rem; color: #2c3e50; }
.vivienda-tag { font-size: 0.72rem; color: #95a5a6; }
.avatar { width: 40px; height: 40px; background: #ff8c00; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; }

/* MODAL PERFIL */
.perfil-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.perfil-card { background: white; width: 100%; max-width: 380px; border-radius: 24px; padding: 36px; box-shadow: 0 25px 60px rgba(0,0,0,0.2); position: relative; }
.perfil-close { position: absolute; top: 16px; right: 16px; background: #f3f4f6; border: none; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; }
.perfil-close:hover { background: #e5e7eb; }

.perfil-avatar-section { text-align: center; margin-bottom: 28px; }
.perfil-avatar { width: 72px; height: 72px; background: #ff8c00; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.5rem; margin: 0 auto 14px; }
.perfil-avatar-section h3 { margin: 0 0 8px 0; font-size: 1.2rem; color: #1a1a2e; }
.perfil-role { padding: 4px 16px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; }
.role-admin { background: #fff3e0; color: #ff8c00; }
.role-vecino { background: #e3f2fd; color: #3b82f6; }

.perfil-info { margin-bottom: 24px; }
.perfil-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #f3f4f6; }
.perfil-row:last-child { border-bottom: none; }
.perfil-label { font-size: 0.85rem; color: #6b7280; }
.perfil-value { font-size: 0.88rem; color: #1a1a2e; font-weight: 600; }

.perfil-actions { display: flex; flex-direction: column; gap: 10px; }
.btn-cerrar-sesion { width: 100%; padding: 14px; background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; border-radius: 30px; font-weight: 700; font-size: 0.92rem; cursor: pointer; transition: 0.2s; }
.btn-cerrar-sesion:hover { background: #fee2e2; }

.modal-enter-active { animation: modalIn 0.3s ease; }
.modal-leave-active { animation: modalIn 0.2s ease reverse; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

@media (max-width: 768px) { .main-header { padding: 15px; flex-direction: column; align-items: flex-start; gap: 15px; } .profile-pill { align-self: flex-end; } }
</style>