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

async function fetchVecinos(): Promise<void> {
  const token = localStorage.getItem('token');
  const idPiso = userStore.fincaActivaId;
  if (!token || !idPiso || idPiso === 'null') return;
  loading.value = true;
  try {
    const res = await axios.get(`https://localhost:7152/api/Pisos/${idPiso}/vecinos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // Filtrar solo vecinos (no admins)
    vecinos.value = res.data.filter((v: any) => (v.role ?? v.Role) !== 'admin');
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
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
      <div class="stat-pill"><strong>{{ vecinos.length }}</strong> vecinos en esta comunidad</div>
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
                <span class="role-badge vecino">vecino</span>
              </td>
              <td>
                <button class="btn-del" @click="confirmandoEliminar = v.id_user ?? v.Id_user">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

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
.admin-page { background: #f4f7f6; min-height: 100vh; padding: 0 30px 30px; display: flex; flex-direction: column; }
.page-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-info h2 { margin: 0; font-size: 1.6rem; color: #1a1a2e; font-weight: 700; }
.page-info p { margin: 4px 0 0 0; color: #7f8c8d; font-size: 0.9rem; }

.stats-mini { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.stat-pill { background: white; padding: 10px 20px; border-radius: 12px; font-size: 0.88rem; color: #6b7280; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.stat-pill strong { color: #ff8c00; font-size: 1.1rem; margin-right: 4px; }

.admin-content { background: white; border-radius: 20px; padding: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); flex: 1; }
.info-msg { text-align: center; color: #95a5a6; padding: 40px; }
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 3rem; display: block; margin-bottom: 16px; }
.empty-state h3 { margin: 0 0 8px 0; color: #374151; }
.empty-state p { margin: 0; color: #95a5a6; font-size: 0.9rem; }

.table-wrapper { overflow-x: auto; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { text-align: left; padding: 14px 16px; background: #f9fafb; color: #6b7280; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb; }
.admin-table td { padding: 16px 16px; border-bottom: 1px solid #f3f4f6; font-size: 0.9rem; color: #374151; }
.admin-table tr:hover { background: #fafbfc; }
.td-id { color: #9ca3af; font-size: 0.82rem; }
.td-email { color: #6b7280; font-size: 0.85rem; }

.role-badge { padding: 4px 14px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; color: white; }
.role-badge.vecino { background: #3b82f6; }

.btn-del { background: #fef2f2; border: 1px solid #fee2e2; padding: 8px 12px; border-radius: 10px; cursor: pointer; font-size: 0.95rem; transition: 0.2s; }
.btn-del:hover { background: #fee2e2; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.confirm-card { background: white; max-width: 380px; width: 100%; border-radius: 24px; padding: 36px; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
.confirm-icon { font-size: 2.5rem; margin-bottom: 12px; display: block; }
.confirm-card h3 { margin: 0 0 8px 0; }
.confirm-card p { color: #6b7280; margin-bottom: 24px; }
.confirm-actions { display: flex; gap: 12px; }
.btn-cancel { flex: 1; padding: 14px; background: #F3F4F6; border: none; border-radius: 30px; font-weight: 600; cursor: pointer; color: #6B7280; }
.btn-delete { flex: 1; padding: 14px; background: #ef4444; color: white; border: none; border-radius: 30px; font-weight: 700; cursor: pointer; }

.modal-enter-active { animation: modalIn 0.3s ease; }
.modal-leave-active { animation: modalIn 0.2s ease reverse; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>