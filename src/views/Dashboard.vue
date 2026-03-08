<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { useUserStore } from '@/store/userstore';
import axios from 'axios';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import IncidenciaCard from '@/components/IncidenciaCard.vue';
import { useIncidenciaStore } from '@/store/incidenciasStore';
import ModalNuevaIncidencia from '@/components/ModalNuevaIncidencia.vue';
import * as Chart from 'chart.js';

// Registrar componentes de Chart.js
Chart.Chart.register(
  Chart.BarController, Chart.BarElement,
  Chart.DoughnutController, Chart.ArcElement,
  Chart.LineController, Chart.LineElement, Chart.PointElement,
  Chart.CategoryScale, Chart.LinearScale,
  Chart.Tooltip, Chart.Legend, Chart.Filler
);

const userStore = useUserStore();
const incidenciaStore = useIncidenciaStore();
const mostrarModal = ref(false);

const incidencias = computed(() => incidenciaStore.listaIncidencias);
const totalNuevas = computed(() => incidencias.value.filter(i => i.estado === 'Nueva').length);
const totalProceso = computed(() => incidencias.value.filter(i => i.estado === 'En Proceso').length);
const totalResueltas = computed(() => incidencias.value.filter(i => i.estado === 'Resuelta').length);

const esAdmin = computed((): boolean => userStore.userRole === 'admin');

// Pagos
const misPagos = ref<any[]>([]);
const pagosAlDia = computed(() => misPagos.value.filter(p => p.estado === 'Pagado').length);
const pagosPendientes = computed(() => misPagos.value.filter(p => p.estado === 'Pendiente').length);
const pagosVencidos = computed(() => misPagos.value.filter(p => {
  if (p.estado === 'Pagado') return false;
  if (!p.fechaVencimiento) return false;
  return new Date(p.fechaVencimiento) < new Date();
}).length);
const totalPagado = computed(() => misPagos.value.filter(p => p.estado === 'Pagado').reduce((s, p) => s + Number(p.cantidad ?? 0), 0));
const totalPendienteEuros = computed(() => misPagos.value.filter(p => p.estado === 'Pendiente').reduce((s, p) => s + Number(p.cantidad ?? 0), 0));

// Reservas
const misReservas = ref<any[]>([]);

// Charts refs
const chartBar = ref<HTMLCanvasElement | null>(null);
const chartDoughnut = ref<HTMLCanvasElement | null>(null);
const chartLine = ref<HTMLCanvasElement | null>(null);

// Modal detalle
const mostrarDetalle = ref(false);
const incidenciaSeleccionada = ref<Record<string, any> | null>(null);
const nuevoEstado = ref('');
const actualizando = ref(false);

function abrirDetalle(item: Record<string, any>): void {
  incidenciaSeleccionada.value = item;
  nuevoEstado.value = item.estado ?? item.Estado ?? '';
  mostrarDetalle.value = true;
}
function cerrarDetalle(): void { mostrarDetalle.value = false; incidenciaSeleccionada.value = null; }

function getDetalleImagen(): string {
  if (!incidenciaSeleccionada.value) return '';
  const texto = (String(incidenciaSeleccionada.value.titulo ?? '') + ' ' + String(incidenciaSeleccionada.value.descripcion ?? '')).toLowerCase();
  const imgs: Record<string, string> = {
    'ascensor': 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&h=400&fit=crop',
    'agua': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&h=400&fit=crop',
    'electricidad': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&h=400&fit=crop',
    'limpieza': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop',
  };
  for (const [k, v] of Object.entries(imgs)) { if (texto.includes(k)) return v; }
  return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop';
}
function getStatusClass(estado: string): string {
  const e = estado.toLowerCase();
  if (e === 'nueva') return 'badge-red'; if (e === 'en proceso') return 'badge-orange'; if (e === 'resuelta') return 'badge-green'; return 'badge-grey';
}

async function actualizarEstado(): Promise<void> {
  if (!incidenciaSeleccionada.value || !nuevoEstado.value) return;
  const id = incidenciaSeleccionada.value.id_incidencias ?? incidenciaSeleccionada.value.Id_incidencias;
  const token = localStorage.getItem('token');
  actualizando.value = true;
  try {
    await axios.patch(`https://localhost:7152/api/Incidencias/${id}/estado`, JSON.stringify(nuevoEstado.value),
      { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
    await incidenciaStore.fetchIncidencias();
    cerrarDetalle();
    await nextTick();
    renderCharts();
  } catch (err) { console.error(err); }
  finally { actualizando.value = false; }
}

// ===== FETCH DATA =====
async function fetchPagos(): Promise<void> {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  if (!token || !userId) return;
  try {
    const res = await axios.get(`https://localhost:7152/api/Pagos/usuario/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
    misPagos.value = res.data;
  } catch { misPagos.value = []; }
}

async function fetchReservas(): Promise<void> {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  if (!token || !userId) return;
  try {
    const res = await axios.get(`https://localhost:7152/api/Reservas/usuario/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
    misReservas.value = res.data;
  } catch { misReservas.value = []; }
}

function formatFechaReserva(f: string): string {
  if (!f) return ''; return new Date(f).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ===== CHARTS =====
let chartInstances: Chart.Chart[] = [];

function renderCharts(): void {
  // Destroy old
  chartInstances.forEach(c => c.destroy());
  chartInstances = [];

  // 1. Bar chart - Incidencias por estado
  if (chartBar.value) {
    chartInstances.push(new Chart.Chart(chartBar.value, {
      type: 'bar',
      data: {
        labels: ['Nuevas', 'En Proceso', 'Resueltas'],
        datasets: [{
          label: 'Incidencias',
          data: [totalNuevas.value, totalProceso.value, totalResueltas.value],
          backgroundColor: ['#ef4444', '#f59e0b', '#22c55e'],
          borderRadius: 8,
          barThickness: 40
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    }));
  }

  // 2. Doughnut chart - Pagos
  if (chartDoughnut.value) {
    const pagado = totalPagado.value || 0;
    const pendiente = totalPendienteEuros.value || 0;
    chartInstances.push(new Chart.Chart(chartDoughnut.value, {
      type: 'doughnut',
      data: {
        labels: ['Pagado', 'Pendiente'],
        datasets: [{
          data: [pagado || 1, pendiente || 1],
          backgroundColor: ['#22c55e', '#f59e0b'],
          borderWidth: 0,
        // @ts-ignore
          cutout: '70%'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } } }
      }
    }));
  }

  // 3. Line chart - Incidencias por mes (últimos 6 meses)
  if (chartLine.value) {
    const meses: string[] = [];
    const datos: number[] = [];
    const hoy = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      meses.push(d.toLocaleDateString('es-ES', { month: 'short' }));
      const count = incidencias.value.filter(inc => {
        const f = (inc as any).fechaCreacion ?? (inc as any).FechaCreacion;
        if (!f) return false;
        const fd = new Date(f);
        return fd.getMonth() === d.getMonth() && fd.getFullYear() === d.getFullYear();
      }).length;
      datos.push(count);
    }

    chartInstances.push(new Chart.Chart(chartLine.value, {
      type: 'line',
      data: {
        labels: meses,
        datasets: [{
          label: 'Incidencias',
          data: datos,
          borderColor: '#ff8c00',
          backgroundColor: 'rgba(255, 140, 0, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ff8c00',
          pointRadius: 5
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    }));
  }
}

// ===== INIT =====
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
      const res = await axios.get(`https://localhost:7152/api/pisos/mi-vivienda/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data && res.data.length > 0) userStore.setComunidad(String(res.data[0].id_piso), res.data[0].nombre);
    } catch {}
  }
  if (userStore.fincaActivaId && userStore.fincaActivaId !== 'null' && token) {
    await incidenciaStore.fetchIncidencias();
  }
  await fetchPagos();
  await fetchReservas();
  await nextTick();
  renderCharts();
};

onMounted(() => inicializarDashboard());
</script>

<template>
  <div class="dashboard-container">
    <Header />

    <!-- STATS -->
    <div class="stats-grid">
      <div class="stat-card"><div><p>Total Incidencias</p><strong>{{ incidencias.length }}</strong></div><div class="icon-bg orange-light">📄</div></div>
      <div class="stat-card"><div><p>Nuevas</p><strong class="text-red">{{ totalNuevas }}</strong></div><div class="icon-bg red-light">❗</div></div>
      <div class="stat-card"><div><p>En Proceso</p><strong class="text-yellow">{{ totalProceso }}</strong></div><div class="icon-bg yellow-light">🕒</div></div>
      <div class="stat-card"><div><p>Resueltas</p><strong class="text-green">{{ totalResueltas }}</strong></div><div class="icon-bg green-light">✅</div></div>
    </div>

    <!-- CHARTS ROW -->
    <div class="charts-row">
      <div class="chart-box">
        <h4>Incidencias por Estado</h4>
        <div class="chart-wrapper"><canvas ref="chartBar"></canvas></div>
      </div>
      <div class="chart-box">
        <h4>Balance de Pagos</h4>
        <div class="chart-wrapper"><canvas ref="chartDoughnut"></canvas></div>
      </div>
      <div class="chart-box">
        <h4>Incidencias Últimos 6 Meses</h4>
        <div class="chart-wrapper"><canvas ref="chartLine"></canvas></div>
      </div>
    </div>

    <div class="main-layout-grid">
      <div class="left-col">
        <!-- INCIDENCIAS -->
        <section class="white-box">
          <div class="box-header">
            <h3>Últimas Incidencias</h3>
            <router-link to="/app/incidencias" class="view-all">Ver todos</router-link>
          </div>
          <div class="incidencias-list">
            <p v-if="incidenciaStore.loading" class="info-msg">Cargando...</p>
            <IncidenciaCard v-for="item in incidencias.slice(0, 5)" :key="item.id_incidencias" :item="item" mode="card" @ver-detalle="abrirDetalle" />
            <p v-if="incidencias.length === 0 && !incidenciaStore.loading" class="empty-msg">No hay incidencias registradas.</p>
          </div>
        </section>

        <!-- PAGOS -->
        <section class="white-box">
          <div class="box-header">
            <h3>Resumen de Pagos</h3>
            <router-link to="/app/pagos" class="view-all">Ver historial</router-link>
          </div>
          <div class="payments-grid">
            <div class="pay-card green-soft"><p>Pagos al día</p><strong>{{ pagosAlDia }}</strong></div>
            <div class="pay-card yellow-soft"><p>Pendientes</p><strong>{{ pagosPendientes }}</strong></div>
            <div class="pay-card red-soft"><p>Vencidos</p><strong>{{ pagosVencidos }}</strong></div>
          </div>
        </section>
      </div>

      <aside class="right-col">
        <!-- ACCIONES RÁPIDAS -->
        <div class="white-box">
          <h3>Acciones Rápidas</h3>
          <button class="btn-primary" @click="mostrarModal = true">+ Nueva Incidencia</button>
          <ModalNuevaIncidencia :show="mostrarModal" @close="mostrarModal = false" />
          <button class="btn-outline" @click="$router.push('/app/comunes')">📅 Reservar Zona Común</button>
          <button class="btn-outline" @click="$router.push('/app/documentos')">📄 Ver Documentos</button>
        </div>

        <!-- RESERVAS -->
        <div class="white-box">
          <div class="box-header">
            <h3>📅 Mis Reservas</h3>
            <router-link to="/app/comunes" class="view-all">Reservar</router-link>
          </div>
          <div v-if="misReservas.length === 0" class="empty-mini">
            <p>No tienes reservas activas</p>
            <router-link to="/app/comunes" class="link-action">Reservar zona</router-link>
          </div>
          <div v-else>
            <div v-for="r in misReservas.slice(0, 3)" :key="r.id_reserva" class="reserva-item">
              <div class="reserva-left"><span class="reserva-dot"></span><div><strong>{{ r.nombre_zona }}</strong><small>{{ formatFechaReserva(r.fecha) }}</small></div></div>
              <span class="reserva-horario">{{ r.horario }}</span>
            </div>
          </div>
        </div>

        <!-- ANUNCIOS -->
        <div class="white-box">
          <div class="box-header">
            <h3>📢 Anuncios</h3>
            <router-link to="/app/anuncios" class="view-all">Ver todos</router-link>
          </div>
          <p class="empty-mini-text">Consulta el tablón de anuncios</p>
        </div>
      </aside>
    </div>

    <!-- MODAL DETALLE INCIDENCIA -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="mostrarDetalle && incidenciaSeleccionada" class="detalle-overlay" @click.self="cerrarDetalle">
          <div class="detalle-card">
            <div class="detalle-img" :style="{ backgroundImage: 'url(' + getDetalleImagen() + ')' }">
              <span :class="['detalle-badge', getStatusClass(incidenciaSeleccionada.estado ?? '')]">{{ (incidenciaSeleccionada.estado ?? '').toUpperCase() }}</span>
              <button class="detalle-close" @click="cerrarDetalle">✕</button>
            </div>
            <div class="detalle-body">
              <h2>{{ incidenciaSeleccionada.titulo ?? 'Sin título' }}</h2>
              <p class="detalle-desc">{{ (incidenciaSeleccionada.descripcion ?? '').split('|')[0] }}</p>
              <div class="detalle-actions">
                <button class="btn-cerrar-modal" @click="cerrarDetalle">Cerrar</button>
                <div v-if="esAdmin" class="admin-estado">
                  <select v-model="nuevoEstado" class="estado-select">
                    <option value="Nueva">Nueva</option><option value="En Proceso">En Proceso</option><option value="Resuelta">Resuelta</option>
                  </select>
                  <button class="btn-actualizar" @click="actualizarEstado" :disabled="actualizando">{{ actualizando ? 'Guardando...' : 'Actualizar' }}</button>
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
.dashboard-container { background-color: #f4f7f6; min-height: 100vh; padding: 0 30px 30px; display: flex; flex-direction: column; }

/* STATS */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
.stat-card { background: white; padding: 20px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
.stat-card p { margin: 0 0 4px 0; font-size: 0.82rem; color: #6b7280; }
.stat-card strong { font-size: 1.6rem; font-weight: 800; }
.icon-bg { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
.orange-light { background: #fff3e0; } .red-light { background: #ffebee; } .yellow-light { background: #fffde7; } .green-light { background: #e8f5e9; }
.text-red { color: #e53935; } .text-yellow { color: #fbc02d; } .text-green { color: #4caf50; }

/* CHARTS */
.charts-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px; }
.chart-box { background: white; border-radius: 18px; padding: 22px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
.chart-box h4 { margin: 0 0 14px 0; font-size: 0.92rem; color: #1a1a2e; font-weight: 700; }
.chart-wrapper { height: 200px; position: relative; }

/* MAIN GRID */
.main-layout-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 25px; flex: 1; }
.white-box { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); margin-bottom: 25px; }
.box-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.box-header h3 { margin: 0; font-size: 1.05rem; color: #1a1a2e; }
.view-all { color: #ff8c00; font-weight: 600; font-size: 0.85rem; text-decoration: none; }
.view-all:hover { text-decoration: underline; }

.btn-primary { background: #ff8c00; color: white; width: 100%; padding: 16px; border-radius: 30px; border: none; font-weight: bold; cursor: pointer; margin-bottom: 15px; transition: 0.3s; }
.btn-primary:hover { background: #e67e00; transform: translateY(-2px); }
.btn-outline { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #eee; background: #f8f9fa; color: #5d4037; font-weight: bold; margin-bottom: 12px; cursor: pointer; transition: 0.2s; }
.btn-outline:hover { border-color: #ff8c00; color: #ff8c00; }

.empty-msg, .info-msg { text-align: center; color: #95a5a6; padding: 20px; font-size: 0.9rem; }

/* PAYMENTS */
.payments-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.pay-card { padding: 16px; border-radius: 14px; text-align: center; }
.pay-card p { margin: 0 0 4px 0; font-size: 0.8rem; color: #6b7280; }
.pay-card strong { font-size: 1.4rem; font-weight: 800; }
.green-soft { background: #e8f5e9; } .green-soft strong { color: #22c55e; }
.yellow-soft { background: #fff3e0; } .yellow-soft strong { color: #f59e0b; }
.red-soft { background: #ffebee; } .red-soft strong { color: #ef4444; }

/* RESERVAS */
.reserva-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
.reserva-item:last-child { border-bottom: none; }
.reserva-left { display: flex; align-items: center; gap: 10px; }
.reserva-dot { width: 8px; height: 8px; background: #ff8c00; border-radius: 50%; }
.reserva-left strong { display: block; font-size: 0.85rem; color: #1a1a2e; }
.reserva-left small { font-size: 0.72rem; color: #9ca3af; }
.reserva-horario { font-size: 0.75rem; color: #6b7280; background: #f3f4f6; padding: 4px 10px; border-radius: 8px; font-weight: 600; }
.empty-mini { text-align: center; padding: 12px 0; }
.empty-mini p { color: #9ca3af; font-size: 0.82rem; margin: 0 0 6px 0; }
.empty-mini-text { color: #9ca3af; font-size: 0.85rem; margin: 0; }
.link-action { color: #ff8c00; font-weight: 600; font-size: 0.82rem; text-decoration: none; }

/* MODAL DETALLE */
.detalle-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.detalle-card { background: white; width: 100%; max-width: 500px; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
.detalle-img { height: 200px; background-size: cover; background-position: center; position: relative; }
.detalle-badge { position: absolute; top: 16px; left: 16px; padding: 6px 16px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; color: white; }
.badge-red { background: #ef4444; } .badge-orange { background: #f59e0b; } .badge-green { background: #22c55e; } .badge-grey { background: #9ca3af; }
.detalle-close { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.9); border: none; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; }
.detalle-body { padding: 28px; }
.detalle-body h2 { margin: 0 0 8px 0; font-size: 1.3rem; color: #1a1a2e; }
.detalle-desc { margin: 0 0 24px 0; font-size: 0.92rem; color: #6b7280; line-height: 1.6; }
.detalle-actions { display: flex; flex-direction: column; gap: 12px; }
.btn-cerrar-modal { width: 100%; padding: 14px; background: #F3F4F6; border: none; border-radius: 30px; font-weight: 600; cursor: pointer; color: #6B7280; }
.admin-estado { display: flex; gap: 12px; }
.estado-select { flex: 1; padding: 14px; border-radius: 14px; border: 1.5px solid #E5E7EB; background: #FAFAFA; font-family: inherit; outline: none; }
.btn-actualizar { flex: 1; padding: 14px; background: #ff8c00; color: white; border: none; border-radius: 30px; font-weight: 700; cursor: pointer; }
.btn-actualizar:disabled { background: #d1d5db; cursor: not-allowed; }

.modal-enter-active { animation: modalIn 0.3s ease; }
.modal-leave-active { animation: modalIn 0.2s ease reverse; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

@media (max-width: 1024px) {
  .main-layout-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-row { grid-template-columns: 1fr; }
}
</style>