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

const misReservas = ref<any[]>([]);
const adminPagos = ref<any[]>([]);
const adminVecinos = ref<any[]>([]);
const adminProveedores = ref<any[]>([]);

const adminTotalRecaudado = computed(() =>
  adminPagos.value.filter(p => (p.estado ?? p.Estado) === 'Pagado')
    .reduce((s, p) => s + Number(p.cantidad ?? p.Cantidad ?? 0), 0)
);
const adminTotalPendiente = computed(() =>
  adminPagos.value.filter(p => (p.estado ?? p.Estado) === 'Pendiente')
    .reduce((s, p) => s + Number(p.cantidad ?? p.Cantidad ?? 0), 0)
);
const adminVecinosMorosos = computed(() => {
  const ids = new Set(
    adminPagos.value
      .filter(p => (p.estado ?? p.Estado) === 'Pendiente')
      .map(p => p.id_user ?? p.Id_user)
  );
  return ids.size;
});
const adminTasaResolucion = computed(() => {
  const total = incidencias.value.length;
  if (!total) return 0;
  return Math.round((totalResueltas.value / total) * 100);
});

const chartDoughnut = ref<HTMLCanvasElement | null>(null);
const chartLine     = ref<HTMLCanvasElement | null>(null);
const chartAdminPagos       = ref<HTMLCanvasElement | null>(null);
const chartAdminMorosos     = ref<HTMLCanvasElement | null>(null);
const chartAdminProveedores = ref<HTMLCanvasElement | null>(null);
const chartAdminIncMes      = ref<HTMLCanvasElement | null>(null);

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
  if (e === 'nueva') return 'badge-red';
  if (e === 'en proceso') return 'badge-orange';
  if (e === 'resuelta') return 'badge-green';
  return 'badge-grey';
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

async function fetchAdminData(): Promise<void> {
  const token = localStorage.getItem('token');
  const idPiso = userStore.fincaActivaId;
  if (!token || !idPiso || idPiso === 'null') return;
  try {
    const [pagosRes, vecinosRes, provRes] = await Promise.allSettled([
      axios.get(`https://localhost:7152/api/Pagos/piso/${idPiso}`,   { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`https://localhost:7152/api/Pisos/${idPiso}/vecinos`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`https://localhost:7152/api/Proveedores`,             { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (pagosRes.status   === 'fulfilled') adminPagos.value       = pagosRes.value.data;
    if (vecinosRes.status === 'fulfilled') adminVecinos.value     = vecinosRes.value.data;
    if (provRes.status    === 'fulfilled') adminProveedores.value = provRes.value.data;
  } catch { /* silencioso */ }
}

function formatFechaReserva(f: string): string {
  if (!f) return '';
  return new Date(f).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// Colores para charts en modo oscuro
const CHART_TEXT = '#cbd5e1';
const CHART_GRID = 'rgba(255,255,255,0.06)';

let chartInstances: Chart.Chart[] = [];

function renderCharts(): void {
  chartInstances.forEach(c => c.destroy());
  chartInstances = [];

  if (chartDoughnut.value) {
    chartInstances.push(new Chart.Chart(chartDoughnut.value, {
      type: 'doughnut',
      data: {
        labels: ['Pagado', 'Pendiente'],
        datasets: [{ data: [totalPagado.value || 1, totalPendienteEuros.value || 1], backgroundColor: ['#22c55e', '#f59e0b'], borderWidth: 0, cutout: '70%' } as any]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { padding: 14, font: { size: 11 }, color: CHART_TEXT } } }
      }
    }));
  }

  if (chartLine.value) {
    const meses: string[] = [];
    const datos: number[] = [];
    const hoy = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      meses.push(d.toLocaleDateString('es-ES', { month: 'short' }));
      datos.push(incidencias.value.filter(inc => {
        const f = (inc as any).fechaCreacion ?? (inc as any).FechaCreacion;
        if (!f) return false;
        const fd = new Date(f);
        return fd.getMonth() === d.getMonth() && fd.getFullYear() === d.getFullYear();
      }).length);
    }
    chartInstances.push(new Chart.Chart(chartLine.value, {
      type: 'line',
      data: { labels: meses, datasets: [{ label: 'Incidencias', data: datos, borderColor: '#ff8c00', backgroundColor: 'rgba(255,140,0,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#ff8c00', pointRadius: 4 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, color: CHART_TEXT }, grid: { color: CHART_GRID } },
          x: { ticks: { color: CHART_TEXT }, grid: { color: CHART_GRID } }
        }
      }
    }));
  }

  if (esAdmin.value) renderAdminCharts();
}

let adminChartInstances: Chart.Chart[] = [];

function renderAdminCharts(): void {
  adminChartInstances.forEach(c => c.destroy());
  adminChartInstances = [];

  if (chartAdminPagos.value) {
    const meses: string[] = [];
    const recaudado: number[] = [];
    const pendiente: number[] = [];
    const hoy = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      meses.push(d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }));
      const enMes = adminPagos.value.filter(p => {
        const f = p.fechaEmision ?? p.FechaEmision;
        if (!f) return false;
        const fd = new Date(f);
        return fd.getMonth() === d.getMonth() && fd.getFullYear() === d.getFullYear();
      });
      recaudado.push(enMes.filter(p => (p.estado ?? p.Estado) === 'Pagado').reduce((s, p) => s + Number(p.cantidad ?? p.Cantidad ?? 0), 0));
      pendiente.push(enMes.filter(p => (p.estado ?? p.Estado) === 'Pendiente').reduce((s, p) => s + Number(p.cantidad ?? p.Cantidad ?? 0), 0));
    }
    adminChartInstances.push(new Chart.Chart(chartAdminPagos.value, {
      type: 'bar',
      data: {
        labels: meses,
        datasets: [
          { label: 'Recaudado', data: recaudado, backgroundColor: '#22c55e', borderRadius: 6 },
          { label: 'Pendiente', data: pendiente, backgroundColor: '#f59e0b', borderRadius: 6 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 }, color: CHART_TEXT } } },
        scales: {
          x: { ticks: { color: CHART_TEXT }, grid: { color: CHART_GRID } },
          y: { beginAtZero: true, ticks: { callback: (v) => v + '€', color: CHART_TEXT }, grid: { color: CHART_GRID } }
        }
      }
    }));
  }

  if (chartAdminMorosos.value) {
    const morosos = adminVecinosMorosos.value;
    const total = adminVecinos.value.filter(v => (v.role ?? v.Role) !== 'admin').length;
    const alDia = Math.max(0, total - morosos);
    adminChartInstances.push(new Chart.Chart(chartAdminMorosos.value, {
      type: 'doughnut',
      data: {
        labels: ['Al día', 'Con deuda'],
        datasets: [{ data: [alDia || 1, morosos || 0], backgroundColor: ['#22c55e', '#ef4444'], borderWidth: 0, cutout: '68%' } as any]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 }, color: CHART_TEXT } } }
      }
    }));
  }

  if (chartAdminProveedores.value) {
    const top = [...adminProveedores.value]
      .filter(p => Number(p.calificacion ?? p.Calificacion ?? 0) > 0)
      .sort((a, b) => Number(b.calificacion ?? b.Calificacion ?? 0) - Number(a.calificacion ?? a.Calificacion ?? 0))
      .slice(0, 5);
    adminChartInstances.push(new Chart.Chart(chartAdminProveedores.value, {
      type: 'bar',
      data: {
        labels: top.map(p => p.nombre ?? p.Nombre ?? 'Proveedor'),
        datasets: [{ label: 'Valoración', data: top.map(p => Number(p.calificacion ?? p.Calificacion ?? 0)), backgroundColor: '#ff8c00', borderRadius: 6, barThickness: 20 }]
      },
      options: {
        indexAxis: 'y' as const,
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, max: 5, ticks: { stepSize: 1, color: CHART_TEXT }, grid: { color: CHART_GRID } },
          y: { ticks: { color: CHART_TEXT }, grid: { color: CHART_GRID } }
        }
      }
    }));
  }

  if (chartAdminIncMes.value) {
    const meses: string[] = [];
    const datos: number[] = [];
    const hoy = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      meses.push(d.toLocaleDateString('es-ES', { month: 'short' }));
      datos.push(incidencias.value.filter(inc => {
        const f = (inc as any).fechaCreacion ?? (inc as any).FechaCreacion;
        if (!f) return false;
        const fd = new Date(f);
        return fd.getMonth() === d.getMonth() && fd.getFullYear() === d.getFullYear();
      }).length);
    }
    adminChartInstances.push(new Chart.Chart(chartAdminIncMes.value, {
      type: 'line',
      data: {
        labels: meses,
        datasets: [{ label: 'Incidencias', data: datos, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#3b82f6', pointRadius: 4 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, color: CHART_TEXT }, grid: { color: CHART_GRID } },
          x: { ticks: { color: CHART_TEXT }, grid: { color: CHART_GRID } }
        }
      }
    }));
  }
}

const inicializarDashboard = async () => {
  const storedFincaId = localStorage.getItem('fincaActiva');
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  if (!token) return;

  if (storedFincaId && (!userStore.fincaActivaId || userStore.fincaActivaId === 'null'))
    userStore.fincaActivaId = storedFincaId;

  if (userId && (!userStore.fincaActivaId || userStore.fincaActivaId === 'null')) {
    try {
      const res = await axios.get(`https://localhost:7152/api/pisos/mi-vivienda/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data && res.data.length > 0) userStore.setComunidad(String(res.data[0].id_piso), res.data[0].nombre);
    } catch {}
  }

  if (userStore.fincaActivaId && userStore.fincaActivaId !== 'null' && token)
    await incidenciaStore.fetchIncidencias();

  await fetchPagos();
  await fetchReservas();
  if (esAdmin.value) await fetchAdminData();

  await nextTick();
  renderCharts();
};

onMounted(() => inicializarDashboard());
</script>

<template>
  <div class="dashboard-container">
    <Header />

    <!-- ══ ADMIN ══ -->
    <template v-if="esAdmin">
      <div class="admin-header">
        <div>
          <h2 class="admin-title"><i class="icon-stats-dots title-icon"></i> Panel de Administración</h2>
          <p class="admin-sub">Resumen en tiempo real de {{ userStore.viviendaNombre }}</p>
        </div>
        <span class="admin-badge"><i class="icon-lock"></i> Admin</span>
      </div>

      <!-- KPIs -->
      <div class="admin-kpis">
        <div class="kpi-card kpi-blue">
          <div class="kpi-icon"><i class="icon-users"></i></div>
          <div class="kpi-info">
            <span class="kpi-val">{{ adminVecinos.filter(v => (v.role ?? v.Role) !== 'admin').length }}</span>
            <span class="kpi-label">Vecinos</span>
          </div>
        </div>
        <div class="kpi-card kpi-green">
          <div class="kpi-icon"><i class="icon-credit-card"></i></div>
          <div class="kpi-info">
            <span class="kpi-val">{{ adminTotalRecaudado.toFixed(0) }}€</span>
            <span class="kpi-label">Recaudado</span>
          </div>
        </div>
        <div class="kpi-card kpi-orange">
          <div class="kpi-icon"><i class="icon-cog"></i></div>
          <div class="kpi-info">
            <span class="kpi-val">{{ adminTotalPendiente.toFixed(0) }}€</span>
            <span class="kpi-label">Pendiente cobro</span>
          </div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-icon"><i class="icon-warning"></i></div>
          <div class="kpi-info">
            <span class="kpi-val">{{ adminVecinosMorosos }}</span>
            <span class="kpi-label">Con deuda</span>
          </div>
        </div>
        <div class="kpi-card kpi-purple">
          <div class="kpi-icon"><i class="icon-checkmark"></i></div>
          <div class="kpi-info">
            <span class="kpi-val">{{ adminTasaResolucion }}%</span>
            <span class="kpi-label">Tasa resolución</span>
          </div>
        </div>
        <div class="kpi-card kpi-teal">
          <div class="kpi-icon"><i class="icon-file-text"></i></div>
          <div class="kpi-info">
            <span class="kpi-val">{{ incidencias.length }}</span>
            <span class="kpi-label">Incidencias</span>
          </div>
        </div>
      </div>

      <!-- Charts admin — 2x2 -->
      <div class="admin-charts">
        <div class="admin-chart-box">
          <h4><i class="icon-credit-card"></i> Pagos por Mes</h4>
          <div class="chart-wrapper"><canvas ref="chartAdminPagos"></canvas></div>
        </div>
        <div class="admin-chart-box">
          <h4><i class="icon-users"></i> Estado de Pagos Vecinos</h4>
          <div class="chart-wrapper"><canvas ref="chartAdminMorosos"></canvas></div>
        </div>
        <div class="admin-chart-box">
          <h4><i class="icon-stats-dots"></i> Top Proveedores</h4>
          <div class="chart-wrapper"><canvas ref="chartAdminProveedores"></canvas></div>
        </div>
        <div class="admin-chart-box">
          <h4><i class="icon-warning"></i> Incidencias / Mes</h4>
          <div class="chart-wrapper"><canvas ref="chartAdminIncMes"></canvas></div>
        </div>
      </div>

      <!-- Tabla morosos -->
      <div class="dark-box morosos-box" v-if="adminVecinosMorosos > 0">
        <div class="box-header">
          <h3><i class="icon-warning warn-icon"></i> Vecinos con Pagos Pendientes</h3>
          <router-link to="/app/pagos" class="view-all">Ver pagos</router-link>
        </div>
        <table class="morosos-table">
          <thead><tr><th>Vecino</th><th>Concepto</th><th>Importe</th><th>Vencimiento</th></tr></thead>
          <tbody>
            <tr v-for="p in adminPagos.filter(p => (p.estado ?? p.Estado) === 'Pendiente').slice(0, 6)" :key="p.id_pago">
              <td><span class="vecino-chip">{{ p.nombre_usuario ?? '—' }}</span></td>
              <td>{{ p.concepto ?? p.Concepto }}</td>
              <td><strong class="importe-red">{{ Number(p.cantidad ?? p.Cantidad ?? 0).toFixed(2) }}€</strong></td>
              <td><span :class="['venc-badge', new Date(p.fechaVencimiento) < new Date() ? 'venc-vencido' : 'venc-ok']">
                {{ p.fechaVencimiento ? new Date(p.fechaVencimiento).toLocaleDateString('es-ES') : '—' }}
              </span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section-divider"><span>Incidencias de la comunidad</span></div>
    </template>

    <!-- Stats incidencias -->
    <div class="stats-grid">
      <div class="stat-card">
        <div><p>Total</p><strong>{{ incidencias.length }}</strong></div>
        <div class="icon-bg orange-light"><i class="icon-file-text"></i></div>
      </div>
      <div class="stat-card">
        <div><p>Nuevas</p><strong class="text-red">{{ totalNuevas }}</strong></div>
        <div class="icon-bg red-light"><i class="icon-warning"></i></div>
      </div>
      <div class="stat-card">
        <div><p>En Proceso</p><strong class="text-yellow">{{ totalProceso }}</strong></div>
        <div class="icon-bg yellow-light"><i class="icon-bell"></i></div>
      </div>
      <div class="stat-card">
        <div><p>Resueltas</p><strong class="text-green">{{ totalResueltas }}</strong></div>
        <div class="icon-bg green-light"><i class="icon-checkmark"></i></div>
      </div>
    </div>

    <!-- Layout principal -->
    <div class="main-layout-grid">
      <div class="left-col">
        <section class="dark-box">
          <div class="box-header">
            <h3><i class="icon-warning"></i> Últimas Incidencias</h3>
            <router-link to="/app/incidencias" class="view-all">Ver todas</router-link>
          </div>
          <p v-if="incidenciaStore.loading" class="info-msg">Cargando...</p>
          <IncidenciaCard
            v-for="item in incidencias.slice(0, 4)"
            :key="item.id_incidencias"
            :item="item"
            mode="card"
            @ver-detalle="abrirDetalle"
          />
          <p v-if="incidencias.length === 0 && !incidenciaStore.loading" class="empty-msg">No hay incidencias registradas.</p>
        </section>

        <section class="dark-box">
          <div class="box-header">
            <h3><i class="icon-credit-card"></i> Resumen de Pagos</h3>
            <router-link to="/app/pagos" class="view-all">Ver historial</router-link>
          </div>
          <div class="payments-grid">
            <div class="pay-card green-soft"><p>Al día</p><strong>{{ pagosAlDia }}</strong></div>
            <div class="pay-card yellow-soft"><p>Pendientes</p><strong>{{ pagosPendientes }}</strong></div>
            <div class="pay-card red-soft"><p>Vencidos</p><strong>{{ pagosVencidos }}</strong></div>
          </div>
        </section>
      </div>

      <aside class="right-col">
        <div class="dark-box">
          <h3 class="sidebar-title">Acciones Rápidas</h3>
          <button class="btn-primary" @click="mostrarModal = true">
            <i class="icon-warning"></i> Nueva Incidencia
          </button>
          <ModalNuevaIncidencia :show="mostrarModal" @close="mostrarModal = false" />
          <button class="btn-outline" @click="$router.push('/app/comunes')">
            <i class="icon-home3"></i> Reservar Zona Común
          </button>
          <button class="btn-outline" @click="$router.push('/app/documentos')">
            <i class="icon-file-text"></i> Ver Documentos
          </button>
        </div>

        <div class="dark-box chart-sidebar-box" v-if="!esAdmin">
          <h3 class="sidebar-title">Balance de Pagos</h3>
          <div class="chart-wrapper-sm"><canvas ref="chartDoughnut"></canvas></div>
        </div>

        <div class="dark-box chart-sidebar-box" v-if="!esAdmin">
          <h3 class="sidebar-title">Incidencias / Mes</h3>
          <div class="chart-wrapper-sm"><canvas ref="chartLine"></canvas></div>
        </div>

        <div class="dark-box">
          <div class="box-header">
            <h3><i class="icon-home3"></i> Mis Reservas</h3>
            <router-link to="/app/comunes" class="view-all">Reservar</router-link>
          </div>
          <div v-if="misReservas.length === 0" class="empty-mini">
            <p>No tienes reservas activas</p>
            <router-link to="/app/comunes" class="link-action">Reservar zona</router-link>
          </div>
          <div v-else>
            <div v-for="r in misReservas.slice(0, 3)" :key="r.id_reserva" class="reserva-item">
              <div class="reserva-left">
                <span class="reserva-dot"></span>
                <div><strong>{{ r.nombre_zona }}</strong><small>{{ formatFechaReserva(r.fecha) }}</small></div>
              </div>
              <span class="reserva-horario">{{ r.horario }}</span>
            </div>
          </div>
        </div>

        <div class="dark-box">
          <div class="box-header">
            <h3><i class="icon-bullhorn"></i> Anuncios</h3>
            <router-link to="/app/anuncios" class="view-all">Ver todos</router-link>
          </div>
          <p class="empty-mini-text">Consulta el tablón de anuncios</p>
        </div>
      </aside>
    </div>

    <!-- MODAL DETALLE -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="mostrarDetalle && incidenciaSeleccionada" class="detalle-overlay" @click.self="cerrarDetalle">
          <div class="detalle-card">
            <div class="detalle-img" :style="{ backgroundImage: 'url(' + getDetalleImagen() + ')' }">
              <span :class="['detalle-badge', getStatusClass(incidenciaSeleccionada.estado ?? '')]">
                {{ (incidenciaSeleccionada.estado ?? '').toUpperCase() }}
              </span>
              <button class="detalle-close" @click="cerrarDetalle">✕</button>
            </div>
            <div class="detalle-body">
              <h2>{{ incidenciaSeleccionada.titulo ?? 'Sin título' }}</h2>
              <p class="detalle-desc">{{ (incidenciaSeleccionada.descripcion ?? '').split('|')[0] }}</p>
              <div class="detalle-actions">
                <button class="btn-cerrar-modal" @click="cerrarDetalle">Cerrar</button>
                <div v-if="esAdmin" class="admin-estado">
                  <select v-model="nuevoEstado" class="estado-select">
                    <option value="Nueva">Nueva</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Resuelta">Resuelta</option>
                  </select>
                  <button class="btn-actualizar" @click="actualizarEstado" :disabled="actualizando">
                    {{ actualizando ? 'Guardando...' : 'Actualizar' }}
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
@import '@/assets/icomoon/icomoon.css';

.dashboard-container {
  background-color: var(--bg-app, #f4f7f6);
  min-height: 100vh;
  padding: 0 28px 28px;
  display: flex;
  flex-direction: column;
}

/* ══ ADMIN HEADER ══ */
.admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.title-icon { margin-right: 8px; font-size: 1.1rem; vertical-align: middle; color: #ff8c00; }
.admin-title { margin: 0 0 2px 0; font-size: 1.4rem; color: var(--text-primary, #1a1a2e); font-weight: 700; }
.admin-sub { margin: 0; color: var(--text-secondary, #6b7280); font-size: 0.85rem; }
.admin-badge { background: var(--accent-light, #fff3e0); color: #ff8c00; border: 1px solid rgba(255,140,0,0.3); padding: 5px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 5px; }

/* ══ KPIs ══ */
.admin-kpis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 16px; }
.kpi-card { background: var(--bg-card, white); border-radius: 14px; padding: 16px 14px; display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-left: 4px solid transparent; }
.kpi-blue   { border-left-color: #3b82f6; } .kpi-green  { border-left-color: #22c55e; }
.kpi-orange { border-left-color: #ff8c00; } .kpi-red    { border-left-color: #ef4444; }
.kpi-purple { border-left-color: #8b5cf6; } .kpi-teal   { border-left-color: #14b8a6; }
.kpi-icon { font-size: 1.5rem; flex-shrink: 0; }
.kpi-blue   .kpi-icon i { color: #3b82f6; } .kpi-green  .kpi-icon i { color: #22c55e; }
.kpi-orange .kpi-icon i { color: #ff8c00; } .kpi-red    .kpi-icon i { color: #ef4444; }
.kpi-purple .kpi-icon i { color: #8b5cf6; } .kpi-teal   .kpi-icon i { color: #14b8a6; }
.kpi-info { display: flex; flex-direction: column; }
.kpi-val { font-size: 1.3rem; font-weight: 800; color: var(--text-primary, #1a1a2e); line-height: 1; }
.kpi-label { font-size: 0.68rem; color: var(--text-secondary, #6b7280); margin-top: 2px; font-weight: 500; }

/* ══ CHARTS ADMIN 2x2 ══ */
.admin-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
.admin-chart-box { background: var(--bg-card, white); border-radius: 16px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid var(--border-input, transparent); }
.admin-chart-box h4 { margin: 0 0 14px 0; font-size: 0.86rem; color: var(--text-primary, #1a1a2e); font-weight: 700; display: flex; align-items: center; gap: 6px; }
.admin-chart-box h4 i { color: #ff8c00; }
.chart-wrapper { height: 220px; position: relative; }

/* ══ MOROSOS ══ */
.morosos-box { margin-bottom: 16px; }
.warn-icon { color: #ef4444; margin-right: 6px; }
.morosos-table { width: 100%; border-collapse: collapse; }
.morosos-table th { text-align: left; padding: 10px 12px; font-size: 0.75rem; color: var(--text-secondary, #6b7280); font-weight: 700; border-bottom: 2px solid var(--border-input, #f3f4f6); }
.morosos-table td { padding: 11px 12px; border-bottom: 1px solid var(--border-input, #f3f4f6); font-size: 0.83rem; color: var(--text-primary, #374151); }
.morosos-table tr:hover td { background: var(--bg-input, #fafafa); }
.vecino-chip { background: var(--bg-input, #f3f4f6); padding: 3px 9px; border-radius: 7px; font-size: 0.78rem; font-weight: 600; color: var(--text-primary, #374151); }
.importe-red { color: #ef4444; }
.venc-badge { padding: 3px 9px; border-radius: 7px; font-size: 0.73rem; font-weight: 600; }
.venc-vencido { background: rgba(239,68,68,0.15); color: #ef4444; }
.venc-ok { background: rgba(34,197,94,0.15); color: #22c55e; }

/* ══ DIVIDER ══ */
.section-divider { display: flex; align-items: center; gap: 12px; margin: 4px 0 16px; }
.section-divider::before, .section-divider::after { content: ''; flex: 1; height: 1px; background: var(--border-input, #e5e7eb); }
.section-divider span { font-size: 0.74rem; color: var(--text-muted, #9ca3af); font-weight: 600; letter-spacing: 0.5px; white-space: nowrap; }

/* ══ STATS INCIDENCIAS ══ */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
.stat-card { background: var(--bg-card, white); padding: 18px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid var(--border-input, transparent); }
.stat-card p { margin: 0 0 3px 0; font-size: 0.78rem; color: var(--text-secondary, #6b7280); }
.stat-card strong { font-size: 1.5rem; font-weight: 800; color: var(--text-primary, #1a1a2e); }
.icon-bg { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
.orange-light { background: rgba(255,140,0,0.12); } .orange-light i { color: #ff8c00; }
.red-light    { background: rgba(239,68,68,0.12); } .red-light i    { color: #ef4444; }
.yellow-light { background: rgba(245,158,11,0.12); } .yellow-light i { color: #f59e0b; }
.green-light  { background: rgba(34,197,94,0.12); } .green-light i  { color: #22c55e; }
.text-red { color: #ef4444; } .text-yellow { color: #f59e0b; } .text-green { color: #22c55e; }

/* ══ LAYOUT ══ */
.main-layout-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; flex: 1; }
.left-col { display: flex; flex-direction: column; }
.right-col { display: flex; flex-direction: column; }

/* dark-box = la card blanca/oscura universal */
.dark-box {
  background: var(--bg-card, white);
  padding: 22px;
  border-radius: 18px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  margin-bottom: 14px;
  border: 1px solid var(--border-input, transparent);
}
.box-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.box-header h3 { margin: 0; font-size: 1rem; color: var(--text-primary, #1a1a2e); display: flex; align-items: center; gap: 7px; font-weight: 700; }
.box-header h3 i { color: #ff8c00; font-size: 0.95rem; }
.sidebar-title { margin: 0 0 16px 0; font-size: 1rem; color: var(--text-primary, #1a1a2e); font-weight: 700; }
.view-all { color: #ff8c00; font-weight: 600; font-size: 0.82rem; text-decoration: none; }
.view-all:hover { text-decoration: underline; }

/* ══ BOTONES ══ */
.btn-primary { background: #ff8c00; color: white; width: 100%; padding: 13px; border-radius: 30px; border: none; font-weight: 700; cursor: pointer; margin-bottom: 10px; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.9rem; }
.btn-primary:hover { background: #e67e00; transform: translateY(-1px); }
.btn-outline { width: 100%; padding: 11px; border-radius: 11px; border: 1px solid var(--border-input, #eee); background: var(--bg-input, #f8f9fa); color: var(--text-primary, #374151); font-weight: 600; margin-bottom: 10px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.88rem; }
.btn-outline i { color: #ff8c00; font-size: 0.9rem; }
.btn-outline:hover { border-color: #ff8c00; color: #ff8c00; }

/* ══ CHARTS SIDEBAR ══ */
.chart-wrapper-sm { height: 160px; position: relative; }

/* ══ PAGOS ══ */
.payments-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.pay-card { padding: 14px; border-radius: 12px; text-align: center; }
.pay-card p { margin: 0 0 4px 0; font-size: 0.78rem; color: var(--text-secondary, #6b7280); }
.pay-card strong { font-size: 1.3rem; font-weight: 800; }
.green-soft  { background: rgba(34,197,94,0.12); }  .green-soft  strong { color: #22c55e; }
.yellow-soft { background: rgba(245,158,11,0.12); } .yellow-soft strong { color: #f59e0b; }
.red-soft    { background: rgba(239,68,68,0.12); }  .red-soft    strong { color: #ef4444; }

/* ══ RESERVAS ══ */
.reserva-item { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-bottom: 1px solid var(--border-input, #f3f4f6); }
.reserva-item:last-child { border-bottom: none; }
.reserva-left { display: flex; align-items: center; gap: 9px; }
.reserva-dot { width: 7px; height: 7px; background: #ff8c00; border-radius: 50%; flex-shrink: 0; }
.reserva-left strong { display: block; font-size: 0.83rem; color: var(--text-primary, #1a1a2e); }
.reserva-left small { font-size: 0.7rem; color: var(--text-muted, #9ca3af); }
.reserva-horario { font-size: 0.72rem; color: var(--text-secondary, #6b7280); background: var(--bg-input, #f3f4f6); padding: 3px 9px; border-radius: 7px; font-weight: 600; }
.empty-mini { text-align: center; padding: 10px 0; }
.empty-mini p { color: var(--text-muted, #9ca3af); font-size: 0.8rem; margin: 0 0 5px 0; }
.empty-mini-text { color: var(--text-muted, #9ca3af); font-size: 0.82rem; margin: 0; }
.link-action { color: #ff8c00; font-weight: 600; font-size: 0.8rem; text-decoration: none; }
.empty-msg, .info-msg { text-align: center; color: var(--text-secondary, #95a5a6); padding: 16px; font-size: 0.88rem; }

/* ══ MODAL ══ */
.detalle-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.detalle-card { background: var(--bg-card, white); width: 100%; max-width: 480px; border-radius: 22px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto; border: 1px solid var(--border-input, transparent); }
.detalle-img { height: 190px; background-size: cover; background-position: center; position: relative; }
.detalle-badge { position: absolute; top: 14px; left: 14px; padding: 5px 14px; border-radius: 9px; font-size: 0.73rem; font-weight: 700; color: white; }
.badge-red { background: #ef4444; } .badge-orange { background: #f59e0b; } .badge-green { background: #22c55e; } .badge-grey { background: #9ca3af; }
.detalle-close { position: absolute; top: 14px; right: 14px; width: 34px; height: 34px; border-radius: 50%; background: rgba(0,0,0,0.4); border: none; cursor: pointer; font-size: 1rem; color: white; display: flex; align-items: center; justify-content: center; }
.detalle-body { padding: 24px; background: var(--bg-card, white); }
.detalle-body h2 { margin: 0 0 8px 0; font-size: 1.2rem; color: var(--text-primary, #1a1a2e); }
.detalle-desc { margin: 0 0 20px 0; font-size: 0.9rem; color: var(--text-secondary, #6b7280); line-height: 1.6; }
.detalle-actions { display: flex; flex-direction: column; gap: 10px; }
.btn-cerrar-modal { width: 100%; padding: 13px; background: var(--bg-input, #f3f4f6); border: 1px solid var(--border-input, #e5e7eb); border-radius: 28px; font-weight: 600; cursor: pointer; color: var(--text-secondary, #6b7280); }
.admin-estado { display: flex; gap: 10px; }
.estado-select { flex: 1; padding: 13px; border-radius: 13px; border: 1.5px solid var(--border-input, #e5e7eb); background: var(--bg-input, #fafafa); font-family: inherit; outline: none; color: var(--text-primary, #374151); }
.btn-actualizar { flex: 1; padding: 13px; background: #ff8c00; color: white; border: none; border-radius: 28px; font-weight: 700; cursor: pointer; }
.btn-actualizar:disabled { background: #d1d5db; cursor: not-allowed; }

.modal-enter-active { animation: modalIn 0.3s ease; }
.modal-leave-active { animation: modalIn 0.2s ease reverse; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

/* ══ RESPONSIVE ══ */
@media (max-width: 1280px) { .admin-kpis { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 1024px) { .admin-charts { grid-template-columns: 1fr; } .main-layout-grid { grid-template-columns: 1fr; } .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .admin-kpis { grid-template-columns: repeat(2, 1fr); } .dashboard-container { padding: 0 14px 20px; } }
</style>