<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/store/userstore';
import axios from 'axios';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import IncidenciaCard from '@/components/IncidenciaCard.vue';
import { useIncidenciaStore } from '@/store/incidenciasStore';
import ModalNuevaIncidencia from '@/components/ModalNuevaIncidencia.vue';

const userStore = useUserStore();
const incidenciaStore = useIncidenciaStore();
const mostrarModal = ref(false);

const incidencias = computed(() => incidenciaStore.listaIncidencias);

const totalNuevas = computed(() => incidencias.value.filter(i => i.estado === 'Nueva').length);
const totalProceso = computed(() => incidencias.value.filter(i => i.estado === 'En Proceso').length);
const totalResueltas = computed(() => incidencias.value.filter(i => i.estado === 'Resuelta').length);

// ===== MODAL DETALLE (AÑADIDO) =====
const mostrarDetalle = ref(false);
const incidenciaSeleccionada = ref<Record<string, any> | null>(null);
const nuevoEstado = ref('');
const actualizando = ref(false);

const esAdmin = computed((): boolean => userStore.userRole === 'admin');

function abrirDetalle(item: Record<string, any>): void {
  incidenciaSeleccionada.value = item;
  nuevoEstado.value = item.estado ?? item.Estado ?? '';
  mostrarDetalle.value = true;
}

function cerrarDetalle(): void {
  mostrarDetalle.value = false;
  incidenciaSeleccionada.value = null;
}

function getDetalleImagen(): string {
  if (!incidenciaSeleccionada.value) return '';
  const titulo = String(incidenciaSeleccionada.value.titulo ?? incidenciaSeleccionada.value.Titulo ?? '');
  const desc = String(incidenciaSeleccionada.value.descripcion ?? incidenciaSeleccionada.value.Descripcion ?? '');
  const texto = (titulo + ' ' + desc).toLowerCase();
  const images: Record<string, string> = {
    'ascensor': 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&h=400&fit=crop',
    'fontanería': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop',
    'fuga': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop',
    'agua': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop',
    'electricidad': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=400&fit=crop',
    'luz': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=400&fit=crop',
    'puerta': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
    'portal': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
    'limpieza': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop',
    'basura': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop',
    'ruido': 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=600&h=400&fit=crop',
    'estructura': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop',
  };
  for (const [key, url] of Object.entries(images)) {
    if (texto.includes(key)) return url;
  }
  return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop';
}

function getDetalleEstado(): string {
  if (!incidenciaSeleccionada.value) return '';
  return String(incidenciaSeleccionada.value.estado ?? incidenciaSeleccionada.value.Estado ?? '');
}

function getStatusClass(estado: string): string {
  const e = estado.toLowerCase();
  if (e === 'nueva') return 'badge-red';
  if (e === 'en proceso') return 'badge-orange';
  if (e === 'resuelta') return 'badge-green';
  return 'badge-grey';
}

function getDetalleFecha(): string {
  if (!incidenciaSeleccionada.value) return '';
  const f = String(incidenciaSeleccionada.value.fechaCreacion ?? incidenciaSeleccionada.value.FechaCreacion ?? '');
  if (!f) return 'Sin fecha';
  return new Date(f).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getDetalleApartamento(): string {
  if (!incidenciaSeleccionada.value) return 'No especificado';
  const desc = String(incidenciaSeleccionada.value.descripcion ?? incidenciaSeleccionada.value.Descripcion ?? '');
  const match = desc.match(/Apt:\s*([^|]+)/i);
  if (match && match[1]) return match[1].trim();
  return 'No especificado';
}

async function actualizarEstado(): Promise<void> {
  if (!incidenciaSeleccionada.value || !nuevoEstado.value) return;
  const id = incidenciaSeleccionada.value.id_incidencias ?? incidenciaSeleccionada.value.Id_incidencias;
  const token = localStorage.getItem('token');
  actualizando.value = true;
  try {
    await axios.patch(
      `https://localhost:7152/api/Incidencias/${id}/estado`,
      JSON.stringify(nuevoEstado.value),
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    await incidenciaStore.fetchIncidencias();
    cerrarDetalle();
  } catch (err) {
    console.error('Error al actualizar estado:', err);
  } finally {
    actualizando.value = false;
  }
}
// ===== FIN MODAL DETALLE =====

const inicializarDashboard = async () => {
  const storedFincaId = localStorage.getItem('fincaActiva');
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  if (!token) return;

  if (storedFincaId && (!userStore.fincaActivaId || userStore.fincaActivaId === 'null')) {
    userStore.fincaActivaId = storedFincaId;
  }

  if (userId && (!userStore.fincaActivaId || userStore.fincaActivaId === 'null')) {
    try {
      const res = await axios.get(`https://localhost:7152/api/pisos/mi-vivienda/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.length > 0) {
        userStore.setComunidad(String(res.data[0].id_piso), res.data[0].nombre);
      }
    } catch (e) {
      console.error('Error recuperando datos de comunidad:', e);
    }
  }

  if (userStore.fincaActivaId && userStore.fincaActivaId !== 'null' && token) {
    await incidenciaStore.fetchIncidencias();
  }
};

onMounted(() => {
  inicializarDashboard();
});
</script>

<template>
  <div class="dashboard-container">
    <Header />

    <div class="stats-grid">
      <div class="stat-card">
        <div><p>Total Incidencias</p><strong>{{ incidencias.length }}</strong></div>
        <div class="icon-bg orange-light">📄</div>
      </div>
      <div class="stat-card">
        <div><p>Nuevas</p><strong class="text-red">{{ totalNuevas }}</strong></div>
        <div class="icon-bg red-light">❗</div>
      </div>
      <div class="stat-card">
        <div><p>En Proceso</p><strong class="text-yellow">{{ totalProceso }}</strong></div>
        <div class="icon-bg yellow-light">🕒</div>
      </div>
      <div class="stat-card">
        <div><p>Resueltas</p><strong class="text-green">{{ totalResueltas }}</strong></div>
        <div class="icon-bg green-light">✅</div>
      </div>
    </div>

    <div class="main-layout-grid">
      <div class="left-col">
        <section class="white-box">
          <div class="box-header">
            <h3>Últimas Incidencias</h3>
            <router-link to="/app/incidencias" class="view-all">Ver todos</router-link>
          </div>
          
          <div class="incidencias-list">
            <p v-if="incidenciaStore.loading" class="info-msg">Cargando datos del servidor...</p>
            
            <!-- CAMBIO: añadido mode="card" y @ver-detalle -->
            <IncidenciaCard 
              v-for="item in incidencias" 
              :key="item.id_incidencias" 
              :item="item"
              mode="card"
              @ver-detalle="abrirDetalle"
            />
            
            <p v-if="incidencias.length === 0 && !incidenciaStore.loading" class="empty-msg">
              No hay incidencias registradas en esta comunidad.
            </p>
          </div>
        </section>

        <section class="white-box">
          <div class="box-header">
            <h3>Resumen de Pagos</h3>
            <router-link to="/app/pagos" class="view-all">Ver historial</router-link>
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
          <button class="btn-primary" @click="mostrarModal = true">+ Nueva Incidencia</button>
          <ModalNuevaIncidencia :show="mostrarModal" @close="mostrarModal = false" />
          <button class="btn-outline">📅 Reservar Zona Común</button>
          <button class="btn-outline">📄 Ver Documentos</button>
        </div>

        <div class="white-box announcements">
          <div class="box-header">
            <h3>Anuncios</h3>
            <router-link to="/app/anuncios" class="view-all">Ver todos</router-link>
          </div>
          <div class="announcement-item">
            <span class="tag-outline red">Importante</span>
            <h4>Junta de Vecinos - Febrero</h4>
          </div>
        </div>
      </aside>
    </div>

    <!-- ===== MODAL DETALLE INCIDENCIA (AÑADIDO) ===== -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="mostrarDetalle && incidenciaSeleccionada" class="detalle-overlay" @click.self="cerrarDetalle">
          <div class="detalle-card">
            <div class="detalle-img" :style="{ backgroundImage: 'url(' + getDetalleImagen() + ')' }">
              <span :class="['detalle-badge', getStatusClass(getDetalleEstado())]">
                {{ getDetalleEstado().toUpperCase() }}
              </span>
              <button class="detalle-close" @click="cerrarDetalle">✕</button>
            </div>

            <div class="detalle-body">
              <h2 class="detalle-titulo">{{ incidenciaSeleccionada.titulo ?? incidenciaSeleccionada.Titulo ?? 'Sin título' }}</h2>
              <p class="detalle-desc">{{ (incidenciaSeleccionada.descripcion ?? incidenciaSeleccionada.Descripcion ?? '').split('|')[0] }}</p>

              <div class="detalle-pills">
                <div class="pill">
                  <span class="pill-icon">👤</span>
                  <div>
                    <small>Reportado por</small>
                    <strong>Apartamento {{ getDetalleApartamento() }}</strong>
                  </div>
                </div>
                <div class="pill">
                  <span class="pill-icon">📅</span>
                  <div>
                    <small>Fecha de reporte</small>
                    <strong>{{ getDetalleFecha() }}</strong>
                  </div>
                </div>
              </div>

              <div class="detalle-actions">
                <button class="btn-cerrar-modal" @click="cerrarDetalle">Cerrar</button>
                <div v-if="esAdmin" class="admin-estado">
                  <select v-model="nuevoEstado" class="estado-select">
                    <option value="Nueva">Nueva</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Resuelta">Resuelta</option>
                  </select>
                  <button class="btn-actualizar" @click="actualizarEstado" :disabled="actualizando">
                    {{ actualizando ? 'Guardando...' : 'Actualizar Estado' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Footer />
  </div>
</template>

<style scoped>
.dashboard-container { 
  background-color: #f4f7f6; 
  min-height: 100vh; 
  padding: 0 30px 30px 30px; 
  display: flex;
  flex-direction: column;
}

.btn-primary { 
  background-color: #ff8c00; 
  color: white; 
  width: 100%; 
  padding: 16px; 
  border-radius: 30px; 
  border: none; 
  font-weight: bold; 
  cursor: pointer;
  margin-bottom: 15px;
  transition: all 0.3s ease;
}
.btn-primary:hover {
  background-color: #e67e00;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 126, 0, 0.2);
}

.btn-outline { 
  width: 100%; padding: 12px; border-radius: 12px;
  border: 1px solid #eee; background: #f8f9fa;
  color: #5d4037; font-weight: bold; margin-bottom: 12px; cursor: pointer;
}

.empty-msg, .info-msg {
  text-align: center; color: #95a5a6; padding: 20px; font-size: 0.9rem;
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

/* ===== ESTILOS MODAL DETALLE (AÑADIDO) ===== */
.detalle-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.detalle-card {
  background: white; width: 100%; max-width: 500px;
  border-radius: 24px; overflow: hidden;
  box-shadow: 0 25px 60px rgba(0,0,0,0.2);
  max-height: 90vh; overflow-y: auto;
}
.detalle-img {
  height: 220px; background-size: cover;
  background-position: center; background-color: #ddd;
  position: relative;
}
.detalle-badge {
  position: absolute; top: 16px; left: 16px;
  padding: 6px 16px; border-radius: 10px;
  font-size: 0.75rem; font-weight: 700;
  color: white; letter-spacing: 0.5px;
}
.badge-red { background: #ef4444; }
.badge-orange { background: #f59e0b; }
.badge-green { background: #22c55e; }
.badge-blue { background: #3b82f6; }
.badge-grey { background: #9ca3af; }

.detalle-close {
  position: absolute; top: 16px; right: 16px;
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,0.9); border: none;
  cursor: pointer; font-size: 1.1rem; color: #374151;
  display: flex; align-items: center; justify-content: center;
}
.detalle-close:hover { background: white; }

.detalle-body { padding: 28px; }
.detalle-titulo { margin: 0 0 8px 0; font-size: 1.3rem; font-weight: 700; color: #1a1a2e; }
.detalle-desc { margin: 0 0 24px 0; font-size: 0.92rem; color: #6b7280; line-height: 1.6; }

.detalle-pills { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 28px; }
.pill {
  display: flex; align-items: center; gap: 12px;
  background: #FFF7ED; padding: 14px 18px;
  border-radius: 14px; flex: 1; min-width: 180px;
}
.pill-icon {
  width: 36px; height: 36px; background: #ff8c00;
  border-radius: 50%; display: flex; align-items: center;
  justify-content: center; font-size: 16px; flex-shrink: 0;
}
.pill small { display: block; font-size: 0.72rem; color: #9ca3af; margin-bottom: 2px; }
.pill strong { font-size: 0.88rem; color: #1a1a2e; }

.detalle-actions { display: flex; flex-direction: column; gap: 12px; }
.btn-cerrar-modal {
  width: 100%; padding: 14px; background: #F3F4F6;
  border: none; border-radius: 30px; font-weight: 600;
  cursor: pointer; color: #6B7280; font-size: 0.95rem;
}
.btn-cerrar-modal:hover { background: #E5E7EB; color: #374151; }

.admin-estado { display: flex; gap: 12px; }
.estado-select {
  flex: 1; padding: 14px 16px; border-radius: 14px;
  border: 1.5px solid #E5E7EB; background: #FAFAFA;
  font-family: inherit; font-size: 0.9rem;
  color: #374151; outline: none; cursor: pointer;
}
.estado-select:focus { border-color: #ff8c00; }
.btn-actualizar {
  flex: 1; padding: 14px; background: #ff8c00;
  color: white; border: none; border-radius: 30px;
  font-weight: 700; font-size: 0.9rem; cursor: pointer;
}
.btn-actualizar:hover:not(:disabled) { background: #e67e00; box-shadow: 0 4px 12px rgba(255,140,0,0.25); }
.btn-actualizar:disabled { background: #d1d5db; cursor: not-allowed; }

.modal-enter-active { animation: modalIn 0.3s ease; }
.modal-leave-active { animation: modalIn 0.2s ease reverse; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

@media (max-width: 1024px) {
  .main-layout-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>