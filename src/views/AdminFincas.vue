<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import axios from 'axios';
import { useUiStore } from '@/store/Uistore';

const ui = useUiStore();
const fincas = ref<any[]>([]);
const loading = ref(false);

async function fetchFincas(): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) return;
  loading.value = true;
  try {
    const res = await axios.get('https://localhost:7152/api/Pisos', {
      headers: { Authorization: `Bearer ${token}` }
    });
    fincas.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => fetchFincas());
</script>

<template>
  <div class="admin-page">
    <Header />

    <div class="admin-content">
      <h3>Comunidades / Fincas registradas</h3>
      <p v-if="loading">Cargando...</p>

      <div class="fincas-grid">
        <div v-for="f in fincas" :key="f.id_piso ?? f.Id_piso" class="finca-card">
          <span class="finca-icon">🏢</span>
          <h4>{{ f.nombre ?? f.Nombre ?? 'Sin nombre' }}</h4>
          <p>{{ f.direccion ?? f.Direccion ?? 'Sin dirección' }}</p>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>

<style scoped>
.admin-page { background: #f4f7f6; min-height: 100vh; padding: 0 30px 30px; display: flex; flex-direction: column; }
.admin-content { background: white; border-radius: 20px; padding: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); flex: 1; }
.admin-content h3 { margin: 0 0 20px 0; font-size: 1.2rem; color: #1a1a2e; }
.fincas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; }
.finca-card { background: #FFF7ED; padding: 24px; border-radius: 16px; text-align: center; border: 2px solid transparent; transition: 0.2s; }
.finca-card:hover { border-color: #ff8c00; }
.finca-icon { font-size: 2rem; display: block; margin-bottom: 10px; }
.finca-card h4 { margin: 0 0 6px 0; color: #1a1a2e; font-size: 1rem; }
.finca-card p { margin: 0; font-size: 0.84rem; color: #6b7280; }
</style>