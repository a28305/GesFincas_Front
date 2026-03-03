<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import axios from 'axios';
import { useUiStore } from '@/store/Uistore';

const ui = useUiStore();
const vecinos = ref<any[]>([]);
const loading = ref(false);

async function fetchVecinos(): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) return;
  loading.value = true;
  try {
    const res = await axios.get('https://localhost:7152/api/Users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    vecinos.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function eliminarVecino(id: number): Promise<void> {
  const token = localStorage.getItem('token');
  try {
    await axios.delete(`https://localhost:7152/api/Users/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ui.success('Vecino eliminado');
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

    <div class="admin-content">
      <h3>Listado de Vecinos</h3>
      <p v-if="loading">Cargando...</p>

      <div class="table-wrapper">
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
              <td>{{ v.id_user ?? v.Id_user }}</td>
              <td>{{ v.name ?? v.Name ?? 'Sin nombre' }}</td>
              <td>{{ v.email ?? v.Email }}</td>
              <td><span :class="['role-badge', (v.role ?? v.Role) === 'admin' ? 'admin' : 'vecino']">{{ v.role ?? v.Role }}</span></td>
              <td><button class="btn-del" @click="eliminarVecino(v.id_user ?? v.Id_user)">🗑️</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Footer />
  </div>
</template>

<style scoped>
.admin-page { background: #f4f7f6; min-height: 100vh; padding: 0 30px 30px; display: flex; flex-direction: column; }
.admin-content { background: white; border-radius: 20px; padding: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); flex: 1; }
.admin-content h3 { margin: 0 0 20px 0; font-size: 1.2rem; color: #1a1a2e; }
.table-wrapper { overflow-x: auto; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { text-align: left; padding: 14px 16px; background: #f9fafb; color: #6b7280; font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb; }
.admin-table td { padding: 14px 16px; border-bottom: 1px solid #f3f4f6; font-size: 0.9rem; color: #374151; }
.admin-table tr:hover { background: #fafbfc; }
.role-badge { padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; color: white; }
.role-badge.admin { background: #ff8c00; }
.role-badge.vecino { background: #3b82f6; }
.btn-del { background: #fef2f2; border: 1px solid #fee2e2; padding: 6px 12px; border-radius: 8px; cursor: pointer; }
.btn-del:hover { background: #fee2e2; }
</style>