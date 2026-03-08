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

// ── Pagos (vecino) ──
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

// ── Reservas ──
const misReservas = ref<any[]>([]);

// ── Datos admin: toda la comunidad ──
const adminPagos    = ref<any[]>([]);
const adminVecinos  = ref<any[]>([]);
const adminProveedores = ref<any[]>([]);

// KPIs admin
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

// Charts refs — vecino
const chartBar      = ref<HTMLCanvasElement | null>(null);
const chartDoughnut = ref<HTMLCanvasElement | null>(null);
const chartLine     = ref<HTMLCanvasElement | null>(null);

// Charts refs — admin
const chartAdminPagos      = ref<HTMLCanvasElement | null>(null);
const chartAdminMorosos    = ref<HTMLCanvasElement | null>(null);
const chartAdminProveedores = ref<HTMLCanvasElement | null>(null);
const chartAdminIncMes     = ref<HTMLCanvasElement | null>(null);

// Modal detalle incidencia
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

// ── Fetch ──
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

// ── Fetch datos admin ──
async function fetchAdminData(): Promise<void> {
  const token = localStorage.getItem('token');
  const idPiso = userStore.fincaActivaId;
  if (!token || !idPiso || idPiso === 'null') return;

  try {
    const [pagosRes, vecinosRes, provRes] = await Promise.allSettled([
      axios.get(`https://localhost:7152/api/Pagos/piso/${idPiso}`,         { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`https://localhost:7152/api/Pisos/${idPiso}/vecinos`,       { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`https://localhost:7152/api/Proveedores`,                   { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (pagosRes.status  === 'fulfilled') adminPagos.value       = pagosRes.value.data;
    if (vecinosRes.status === 'fulfilled') adminVecinos.value    = vecinosRes.value.data;
    if (provRes.status   === 'fulfilled') adminProveedores.value = provRes.value.data;
  } catch { /* silencioso */ }
}

function formatFechaReserva(f: string): string {
  if (!f) return '';
  return new Date(f).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ── Charts vecino ──
let chartInstances: Chart.Chart[] = [];

function renderCharts(): void {
  chartInstances.forEach(c => c.destroy());
  chartInstances = [];

  if (chartBar.value) {
    chartInstances.push(new Chart.Chart(chartBar.value, {
      type: 'bar',
      data: {
        labels: ['Nuevas', 'En Proceso', 'Resueltas'],
        datasets: [{ label: 'Incidencias', data: [totalNuevas.value, totalProceso.value, totalResueltas.value], backgroundColor: ['#ef4444', '#f59e0b', '#22c55e'], borderRadius: 8, barThickness: 40 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    }));
  }

  if (chartDoughnut.value) {
    const pagado = totalPagado.value || 0;
    const pendiente = totalPendienteEuros.value || 0;
    chartInstances.push(new Chart.Chart(chartDoughnut.value, {
      type: 'doughnut',
      data: { labels: ['Pagado', 'Pendiente'], datasets: [{ data: [pagado || 1, pendiente || 1], backgroundColor: ['#22c55e', '#f59e0b'], borderWidth: 0, cutout: '70%' } as any] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } } } }
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
      data: { labels: meses, datasets: [{ label: 'Incidencias', data: datos, borderColor: '#ff8c00', backgroundColor: 'rgba(255,140,0,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#ff8c00', pointRadius: 5 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    }));
  }

  if (esAdmin.value) renderAdminCharts();
}

// ── Charts admin ──
let adminChartInstances: Chart.Chart[] = [];

function renderAdminCharts(): void {
  adminChartInstances.forEach(c => c.destroy());
  adminChartInstances = [];

  // 1. Barras: recaudado vs pendiente por mes (últimos 6)
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
        plugins: { legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } } },
        scales: { x: { stacked: false }, y: { beginAtZero: true, ticks: { callback: (v) => v + '€' } } }
      }
    }));
  }

  // 2. Doughnut: vecinos al día vs morosos
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
        plugins: { legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } } }
      }
    }));
  }

  // 3. Barras horizontales: top proveedores por valoración
  if (chartAdminProveedores.value) {
    const top = [...adminProveedores.value]
      .filter(p => Number(p.calificacion ?? p.Calificacion ?? 0) > 0)
      .sort((a, b) => Number(b.calificacion ?? b.Calificacion ?? 0) - Number(a.calificacion ?? a.Calificacion ?? 0))
      .slice(0, 5);
    adminChartInstances.push(new Chart.Chart(chartAdminProveedores.value, {
      type: 'bar',
      data: {
        labels: top.map(p => p.nombre ?? p.Nombre ?? 'Proveedor'),
        datasets: [{ label: 'Valoración', data: top.map(p => Number(p.calificacion ?? p.Calificacion ?? 0)), backgroundColor: '#ff8c00', borderRadius: 6, barThickness: 22 }]
      },
      options: {
        indexAxis: 'y' as const,
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, max: 5, ticks: { stepSize: 1 } } }
      }
    }));
  }

  // 4. Línea: incidencias por mes toda la comunidad (igual que vecino pero con todos)
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
        datasets: [{ label: 'Incidencias', data: datos, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#3b82f6', pointRadius: 5 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    }));
  }
}

// ── Init ──
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

    <!-- ══════════════════════════════════════════
         SECCIÓN ADMIN — solo visible para admins
    ══════════════════════════════════════════ -->
    <template v-if="esAdmin">

      <!-- Cabecera admin -->
      <div class="admin-header">
        <div>
          <h2 class="admin-title">📊 Panel de Administración</h2>
          <p class="admin-sub">Resumen en tiempo real de {{ userStore.viviendaNombre }}</p>
        </div>
        <span class="admin-badge">🔑 Admin</span>
      </div>

      <!-- KPIs admin -->
      <div class="admin-kpis">
        <div class="kpi-card kpi-blue">
          <div class="kpi-icon">👥</div>
          <div class="kpi-info">
            <span class="kpi-val">{{ adminVecinos.filter(v => (v.role ?? v.Role) !== 'admin').length }}</span>
            <span class="kpi-label">Vecinos</span>
          </div>
        </div>
        <div class="kpi-card kpi-green">
          <div class="kpi-icon">💰</div>
          <div class="kpi-info">
            <span class="kpi-val">{{ adminTotalRecaudado.toFixed(0) }}€</span>
            <span class="kpi-label">Recaudado</span>
          </div>
        </div>
        <div class="kpi-card kpi-orange">
          <div class="kpi-icon">⏳</div>
          <div class="kpi-info">
            <span class="kpi-val">{{ adminTotalPendiente.toFixed(0) }}€</span>
            <span class="kpi-label">Pendiente cobro</span>
          </div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-icon">⚠️</div>
          <div class="kpi-info">
            <span class="kpi-val">{{ adminVecinosMorosos }}</span>
            <span class="kpi-label">Vecinos con deuda</span>
          </div>
        </div>
        <div class="kpi-card kpi-purple">
          <div class="kpi-icon">✅</div>
          <div class="kpi-info">
            <span class="kpi-val">{{ adminTasaResolucion }}%</span>
            <span class="kpi-label">Tasa resolución</span>
          </div>
        </div>
        <div class="kpi-card kpi-teal">
          <div class="kpi-icon">📋</div>
          <div class="kpi-info">
            <span class="kpi-val">{{ incidencias.length }}</span>
            <span class="kpi-label">Total incidencias</span>
          </div>
        </div>
      </div>

      <!-- Charts admin -->
      <div class="admin-charts">
        <div class="admin-chart-box admin-chart-wide">
          <h4>💳 Pagos por Mes — Recaudado vs Pendiente</h4>
          <div class="chart-wrapper"><canvas ref="chartAdminPagos"></canvas></div>
        </div>
        <div class="admin-chart-box">
          <h4>👥 Estado de Pagos Vecinos</h4>
          <div class="chart-wrapper"><canvas ref="chartAdminMorosos"></canvas></div>
        </div>
        <div class="admin-chart-box">
          <h4>⭐ Top Proveedores</h4>
          <div class="chart-wrapper"><canvas ref="chartAdminProveedores"></canvas></div>
        </div>
        <div class="admin-chart-box">
          <h4>📈 Incidencias Últimos 6 Meses</h4>
          <div class="chart-wrapper"><canvas ref="chartAdminIncMes"></canvas></div>
        </div>
      </div>

      <!-- Tabla morosos -->
      <div class="white-box morosos-box" v-if="adminVecinosMorosos > 0">
        <div class="box-header">
          <h3>🔴 Vecinos con Pagos Pendientes</h3>
          <router-link to="/app/pagos" class="view-all">Ver pagos</router-link>
        </div>
        <table class="morosos-table">
          <thead><tr><th>Vecino</th><th>Concepto</th><th>Importe</th><th>Vencimiento</th></tr></thead>
          <tbody>
            <tr v-for="p in adminPagos.filter(p => (p.estado ?? p.Estado) === 'Pendiente').slice(0, 8)" :key="p.id_pago">
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

      <div class="admin-divider"><span>Vista general de incidencias</span></div>
    </template>

    <!-- ══════════════════════════════════════════
         SECCIÓN COMÚN — vecino y admin
    ══════════════════════════════════════════ -->

    <!-- Stats incidencias -->
    <div class="stats-grid">
      <div class="stat-card"><div><p>Total Incidencias</p><strong>{{ incidencias.length }}</strong></div><div class="icon-bg orange-light">📄</div></div>
      <div class="stat-card"><div><p>Nuevas</p><strong class="text-red">{{ totalNuevas }}</strong></div><div class="icon-bg red-light">❗</div></div>
      <div class="stat-card"><div><p>En Proceso</p><strong class="text-yellow">{{ totalProceso }}</strong></div><div class="icon-bg yellow-light">🕒</div></div>
      <div class="stat-card"><div><p>Resueltas</p><strong class="text-green">{{ totalResueltas }}</strong></div><div class="icon-bg green-light">✅</div></div>
    </div>

    <!-- Charts vecino -->
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
        <div class="white-box">
          <h3>Acciones Rápidas</h3>
          <button class="btn-primary" @click="mostrarModal = true">+ Nueva Incidencia</button>
          <ModalNuevaIncidencia :show="mostrarModal" @close="mostrarModal = false" />
          <button class="btn-outline" @click="$router.push('/app/comunes')">📅 Reservar Zona Común</button>
          <button class="btn-outline" @click="$router.push('/app/documentos')">📄 Ver Documentos</button>
        </div>

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

        <div class="white-box">
          <div class="box-header">
            <h3>📢 Anuncios</h3>
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
.dashboard-container { background-color: #f4f7f6; min-height: 100vh; padding: 0 30px 30px; display: flex; flex-direction: column; }

/* ══ ADMIN HEADER ══ */
.admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.admin-title { margin: 0 0 4px 0; font-size: 1.5rem; color: #1a1a2e; }
.admin-sub { margin: 0; color: #6b7280; font-size: 0.88rem; }
.admin-badge { background: #fff3e0; color: #ff8c00; padding: 6px 16px; border-radius: 20px; font-size: 0.82rem; font-weight: 700; }

/* ══ KPIs ══ */
.admin-kpis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; margin-bottom: 24px; }
.kpi-card { background: white; border-radius: 16px; padding: 18px 16px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); border-left: 4px solid transparent; }
.kpi-blue   { border-left-color: #3b82f6; }
.kpi-green  { border-left-color: #22c55e; }
.kpi-orange { border-left-color: #ff8c00; }
.kpi-red    { border-left-color: #ef4444; }
.kpi-purple { border-left-color: #8b5cf6; }
.kpi-teal   { border-left-color: #14b8a6; }
.kpi-icon { font-size: 1.6rem; flex-shrink: 0; }
.kpi-info { display: flex; flex-direction: column; }
.kpi-val { font-size: 1.4rem; font-weight: 800; color: #1a1a2e; line-height: 1; }
.kpi-label { font-size: 0.72rem; color: #6b7280; margin-top: 3px; font-weight: 500; }

/* ══ CHARTS ADMIN ══ */
.admin-charts { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.admin-chart-box { background: white; border-radius: 18px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
.admin-chart-wide { grid-column: span 1; }
.admin-chart-box h4 { margin: 0 0 14px 0; font-size: 0.88rem; color: #1a1a2e; font-weight: 700; }

/* ══ TABLA MOROSOS ══ */
.morosos-box { margin-bottom: 24px; }
.morosos-table { width: 100%; border-collapse: collapse; }
.morosos-table th { text-align: left; padding: 12px 14px; font-size: 0.78rem; color: #6b7280; font-weight: 700; border-bottom: 2px solid #f3f4f6; }
.morosos-table td { padding: 14px; border-bottom: 1px solid #f3f4f6; font-size: 0.85rem; }
.morosos-table tr:hover { background: #fafafa; }
.vecino-chip { background: #f3f4f6; padding: 4px 10px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; color: #374151; }
.importe-red { color: #ef4444; }
.venc-badge { padding: 3px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; }
.venc-vencido { background: #ffebee; color: #ef4444; }
.venc-ok { background: #f0fdf4; color: #22c55e; }

/* ══ DIVIDER ══ */
.admin-divider { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.admin-divider::before, .admin-divider::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
.admin-divider span { font-size: 0.78rem; color: #9ca3af; font-weight: 600; letter-spacing: 0.5px; white-space: nowrap; }

/* ══ STATS COMUNES ══ */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
.stat-card { background: white; padding: 20px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
.stat-card p { margin: 0 0 4px 0; font-size: 0.82rem; color: #6b7280; }
.stat-card strong { font-size: 1.6rem; font-weight: 800; }
.icon-bg { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; }
.orange-light { background: #fff3e0; } .red-light { background: #ffebee; } .yellow-light { background: #fffde7; } .green-light { background: #e8f5e9; }
.text-red { color: #e53935; } .text-yellow { color: #fbc02d; } .text-green { color: #4caf50; }

/* ══ CHARTS COMUNES ══ */
.charts-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px; }
.chart-box { background: white; border-radius: 18px; padding: 22px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
.chart-box h4 { margin: 0 0 14px 0; font-size: 0.92rem; color: #1a1a2e; font-weight: 700; }
.chart-wrapper { height: 200px; position: relative; }

/* ══ LAYOUT ══ */
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
.payments-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.pay-card { padding: 16px; border-radius: 14px; text-align: center; }
.pay-card p { margin: 0 0 4px 0; font-size: 0.8rem; color: #6b7280; }
.pay-card strong { font-size: 1.4rem; font-weight: 800; }
.green-soft { background: #e8f5e9; } .green-soft strong { color: #22c55e; }
.yellow-soft { background: #fff3e0; } .yellow-soft strong { color: #f59e0b; }
.red-soft { background: #ffebee; } .red-soft strong { color: #ef4444; }

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

/* ══ MODAL ══ */
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

@media (max-width: 1280px) { .admin-kpis { grid-template-columns: repeat(3, 1fr); } .admin-charts { grid-template-columns: 1fr 1fr; } }
@media (max-width: 1024px) { .main-layout-grid { grid-template-columns: 1fr; } .stats-grid { grid-template-columns: repeat(2, 1fr); } .charts-row { grid-template-columns: 1fr; } .admin-charts { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .admin-kpis { grid-template-columns: repeat(2, 1fr); } .dashboard-container { padding: 0 14px 20px; } }
</style>