<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import { useUserStore } from '@/store/userstore';
import { useUiStore } from '@/store/Uistore';
import axios from 'axios';
import '@/assets/icomoon/icomoon.css';

const userStore = useUserStore();
const ui = useUiStore();

const guardandoNombre = ref(false);
const guardandoPassword = ref(false);

const nombre = ref(userStore.userName || '');
const email = ref(localStorage.getItem('userEmail') || '');
const rol = computed(() => userStore.userRole || 'vecino');
const comunidad = computed(() => userStore.viviendaNombre || '-');
const userId = localStorage.getItem('userId') || '-';

// ── Cargar email desde el backend si no está en localStorage ──
async function cargarEmail() {
  if (email.value) return;
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`https://localhost:7152/api/Users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const correo = res.data.email ?? res.data.Email ?? '';
    email.value = correo;
    if (correo) localStorage.setItem('userEmail', correo);
  } catch { /* silencioso, no crítico */ }
}

// ── Cambio de nombre ──
const nuevoNombre = ref('');
const editandoNombre = ref(false);

async function guardarNombre() {
  if (!nuevoNombre.value.trim()) {
    ui.warn('Campo vacío', 'El nombre no puede estar vacío');
    return;
  }
  guardandoNombre.value = true;
  try {
    const token = localStorage.getItem('token');
    await axios.patch(
      `https://localhost:7152/api/Users/${userId}/nombre`,
      JSON.stringify(nuevoNombre.value.trim()),
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    userStore.setUserData(nuevoNombre.value.trim(), userStore.userRole);
    nombre.value = nuevoNombre.value.trim();
    editandoNombre.value = false;
    ui.success('Nombre actualizado', 'Tu nombre se ha guardado correctamente');
  } catch (err: any) {
    ui.error('Error', err.response?.data?.error || 'No se pudo actualizar el nombre');
  } finally {
    guardandoNombre.value = false;
  }
}

// ── Cambio de contraseña ──
const passActual = ref('');
const passNueva = ref('');
const passConfirm = ref('');
const mostrarPassActual = ref(false);
const mostrarPassNueva = ref(false);
const mostrarPassConfirm = ref(false);

const passSeguridad = computed(() => {
  const p = passNueva.value;
  if (!p) return { nivel: 0, texto: '', color: '' };
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const niveles = [
    { nivel: 1, texto: 'Débil',   color: '#ef4444' },
    { nivel: 2, texto: 'Regular', color: '#f59e0b' },
    { nivel: 3, texto: 'Buena',   color: '#3b82f6' },
    { nivel: 4, texto: 'Fuerte',  color: '#22c55e' },
  ];
  return niveles[Math.min(score, 4) - 1] ?? { nivel: 0, texto: '', color: '' };
});

async function guardarPassword() {
  if (!passActual.value || !passNueva.value || !passConfirm.value) {
    ui.warn('Campos vacíos', 'Rellena todos los campos de contraseña');
    return;
  }
  if (passNueva.value !== passConfirm.value) {
    ui.error('Error', 'Las contraseñas nuevas no coinciden');
    return;
  }
  if (passNueva.value.length < 4) {
    ui.warn('Contraseña débil', 'La contraseña debe tener al menos 4 caracteres');
    return;
  }
  guardandoPassword.value = true;
  try {
    const token = localStorage.getItem('token');
    await axios.patch(
      `https://localhost:7152/api/Users/${userId}/password`,
      { passwordActual: passActual.value, passwordNueva: passNueva.value },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    passActual.value = '';
    passNueva.value = '';
    passConfirm.value = '';
    ui.success('Contraseña actualizada', 'Tu contraseña se ha cambiado correctamente');
  } catch (err: any) {
    ui.error('Error', err.response?.data?.error || 'Contraseña actual incorrecta');
  } finally {
    guardandoPassword.value = false;
  }
}

function getInitials(name: string): string {
  const n = String(name || 'U').trim();
  const parts = n.split(' ');
  if (parts.length >= 2 && parts[0] && parts[1]) return (parts[0][0]! + parts[1][0]!).toUpperCase();
  return n.substring(0, 2).toUpperCase();
}

onMounted(async () => {
  nombre.value = userStore.userName || '';
  nuevoNombre.value = userStore.userName || '';
  await cargarEmail();
});
</script>

<template>
  <div class="perfil-page">
    <Header />

    <div class="perfil-content">

      <!-- Hero -->
      <div class="perfil-hero">
        <div class="avatar-grande">{{ getInitials(nombre) }}</div>
        <div class="hero-info">
          <h2>{{ nombre }}</h2>
          <span :class="['rol-badge', rol === 'admin' ? 'rol-admin' : 'rol-vecino']">
            {{ rol === 'admin' ? 'Administrador' : 'Vecino' }}
          </span>
          <p class="hero-comunidad">{{ comunidad }}</p>
        </div>
      </div>

      <div class="perfil-grid">

        <!-- Información personal -->
        <div class="card">
          <div class="card-title"><i class="icon-users card-icon"></i> Información Personal</div>
          <div class="info-rows">
            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">{{ email || 'No disponible' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Comunidad</span>
              <span class="info-value">{{ comunidad }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Rol</span>
              <span :class="['info-value', 'rol-pill', rol === 'admin' ? 'rol-admin' : 'rol-vecino']">
                {{ rol === 'admin' ? 'Administrador' : 'Vecino' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Cambiar nombre -->
        <div class="card">
          <div class="card-title"><i class="icon-wrench1 card-icon"></i> Cambiar Nombre</div>

          <div v-if="!editandoNombre" class="nombre-display">
            <div class="nombre-actual">
              <span class="nombre-text">{{ nombre }}</span>
              <button class="btn-editar" @click="editandoNombre = true"><i class="icon-wrench1"></i> Editar</button>
            </div>
            <p class="card-hint">Este nombre aparece en el chat y las incidencias.</p>
          </div>

          <div v-else class="nombre-edit">
            <div class="input-group">
              <label>Nuevo nombre <span class="req">*</span></label>
              <input v-model="nuevoNombre" type="text" class="form-input"
                placeholder="Tu nombre completo" maxlength="50"
                @keydown.enter="guardarNombre" @keydown.escape="editandoNombre = false" />
              <small class="char-count">{{ nuevoNombre.length }}/50</small>
            </div>
            <div class="btn-row">
              <button class="btn-cancel" @click="editandoNombre = false; nuevoNombre = nombre">Cancelar</button>
              <button class="btn-save" @click="guardarNombre" :disabled="guardandoNombre">
                {{ guardandoNombre ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Cambiar contraseña -->
        <div class="card card-full">
          <div class="card-title"><i class="icon-lock card-icon"></i> Cambiar Contraseña</div>
          <p class="card-hint">Necesitas tu contraseña actual para poder cambiarla.</p>

          <div class="pass-grid">
            <div class="input-group">
              <label>Contraseña actual <span class="req">*</span></label>
              <div class="pass-input-wrap">
                <input v-model="passActual" :type="mostrarPassActual ? 'text' : 'password'"
                  class="form-input" placeholder="Tu contraseña actual" />
                <button class="toggle-pass" @click="mostrarPassActual = !mostrarPassActual" type="button">
                  <i :class="mostrarPassActual  ? 'icon-unlocked' : 'icon-lock'"></i>
                </button>
              </div>
            </div>

            <div class="input-group">
              <label>Nueva contraseña <span class="req">*</span></label>
              <div class="pass-input-wrap">
                <input v-model="passNueva" :type="mostrarPassNueva ? 'text' : 'password'"
                  class="form-input" placeholder="Mínimo 4 caracteres" />
                <button class="toggle-pass" @click="mostrarPassNueva = !mostrarPassNueva" type="button">
                  <i :class="mostrarPassNueva   ? 'icon-unlocked' : 'icon-lock'"></i>
                </button>
              </div>
              <div v-if="passNueva" class="seguridad-bar">
                <div class="bar-track">
                  <div class="bar-fill"
                    :style="{ width: (passSeguridad.nivel / 4 * 100) + '%', background: passSeguridad.color }">
                  </div>
                </div>
                <span class="seguridad-label" :style="{ color: passSeguridad.color }">
                  {{ passSeguridad.texto }}
                </span>
              </div>
            </div>

            <div class="input-group">
              <label>Confirmar contraseña <span class="req">*</span></label>
              <div class="pass-input-wrap">
                <input v-model="passConfirm" :type="mostrarPassConfirm ? 'text' : 'password'"
                  class="form-input"
                  :class="{ 'input-error': passConfirm && passNueva !== passConfirm, 'input-ok': passConfirm && passNueva === passConfirm }"
                  placeholder="Repite la nueva contraseña" />
                <button class="toggle-pass" @click="mostrarPassConfirm = !mostrarPassConfirm" type="button">
                  <i :class="mostrarPassConfirm ? 'icon-unlocked' : 'icon-lock'"></i>
                </button>
              </div>
              <small v-if="passConfirm && passNueva !== passConfirm" class="error-hint">Las contraseñas no coinciden</small>
              <small v-else-if="passConfirm && passNueva === passConfirm" class="ok-hint">Las contraseñas coinciden</small>
            </div>
          </div>

          <button class="btn-save btn-pass" @click="guardarPassword"
            :disabled="guardandoPassword || !passActual || !passNueva || !passConfirm">
            {{ guardandoPassword ? 'Guardando...' : 'Cambiar Contraseña' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.perfil-page { background: var(--bg-app, #f4f7f6); min-height: 100vh; display: flex; flex-direction: column; }
.perfil-content { padding: 0 28px 32px; flex: 1; }

.perfil-hero { background: var(--bg-card, white); border-radius: 20px; padding: 28px 32px; display: flex; align-items: center; gap: 24px; margin-bottom: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
.avatar-grande { width: 80px; height: 80px; background: linear-gradient(135deg, #ff8c00, #ffb347); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.8rem; font-weight: 800; flex-shrink: 0; }
.hero-info h2 { margin: 0 0 8px 0; font-size: 1.4rem; color: var(--text-primary, #1a1a2e); }
.hero-comunidad { margin: 6px 0 0 0; font-size: 0.85rem; color: #9ca3af; }
.rol-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; }
.rol-admin { background: rgba(255, 140, 0, 0.2); color: #ff8c00; border: 1px solid rgba(255,140,0,0.4); }
.rol-vecino { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59,130,246,0.4); }

.perfil-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.card-full { grid-column: 1 / -1; }

.card { background: var(--bg-card, white); border-radius: 20px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
.card-title { font-size: 1rem; font-weight: 700; color: var(--text-primary, #1a1a2e); margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
.card-hint { font-size: 0.82rem; color: #9ca3af; margin: 0 0 16px 0; }

.info-rows { display: flex; flex-direction: column; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--border-color, #f3f4f6); }
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 0.85rem; color: var(--text-muted, #6b7280); }
.info-value { font-size: 0.88rem; color: var(--text-primary, #1a1a2e); font-weight: 600; }
.rol-pill { padding: 3px 12px; border-radius: 20px; font-size: 0.78rem !important; }

.nombre-display { display: flex; flex-direction: column; gap: 12px; }
.nombre-actual { display: flex; justify-content: space-between; align-items: center; background: var(--bg-app, #f9fafb); border-radius: 12px; padding: 14px 16px; }
.nombre-text { font-size: 1rem; font-weight: 600; color: var(--text-primary, #1a1a2e); }
.btn-editar { background: none; border: 1px solid var(--border-color, #e5e7eb); padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 0.82rem; color: var(--text-muted, #6b7280); transition: all 0.15s; }
.btn-editar:hover { border-color: #ff8c00; color: #ff8c00; }

.input-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.input-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-primary, #374151); }
.req { color: #ff8c00; }
.char-count { font-size: 0.72rem; color: #9ca3af; text-align: right; }
.form-input {
  width: 100%; padding: 12px 16px; border-radius: 12px;
  border: 1.5px solid var(--border-color, #e5e7eb);
  background: var(--bg-app, #fafafa);
  color: var(--text-primary, #1a1a2e);
  font-family: inherit; font-size: 0.92rem; outline: none;
  box-sizing: border-box; transition: border-color 0.2s;
}
.form-input:focus { border-color: #ff8c00; background: var(--bg-card, white); }
.input-error { border-color: #ef4444 !important; }
.input-ok { border-color: #22c55e !important; }
.error-hint { font-size: 0.75rem; color: #ef4444; }
.ok-hint { font-size: 0.75rem; color: #22c55e; }

.pass-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
.pass-input-wrap { position: relative; }
.pass-input-wrap .form-input { padding-right: 46px; }
.toggle-pass { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0; }
.seguridad-bar { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
.bar-track { flex: 1; height: 4px; background: var(--border-color, #e5e7eb); border-radius: 2px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 2px; transition: width 0.3s, background 0.3s; }
.seguridad-label { font-size: 0.73rem; font-weight: 700; width: 50px; }

.btn-row { display: flex; gap: 10px; }
.btn-cancel { flex: 1; padding: 12px; background: var(--bg-app, #f3f4f6); border: none; border-radius: 12px; font-weight: 600; cursor: pointer; color: var(--text-muted, #6b7280); }
.btn-cancel:hover { background: var(--border-color, #e5e7eb); }
.btn-save { flex: 1; padding: 12px; background: #ff8c00; color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; }
.btn-save:hover:not(:disabled) { background: #e67e00; }
.btn-save:disabled { background: var(--border-color, #d1d5db); color: var(--text-muted, #6b7280); cursor: not-allowed; }
.btn-pass { width: 100%; border-radius: 30px; padding: 15px; font-size: 0.95rem; flex: unset; }


/* ── Icomoon icons ── */
.card-icon { font-size: 1rem; color: #ff8c00; flex-shrink: 0; }
.il { font-size: 0.85rem; color: #ff8c00; margin-right: 4px; vertical-align: middle; }
.toggle-pass i { font-size: 0.9rem; color: var(--text-muted, #9ca3af); }
.toggle-pass:hover i { color: #ff8c00; }
.btn-editar i { font-size: 0.8rem; margin-right: 4px; }

/* ── Dark mode: bg-input variable ── */
:root { --bg-input: #fafafa; }

:global(.dark-theme) .form-input { background: #2a2d3e !important; color: #e2e8f0 !important; border-color: #3a3d4e !important; }
:global(.dark-theme) .form-input::placeholder { color: #64748b !important; }

@media (max-width: 900px) { .perfil-grid { grid-template-columns: 1fr; } .card-full { grid-column: auto; } .pass-grid { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .perfil-content { padding: 0 14px 24px; } .perfil-hero { flex-direction: column; text-align: center; } }
</style>