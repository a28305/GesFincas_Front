<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/store/userstore';
import axios from 'axios';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

const userStore = useUserStore();

const incidencias = ref([
  { id: 1, titulo: 'Ascensor averiado en Bloque A', desc: 'El ascensor principal no funciona desde esta mañana', fecha: '16/1/2024', status: 'NUEVA', color: 'red' },
  { id: 2, titulo: 'Fuga de agua en garaje', desc: 'Hay una fuga constante en la planta -2 del garaje', fecha: '14/1/2024', status: 'PROCESO', color: 'orange' },
  { id: 3, titulo: 'Luz fundida en escalera principal', desc: 'La iluminación del tercer piso está completamente apagada', fecha: '12/1/2024', status: 'RESUELTA', color: 'green' }
]);

const cargarDatosUsuario = async () => {
  const storedName = localStorage.getItem('userName');
  const storedPiso = localStorage.getItem('viviendaNombre');
  const storedFincaId = localStorage.getItem('fincaActiva');
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  if ((!userStore.userName || userStore.userName === 'Usuario') && storedName) {
    userStore.userName = storedName;
  }

  if (storedPiso && storedPiso !== 'null' && storedPiso !== 'Comunidad no seleccionada') {
    if (!userStore.fincaActivaId && storedFincaId) {
      userStore.setComunidad(storedFincaId, storedPiso);
    } else if (userStore.viviendaNombre === 'Comunidad no seleccionada') {
      userStore.viviendaNombre = storedPiso;
    }
    return;
  }

  if (userId && token && userId !== 'null') {
    try {
      const res = await axios.get(`https://localhost:7152/api/pisos/mi-vivienda/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.length > 0) {
        userStore.setComunidad(String(res.data[0].id_piso), res.data[0].nombre);
      } else {
        userStore.viviendaNombre = 'Sin vivienda asignada';
      }
    } catch (e) {
      console.error('Error recuperando piso desde API', e);
      if (!userStore.viviendaNombre || userStore.viviendaNombre === 'Comunidad no seleccionada') {
        userStore.viviendaNombre = 'Sin vivienda asignada';
      }
    }
  }
};

onMounted(() => {
  cargarDatosUsuario();
});
</script>

<template>
  <div class="dashboard-container">
    
    <Header />

    <div class="stats-grid">
      <div class="stat-card">
        <div><p>Total Incidencias</p><strong>9</strong></div>
        <div class="icon-bg orange-light">📄</div>
      </div>
      <div class="stat-card">
        <div><p>Nuevas</p><strong class="text-red">4</strong></div>
        <div class="icon-bg red-light">❗</div>
      </div>
      <div class="stat-card">
        <div><p>En Proceso</p><strong class="text-yellow">3</strong></div>
        <div class="icon-bg yellow-light">🕒</div>
      </div>
      <div class="stat-card">
        <div><p>Resueltas</p><strong class="text-green">2</strong></div>
        <div class="icon-bg green-light">✅</div>
      </div>
    </div>

    <div class="main-layout-grid">
      <div class="left-col">
        <section class="white-box">
          <div class="box-header">
            <h3>Últimas Incidencias</h3>
            <a href="#" class="view-all">Ver todos</a>
          </div>
          <div class="incidencias-list">
            <div v-for="item in incidencias" :key="item.id" class="incidencia-row">
              <div class="incidencia-img">🏢</div>
              <div class="incidencia-body">
                <div class="meta">
                  <span :class="['tag', item.color]">{{ item.status }}</span>
                  <span class="date">{{ item.fecha }}</span>
                </div>
                <h4>{{ item.titulo }}</h4>
                <p>{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="white-box">
          <div class="box-header">
            <h3>Resumen de Pagos</h3>
            <a href="#" class="view-all">Ver historial</a>
          </div>
          <div class="payments-grid">
            <div class="pay-card green-soft"><p>Pagos al día</p><strong>4</strong></div>
            <div class="pay-card yellow-soft"><p>Pendientes</p><strong>2</strong></div>
            <div class="pay-card red-soft"><p>Vencidos</p><strong>0</strong></div>
          </div>
        </section>
      </div>

      <aside class="right-col">
        <div class="white-box">
          <h3>Acciones Rápidas</h3>
          <button class="btn btn-primary">+ Nueva Incidencia</button>
          <button class="btn btn-outline">📅 Reservar Zona Común</button>
          <button class="btn btn-outline">📄 Ver Documentos</button>
        </div>

        <div class="white-box announcements">
          <div class="box-header">
            <h3>Anuncios</h3>
            <a href="#" class="view-all">Ver todos</a>
          </div>
          <div class="announcement-item">
            <span class="tag-outline red">Importante</span>
            <h4>Junta de Vecinos - Febrero</h4>
          </div>
          <div class="announcement-item">
            <span class="tag-outline grey">General</span>
            <h4>Mantenimiento Ascensores</h4>
          </div>
        </div>
      </aside>
    </div>

    <Footer />

  </div>
</template>

<style scoped>
.dashboard-container { 
  background-color: #f4f7f6; 
  min-height: 100vh; 
  padding: 0 30px 30px 30px; 
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
}

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
.stat-card { background: white; padding: 20px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
.main-layout-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 25px; flex: 1; }
.white-box { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); margin-bottom: 25px; }
.box-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.orange-light { background: #fff3e0; color: #ff8c00; }
.red-light { background: #ffebee; color: #e53935; }
.yellow-light { background: #fffde7; color: #fbc02d; }
.green-light { background: #e8f5e9; color: #4caf50; }
.text-red { color: #e53935; }
.text-yellow { color: #fbc02d; }
.text-green { color: #4caf50; }
.tag { font-size: 0.65rem; padding: 3px 8px; border-radius: 5px; color: white; font-weight: bold; }
.red { background: #ff4757; }
.orange { background: #ffa502; }
.green { background: #2ed573; }
.payments-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
.pay-card { padding: 15px; border-radius: 12px; text-align: center; }
.green-soft { background: #eefdf5; color: #27ae60; }
.yellow-soft { background: #fef9e7; color: #f1c40f; }
.red-soft { background: #fdf2f2; color: #e74c3c; }
.btn { width: 100%; padding: 12px; border-radius: 12px; border: none; font-weight: bold; margin-bottom: 12px; cursor: pointer; }
.btn-primary { background: #ff8c00; color: white; }
.btn-outline { background: #f8f9fa; color: #5d4037; border: 1px solid #eee; }
.tag-outline { font-size: 0.6rem; border: 1px solid; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
</style>