<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import IncidenciaCard from '@/components/IncidenciaCard.vue';
import ModalNuevaIncidencia from '@/components/ModalNuevaIncidencia.vue';
import { useIncidenciaStore } from '@/store/incidenciasStore';
import { useUserStore } from '@/store/userstore';
import axios from 'axios';

const incidenciaStore = useIncidenciaStore();
const userStore = useUserStore();

const mostrarModal = ref(false);
const filtroActivo = ref('Todas');
const filtros = ['Todas', 'Nuevas', 'En Proceso', 'Resueltas'];

const mostrarDetalle = ref(false);
const incidenciaSeleccionada = ref<Record<string, any> | null>(null);
const nuevoEstado = ref('');
const actualizando = ref(false);

const esAdmin = computed((): boolean => {
  return userStore.userRole === 'admin';
});

const incidencias = computed(() => incidenciaStore.listaIncidencias);

const incidenciasFiltradas = computed(() => {
  if (filtroActivo.value === 'Todas') return incidencias.value;
  const mapFiltro: Record<string, string> = {
    'Nuevas': 'Nueva',
    'En Proceso': 'En Proceso',
    'Resueltas': 'Resuelta'
  };
  const estado = mapFiltro[filtroActivo.value] ?? '';
  return incidencias.value.filter((i: any) => {
    const e = i.estado ?? i.Estado ?? '';
    return e === estado;
  });
});

function abrirDetalle(item: Record<string, any>): void {
  incidenciaSeleccionada.value = item;
  nuevoEstado.value = item.estado ?? item.Estado ?? '';
  mostrarDetalle.value = true;
}

function cerrarDetalle(): void {
  mostrarDetalle.value = false;
  incidenciaSeleccionada.value = null;
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
    alert('Error al actualizar el estado');
  } finally {
    actualizando.value = false;
  }
}

function getDetalleTitulo(): string {
  if (!incidenciaSeleccionada.value) return '';
  return incidenciaSeleccionada.value.titulo ?? incidenciaSeleccionada.value.Titulo ?? 'Sin título';
}
function getDetalleDescripcion(): string {
  if (!incidenciaSeleccionada.value) return '';
  const desc = incidenciaSeleccionada.value.descripcion ?? incidenciaSeleccionada.value.Descripcion ?? '';
  return desc.split('|')[0].trim();
}
function getDetalleEstado(): string {
  if (!incidenciaSeleccionada.value) return '';
  return incidenciaSeleccionada.value.estado ?? incidenciaSeleccionada.value.Estado ?? '';
}
function getDetalleFecha(): string {
  if (!incidenciaSeleccionada.value) return '';
  const f = incidenciaSeleccionada.value.fechaCreacion ?? incidenciaSeleccionada.value.FechaCreacion ?? '';
  if (!f) return 'Sin fecha';
  const d = new Date(f);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}
function getDetalleApartamento(): string {
  if (!incidenciaSeleccionada.value) return '';
  const desc = incidenciaSeleccionada.value.descripcion ?? incidenciaSeleccionada.value.Descripcion ?? '';
  const match = desc.match(/Apt:\s*([^|]+)/i);
  return match ? match[1].trim() : 'No especificado';
}
function getDetalleImagen(): string {
  if (!incidenciaSeleccionada.value) return '';
  const titulo = incidenciaSeleccionada.value.titulo ?? incidenciaSeleccionada.value.Titulo ?? '';
  const desc = incidenciaSeleccionada.value.descripcion ?? incidenciaSeleccionada.value.Descripcion ?? '';
  const texto = (titulo + ' ' + desc).toLowerCase();
  const images = new Map<string, string>([
    ['ascensor', 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&h=400&fit=crop'],
    ['fontanería', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop'],
    ['fuga', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop'],
    ['agua', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop'],
    ['electricidad', 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=400&fit=crop'],
    ['luz', 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=400&fit=crop'],
    ['puerta', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop'],
    ['portal', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop'],
    ['limpieza', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop'],
    ['basura', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop'],
    ['ruido', 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=600&h=400&fit=crop'],
    ['estructura', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop'],
  ]);
  for (const [keyword, url] of images) {
    if (texto.includes(keyword)) return url;
  }
  return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop';
}
function getStatusClass(estado: string): string {
  const e = estado.toLowerCase();
  if (e === 'nueva') return 'badge-red';
  if (e === 'en proceso') return 'badge-orange';
  if (e === 'resuelta') return 'badge-green';
  if (e === 'asignada') return 'badge-blue';
  return 'badge-grey';
}

onMounted(async () => {
  const token = localStorage.getItem('token');
  if (token && userStore.fincaActivaId) {
    await incidenciaStore.fetchIncidencias();
  }
});
</script>

<template>
  <div class="incidencias-page">
    <Header />

    <div class="page-top">
      <div class="page-info">
        <h2>Incidencias</h2>
        <p>Gestiona las incidencias de la comunidad</p>
      </div>
      <button class="btn-nueva" @click="mostrarModal = true">+ Nueva Incidencia</button>
    </div>

    <div class="filtros-bar">
      <span class="filtro-label">Estado:</span>
      <button
        v-for="f in filtros" :key="f"
        :class="['filtro-btn', { active: filtroActivo === f }]"
        @click="filtroActivo = f"
      >{{ f }}</button>
    </div>

    <p v-if="incidenciaStore.loading" class="info-msg">Cargando incidencias...</p>

    <div v-else-if="incidenciasFiltradas.length > 0" class="cards-grid">
      <IncidenciaCard
        v-for="item in incidenciasFiltradas"
        :key="(item as any).id_incidencias"
        :item="item"
        mode="card"
        @ver-detalle="abrirDetalle"
      />
    </div>

    <div v-else class="empty-state">
      <span class="empty-icon"><i class="icon-file-text"></i></span>
      <h3>No hay incidencias</h3>
      <p>{{ filtroActivo === 'Todas' ? 'Aún no se han reportado incidencias.' : 'No hay incidencias con ese estado.' }}</p>
      <button v-if="filtroActivo === 'Todas'" class="btn-nueva small" @click="mostrarModal = true">+ Reportar la primera</button>
    </div>

    <ModalNuevaIncidencia :show="mostrarModal" @close="mostrarModal = false" />

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
              <h2 class="detalle-titulo">{{ getDetalleTitulo() }}</h2>
              <p class="detalle-desc">{{ getDetalleDescripcion() }}</p>

              <div class="detalle-pills">
                <div class="pill">
                  <span class="pill-icon"><i class="icon-users"></i></span>
                  <div>
                    <small>Reportado por</small>
                    <strong>Apartamento {{ getDetalleApartamento() }}</strong>
                  </div>
                </div>
                <div class="pill">
                  <span class="pill-icon"><i class="icon-bell"></i></span>
                  <div>
                    <small>Fecha de reporte</small>
                    <strong>{{ getDetalleFecha() }}</strong>
                  </div>
                </div>
              </div>

              <div class="detalle-actions">
                <button class="btn-cerrar" @click="cerrarDetalle">Cerrar</button>
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
.incidencias-page {
  background-color: var(--bg-app, #f4f7f6);
  min-height: 100vh;
  padding: 0 30px 30px 30px;
  display: flex;
  flex-direction: column;
}

.page-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.page-info h2 { margin: 0; font-size: 1.6rem; color: var(--text-primary, #1a1a2e); font-weight: 700; }
.page-info p  { margin: 4px 0 0 0; color: var(--text-secondary, #7f8c8d); font-size: 0.9rem; }

.btn-nueva {
  background: #ff8c00; color: white; border: none;
  padding: 14px 28px; border-radius: 30px;
  font-weight: 700; font-size: 0.95rem; cursor: pointer;
  transition: all 0.25s ease; white-space: nowrap;
}
.btn-nueva:hover {
  background: #e67e00; transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(255,140,0,0.25);
}
.btn-nueva.small { padding: 12px 24px; font-size: 0.88rem; }

.filtros-bar {
  display: flex; align-items: center; gap: 8px; margin-bottom: 28px;
}
.filtro-label {
  font-weight: 600; font-size: 0.88rem; margin-right: 4px;
  color: var(--text-secondary, #6b7280);
}
.filtro-btn {
  padding: 8px 20px; border-radius: 10px;
  border: 1.5px solid var(--border-input, #E5E7EB);
  background: var(--bg-card, white);
  color: var(--text-secondary, #6b7280);
  font-weight: 600; font-size: 0.85rem;
  cursor: pointer; transition: 0.2s;
}
.filtro-btn:hover { border-color: #FFD9A0; color: #ff8c00; }
.filtro-btn.active { background: #1a1a2e; color: white; border-color: #1a1a2e; }

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
  flex: 1;
}

.empty-state {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center; padding: 60px 20px;
}
.empty-icon { font-size: 3rem; margin-bottom: 16px; color: var(--text-muted, #d1d5db); }
.empty-icon i { font-size: 3rem; }
.empty-state h3 { margin: 0 0 8px 0; color: var(--text-primary, #374151); font-size: 1.2rem; }
.empty-state p  { margin: 0 0 20px 0; color: var(--text-secondary, #95a5a6); font-size: 0.9rem; }
.info-msg { text-align: center; color: var(--text-secondary, #95a5a6); padding: 40px; font-size: 0.9rem; }

.detalle-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.detalle-card {
  background: var(--bg-card, white);
  width: 100%; max-width: 500px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0,0,0,0.3);
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--border-input, transparent);
}

.detalle-img {
  height: 220px;
  background-size: cover;
  background-position: center;
  background-color: #ddd;
  position: relative;
}
.detalle-badge {
  position: absolute; top: 16px; left: 16px;
  padding: 6px 16px; border-radius: 10px;
  font-size: 0.75rem; font-weight: 700;
  color: white; letter-spacing: 0.5px;
}
.badge-red    { background: #ef4444; }
.badge-orange { background: #f59e0b; }
.badge-green  { background: #22c55e; }
.badge-blue   { background: #3b82f6; }
.badge-grey   { background: #9ca3af; }

.detalle-close {
  position: absolute; top: 16px; right: 16px;
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(0,0,0,0.4); border: none;
  cursor: pointer; font-size: 1.1rem; color: white;
  display: flex; align-items: center; justify-content: center;
  transition: 0.2s;
}
.detalle-close:hover { background: rgba(0,0,0,0.6); }

.detalle-body { padding: 28px; background: var(--bg-card, white); }
.detalle-titulo { margin: 0 0 8px 0; font-size: 1.3rem; font-weight: 700; color: var(--text-primary, #1a1a2e); }
.detalle-desc   { margin: 0 0 24px 0; font-size: 0.92rem; color: var(--text-secondary, #6b7280); line-height: 1.6; }

.detalle-pills {
  display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 28px;
}
.pill {
  display: flex; align-items: center; gap: 12px;
  background: var(--accent-light, #FFF7ED);
  padding: 14px 18px; border-radius: 14px;
  flex: 1; min-width: 180px;
}
.pill-icon {
  width: 36px; height: 36px; background: #ff8c00;
  border-radius: 50%; display: flex; align-items: center;
  justify-content: center; font-size: 1rem; color: white; flex-shrink: 0;
}
.pill small    { display: block; font-size: 0.72rem; color: var(--text-muted, #9ca3af); margin-bottom: 2px; }
.pill strong   { font-size: 0.88rem; color: var(--text-primary, #1a1a2e); }

.detalle-actions { display: flex; flex-direction: column; gap: 12px; }

.btn-cerrar {
  width: 100%; padding: 14px;
  background: var(--bg-input, #F3F4F6);
  border: 1px solid var(--border-input, #e5e7eb);
  border-radius: 30px; font-weight: 600;
  cursor: pointer; color: var(--text-secondary, #6b7280);
  font-size: 0.95rem; transition: 0.2s;
}
.btn-cerrar:hover { opacity: 0.85; }

.admin-estado { display: flex; gap: 12px; }
.estado-select {
  flex: 1; padding: 14px 16px; border-radius: 14px;
  border: 1.5px solid var(--border-input, #E5E7EB);
  background: var(--bg-input, #FAFAFA);
  font-family: inherit; font-size: 0.9rem;
  color: var(--text-primary, #374151); outline: none; cursor: pointer;
}
.estado-select:focus { border-color: #ff8c00; }

.btn-actualizar {
  flex: 1; padding: 14px; background: #ff8c00;
  color: white; border: none; border-radius: 30px;
  font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: 0.25s;
}
.btn-actualizar:hover:not(:disabled) {
  background: #e67e00;
  box-shadow: 0 4px 12px rgba(255,140,0,0.25);
}
.btn-actualizar:disabled { background: #d1d5db; cursor: not-allowed; }

.modal-enter-active { animation: modalIn 0.3s ease; }
.modal-leave-active { animation: modalIn 0.2s ease reverse; }
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

@media (max-width: 1024px) { .cards-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) {
  .incidencias-page { padding: 0 16px 20px; }
  .page-top { flex-direction: column; align-items: flex-start; gap: 16px; }
  .cards-grid { grid-template-columns: 1fr; }
  .filtros-bar { flex-wrap: wrap; }
  .detalle-card { margin: 12px; }
  .admin-estado { flex-direction: column; }
}
</style>