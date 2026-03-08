<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import axios from 'axios';
import { useUiStore } from '@/store/Uistore';
import { useUserStore } from '@/store/userstore';

const ui = useUiStore();
const userStore = useUserStore();
const vecinos = ref<any[]>([]);
const loading = ref(false);
const confirmandoEliminar = ref<number | null>(null);
const cambiandoRol = ref<{ id: number; nombre: string } | null>(null);
const nuevoRol = ref('vecino');

async function fetchVecinos(): Promise<void> {
  const token = localStorage.getItem('token');
  const idPiso = userStore.fincaActivaId;
  if (!token || !idPiso || idPiso === 'null') return;
  loading.value = true;
  try {
    const res = await axios.get(`https://localhost:7152/api/Pisos/${idPiso}/vecinos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    vecinos.value = res.data.filter((v: any) => (v.role ?? v.Role) !== 'admin');
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

function abrirCambioRol(v: any) {
  cambiandoRol.value = {
    id: v.id_user ?? v.Id_user,
    nombre: v.name ?? v.Name ?? 'Sin nombre'
  };
  nuevoRol.value = v.role ?? v.Role ?? 'vecino';
}

async function guardarRol(): Promise<void> {
  if (!cambiandoRol.value) return;
  const token = localStorage.getItem('token');
  try {
    await axios.patch(
      `https://localhost:7152/api/Users/${cambiandoRol.value.id}/rol`,
      JSON.stringify(nuevoRol.value),
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    ui.success('Rol actualizado', `${cambiandoRol.value.nombre} ahora es ${nuevoRol.value}`);
    cambiandoRol.value = null;
    await fetchVecinos();
  } catch (err) {
    ui.error('Error', 'No se pudo cambiar el rol');
  }
}

async function eliminarVecino(): Promise<void> {
  if (!confirmandoEliminar.value) return;
  const token = localStorage.getItem('token');
  try {
    await axios.delete(`https://localhost:7152/api/Users/${confirmandoEliminar.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ui.success('Vecino eliminado');
    confirmandoEliminar.value = null;
    await fetchVecinos();
  } catch (err) {
    ui.error('Error', 'No se pudo eliminar el vecino');
  }
}

onMounted(() => fetchVecinos());
</script>

<template>
  <div class="admin-page">
    <Header />

    <div class="page-top">
      <div class="page-info">
        <h2>👥 Gestión de Vecinos</h2>
        <p>Vecinos de <strong>{{ userStore.viviendaNombre || 'tu comunidad' }}</strong></p>
      </div>
    </div>

    <div class="stats-mini">
      <div class="stat-pill">
        <strong>{{ vecinos.length }}</strong> vecinos en esta comunidad
      </div>
      <div class="stat-pill">
        <strong>{{ vecinos.filter(v => (v.role ?? v.Role) === 'presidente').length }}</strong> presidente(s)
      </div>
    </div>

    <div class="admin-content">
      <p v-if="loading" class="info-msg">Cargando vecinos...</p>

      <div v-else-if="vecinos.length === 0" class="empty-state">
        <span class="empty-icon">👥</span>
        <h3>No hay vecinos en esta comunidad</h3>
        <p>Los vecinos aparecerán aquí cuando se registren y seleccionen esta comunidad.</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in vecinos" :key="v.id_user ?? v.Id_user">
              <td class="td-id">{{ v.id_user ?? v.Id_user }}</td>
              <td><strong>{{ v.name ?? v.Name ?? 'Sin nombre' }}</strong></td>
              <td class="td-email">{{ v.email ?? v.Email }}</td>
              <td>
                <span :class="['role-badge', (v.role ?? v.Role) === 'presidente' ? 'presidente' : 'vecino']">
                  {{ (v.role ?? v.Role) === 'presidente' ? '👑 Presidente' : '🏠 Vecino' }}
                </span>
              </td>
              <td class="td-actions">
                <button class="btn-rol" @click="abrirCambioRol(v)" title="Cambiar rol">👑 Rol</button>
                <button class="btn-del" @click="confirmandoEliminar = v.id_user ?? v.Id_user">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL CAMBIAR ROL -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="cambiandoRol" class="modal-overlay" @click.self="cambiandoRol = null">
          <div class="confirm-card">
            <button class="modal-close" @click="cambiandoRol = null">✕</button>
            <span class="confirm-icon">👑</span>
            <h3>Cambiar rol</h3>
            <p>Asigna el rol de <strong>{{ cambiandoRol.nombre }}</strong></p>

            <div class="rol-options">
              <label :class="['rol-option', nuevoRol === 'vecino' ? 'active' : '']">
                <input type="radio" v-model="nuevoRol" value="vecino" />
                <span class="rol-icon">🏠</span>
                <div>
                  <strong>Vecino</strong>
                  <small>Acceso básico — ve su información y puede reportar incidencias</small>
                </div>
              </label>

              <label :class="['rol-option', nuevoRol === 'presidente' ? 'active pres' : '']">
                <input type="radio" v-model="nuevoRol" value="presidente" />
                <span class="rol-icon">👑</span>
                <div>
                  <strong>Presidente</strong>
                  <small>Gestiona incidencias, tablón, documentos y zonas comunes de su comunidad</small>
                </div>
              </label>
            </div>

            <div class="confirm-actions">
              <button class="btn-cancel" @click="cambiandoRol = null">Cancelar</button>
              <button class="btn-save" @click="guardarRol">Guardar cambio</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- MODAL CONFIRMAR ELIMINAR -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="confirmandoEliminar" class="modal-overlay" @click.self="confirmandoEliminar = null">
          <div class="confirm-card">
            <span class="confirm-icon">🗑️</span>
            <h3>¿Eliminar vecino?</h3>
            <p>Se eliminará el usuario y sus datos asociados.</p>
            <div class="confirm-actions">
              <button class="btn-cancel" @click="confirmandoEliminar = null">Cancelar</button>
              <button class="btn-delete" @click="eliminarVecino">Eliminar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Footer />
  </div>
</template>

<style scoped>
.admin-page { background: var(--bg-app); min-height: 100vh; padding: 0 30px 30px; display: flex; flex-direction: column; }
.page-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-info h2 { margin: 0; font-size: 1.6rem; color: var(--text-primary); font-weight: 700; }
.page-info p { margin: 4px 0 0 0; color: var(--text-secondary); font-size: 0.9rem; }

.stats-mini { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.stat-pill { background: var(--bg-card); padding: 10px 20px; border-radius: 12px; font-size: 0.88rem; color: var(--text-secondary); box-shadow: var(--shadow-card); }
.stat-pill strong { color: #ff8c00; font-size: 1.1rem; margin-right: 4px; }

.admin-content { background: var(--bg-card); border-radius: 20px; padding: 28px; box-shadow: var(--shadow-card); flex: 1; }
.info-msg { text-align: center; color: var(--text-muted); padding: 40px; }
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 3rem; display: block; margin-bottom: 16px; }
.empty-state h3 { margin: 0 0 8px 0; color: var(--text-primary); }
.empty-state p { margin: 0; color: var(--text-muted); font-size: 0.9rem; }

.table-wrapper { overflow-x: auto; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { text-align: left; padding: 14px 16px; background: var(--bg-input); color: var(--text-secondary); font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--border-color); }
.admin-table td { padding: 16px; border-bottom: 1px solid var(--border-color); font-size: 0.9rem; color: var(--text-primary); vertical-align: middle; }
.admin-table tr:hover { background: var(--border-light); }
.td-id { color: var(--text-muted); font-size: 0.82rem; }
.td-email { color: var(--text-secondary); font-size: 0.85rem; }
.td-actions { display: flex; gap: 8px; align-items: center; }

.role-badge { padding: 5px 14px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; }
.role-badge.vecino { background: #dbeafe; color: #1d4ed8; }
.role-badge.presidente { background: linear-gradient(135deg, #fff3e0, #ffe0b2); color: #e65100; border: 1px solid #ffcc80; }

.btn-rol { background: #fff8e1; border: 1px solid #ffe082; padding: 7px 12px; border-radius: 10px; cursor: pointer; font-size: 0.82rem; font-weight: 600; color: #7a5200; transition: 0.2s; white-space: nowrap; }
.btn-rol:hover { background: #ffe082; }
.btn-del { background: #fef2f2; border: 1px solid #fee2e2; padding: 7px 12px; border-radius: 10px; cursor: pointer; font-size: 0.95rem; transition: 0.2s; }
.btn-del:hover { background: #fee2e2; }

/* MODALS */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.confirm-card { background: var(--bg-card); max-width: 420px; width: 100%; border-radius: 24px; padding: 36px; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.25); position: relative; }
.modal-close { position: absolute; top: 16px; right: 16px; background: var(--border-light); border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 0.9rem; color: var(--text-secondary); }
.confirm-icon { font-size: 2.5rem; margin-bottom: 12px; display: block; }
.confirm-card h3 { margin: 0 0 8px 0; color: var(--text-primary); font-size: 1.2rem; }
.confirm-card p { color: var(--text-secondary); margin-bottom: 24px; }

/* ROL OPTIONS */
.rol-options { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; text-align: left; }
.rol-option { display: flex; align-items: center; gap: 14px; padding: 16px; border: 2px solid var(--border-color); border-radius: 14px; cursor: pointer; transition: 0.2s; }
.rol-option input[type="radio"] { display: none; }
.rol-option.active { border-color: #3b82f6; background: #eff6ff; }
.rol-option.active.pres { border-color: #ff8c00; background: #fff8e1; }
.rol-option:hover { border-color: #ff8c00; }
.rol-icon { font-size: 1.6rem; flex-shrink: 0; }
.rol-option strong { display: block; font-size: 0.95rem; color: var(--text-primary); margin-bottom: 2px; }
.rol-option small { font-size: 0.77rem; color: var(--text-muted); line-height: 1.4; }

.confirm-actions { display: flex; gap: 12px; }
.btn-cancel { flex: 1; padding: 14px; background: var(--border-light); border: none; border-radius: 30px; font-weight: 600; cursor: pointer; color: var(--text-secondary); }
.btn-save { flex: 1; padding: 14px; background: #ff8c00; color: white; border: none; border-radius: 30px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-save:hover { background: #e67e00; }
.btn-delete { flex: 1; padding: 14px; background: #ef4444; color: white; border: none; border-radius: 30px; font-weight: 700; cursor: pointer; }

.modal-enter-active { animation: modalIn 0.3s ease; }
.modal-leave-active { animation: modalIn 0.2s ease reverse; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>