<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import axios from 'axios';
import { useUiStore } from '@/store/Uistore';
import { useUserStore } from '@/store/userstore';

const ui = useUiStore();
const userStore = useUserStore();
const fincas = ref<any[]>([]);
const loading = ref(false);

const mostrarCrear = ref(false);
const nuevaFinca = ref({ nombre: '', direccion: '' });
const confirmandoEliminar = ref<number | null>(null);

async function fetchFincas(): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) return;
  loading.value = true;
  try {
    const res = await axios.get('https://localhost:7152/api/Pisos', {
      headers: { Authorization: `Bearer ${token}` }
    });
    fincas.value = res.data;
  } catch (err) { console.error(err); }
  finally { loading.value = false; }
}

function seleccionarFinca(finca: any): void {
  const id = finca.id_piso ?? finca.Id_piso;
  const nombre = finca.nombre ?? finca.Nombre ?? '';
  userStore.setComunidad(String(id), nombre);
  ui.success('Comunidad seleccionada', `Ahora gestionas: ${nombre}`);
}

function esActiva(finca: any): boolean {
  const id = String(finca.id_piso ?? finca.Id_piso);
  return userStore.fincaActivaId === id;
}

async function crearFinca(): Promise<void> {
  if (!nuevaFinca.value.nombre.trim()) {
    ui.warn('Campo obligatorio', 'El nombre es obligatorio');
    return;
  }
  const token = localStorage.getItem('token');
  try {
    await axios.post('https://localhost:7152/api/Pisos', {
      nombre: nuevaFinca.value.nombre,
      direccion: nuevaFinca.value.direccion
    }, { headers: { Authorization: `Bearer ${token}` } });
    ui.success('Comunidad creada', `${nuevaFinca.value.nombre} añadida`);
    nuevaFinca.value = { nombre: '', direccion: '' };
    mostrarCrear.value = false;
    await fetchFincas();
  } catch { ui.error('Error', 'No se pudo crear'); }
}

async function eliminarFinca(): Promise<void> {
  if (!confirmandoEliminar.value) return;
  const token = localStorage.getItem('token');
  try {
    await axios.delete(`https://localhost:7152/api/Pisos/${confirmandoEliminar.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ui.success('Eliminada');
    confirmandoEliminar.value = null;
    await fetchFincas();
  } catch { ui.error('Error', 'No se pudo eliminar. Puede tener datos asociados.'); }
}

function getFoto(nombre: string): string {
  const n = nombre.toLowerCase();
  if (n.includes('san juan')) return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=220&fit=crop';
  if (n.includes('parque')) return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=220&fit=crop';
  if (n.includes('german') || n.includes('foix')) return 'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=400&h=220&fit=crop';
  if (n.includes('ático') || n.includes('atico')) return 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=220&fit=crop';
  if (n.includes('bajo')) return 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=220&fit=crop';
  if (n.includes('primero')) return 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=400&h=220&fit=crop';
  return 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=220&fit=crop';
}

onMounted(() => fetchFincas());
</script>

<template>
  <div class="admin-page">
    <Header />

    <div class="page-top">
      <div class="page-info">
        <h2>🏢 Gestión de Comunidades</h2>
        <p>Haz click en una comunidad para gestionarla. La activa se resalta en naranja.</p>
      </div>
      <button class="btn-nueva" @click="mostrarCrear = !mostrarCrear">
        {{ mostrarCrear ? '✕ Cancelar' : '+ Nueva Comunidad' }}
      </button>
    </div>

    <!-- FORM CREAR -->
    <Transition name="slide">
      <div v-if="mostrarCrear" class="form-box">
        <h3>Registrar nueva comunidad</h3>
        <div class="form-grid">
          <div class="input-group">
            <label>Nombre <span class="req">*</span></label>
            <input v-model="nuevaFinca.nombre" type="text" placeholder="Ej: Residencial Los Olivos" class="form-input">
          </div>
          <div class="input-group">
            <label>Dirección</label>
            <input v-model="nuevaFinca.direccion" type="text" placeholder="Ej: Calle Mayor 12, Zaragoza" class="form-input">
          </div>
        </div>
        <button class="btn-publicar" @click="crearFinca">Crear Comunidad</button>
      </div>
    </Transition>

    <!-- STATS -->
    <div class="stats-mini">
      <div class="stat-pill"><strong>{{ fincas.length }}</strong> comunidades</div>
      <div v-if="userStore.viviendaNombre" class="stat-pill active-pill">Gestionando: <strong>{{ userStore.viviendaNombre }}</strong></div>
    </div>

    <p v-if="loading" class="info-msg">Cargando...</p>

    <!-- GRID -->
    <div v-else-if="fincas.length > 0" class="fincas-grid">
      <div v-for="f in fincas" :key="f.id_piso ?? f.Id_piso"
        :class="['finca-card', { activa: esActiva(f) }]"
        @click="seleccionarFinca(f)">
        <div class="finca-img" :style="{ backgroundImage: 'url(' + getFoto(f.nombre ?? f.Nombre ?? '') + ')' }">
          <button class="btn-eliminar-finca" @click.stop="confirmandoEliminar = f.id_piso ?? f.Id_piso">🗑️</button>
          <span v-if="esActiva(f)" class="active-badge">ACTIVA</span>
        </div>
        <div class="finca-body">
          <h4>{{ f.nombre ?? f.Nombre ?? 'Sin nombre' }}</h4>
          <p class="finca-dir">📍 {{ f.direccion ?? f.Direccion ?? 'Sin dirección' }}</p>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <span class="empty-icon">🏢</span>
      <h3>No hay comunidades</h3>
      <p>Crea la primera para empezar.</p>
    </div>

    <!-- MODAL ELIMINAR -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="confirmandoEliminar" class="modal-overlay" @click.self="confirmandoEliminar = null">
          <div class="confirm-card">
            <span class="confirm-icon">🗑️</span>
            <h3>¿Eliminar comunidad?</h3>
            <p>Se eliminarán los vecinos asociados.</p>
            <div class="confirm-actions">
              <button class="btn-cancel" @click="confirmandoEliminar = null">Cancelar</button>
              <button class="btn-delete" @click="eliminarFinca">Eliminar</button>
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
.page-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-info h2 { margin: 0; font-size: 1.6rem; color: #1a1a2e; }
.page-info p { margin: 4px 0 0 0; color: #7f8c8d; font-size: 0.9rem; }
.btn-nueva { background: #ff8c00; color: white; border: none; padding: 14px 28px; border-radius: 30px; font-weight: 700; cursor: pointer; }
.btn-nueva:hover { background: #e67e00; }

.form-box { background: white; border-radius: 20px; padding: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); margin-bottom: 28px; }
.form-box h3 { margin: 0 0 20px 0; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.input-group { margin-bottom: 16px; }
.input-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.88rem; color: #374151; }
.req { color: #ff8c00; }
.form-input { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1.5px solid #E5E7EB; background: #FAFAFA; font-family: inherit; font-size: 0.95rem; box-sizing: border-box; outline: none; }
.form-input:focus { border-color: #ff8c00; }
.btn-publicar { width: 100%; padding: 15px; background: #ff8c00; color: white; border: none; border-radius: 30px; font-weight: 700; cursor: pointer; margin-top: 8px; }

.stats-mini { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.stat-pill { background: white; padding: 10px 20px; border-radius: 12px; font-size: 0.88rem; color: #6b7280; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.stat-pill strong { color: #ff8c00; margin-right: 4px; }
.active-pill { background: #FFF7ED; border: 1.5px solid #FFE8CC; }

.fincas-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; flex: 1; }
.finca-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); transition: 0.3s; cursor: pointer; border: 2px solid transparent; }
.finca-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.finca-card.activa { border-color: #ff8c00; }
.finca-img { height: 160px; background-size: cover; background-position: center; background-color: #e5e7eb; position: relative; }
.btn-eliminar-finca { position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.9); border: none; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; }
.btn-eliminar-finca:hover { background: #fee2e2; }
.active-badge { position: absolute; top: 10px; left: 10px; background: #ff8c00; color: white; padding: 4px 14px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px; }
.finca-body { padding: 18px; }
.finca-body h4 { margin: 0 0 6px 0; font-size: 1.05rem; color: #1a1a2e; font-weight: 700; }
.finca-dir { margin: 0; font-size: 0.84rem; color: #6b7280; }

.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 60px; }
.empty-icon { font-size: 3rem; display: block; margin-bottom: 16px; }
.info-msg { text-align: center; color: #95a5a6; padding: 40px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.confirm-card { background: white; max-width: 380px; width: 100%; border-radius: 24px; padding: 36px; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
.confirm-icon { font-size: 2.5rem; margin-bottom: 12px; display: block; }
.confirm-card h3 { margin: 0 0 8px 0; }
.confirm-card p { color: #6b7280; margin-bottom: 24px; }
.confirm-actions { display: flex; gap: 12px; }
.btn-cancel { flex: 1; padding: 14px; background: #F3F4F6; border: none; border-radius: 30px; font-weight: 600; cursor: pointer; color: #6B7280; }
.btn-delete { flex: 1; padding: 14px; background: #ef4444; color: white; border: none; border-radius: 30px; font-weight: 700; cursor: pointer; }

.slide-enter-active { animation: slideDown 0.3s ease; }
.slide-leave-active { animation: slideDown 0.2s ease reverse; }
@keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 400px; } }
.modal-enter-active { animation: modalIn 0.3s ease; }
.modal-leave-active { animation: modalIn 0.2s ease reverse; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

@media (max-width: 1024px) { .fincas-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .admin-page { padding: 0 16px 20px; } .fincas-grid { grid-template-columns: 1fr; } }
</style>