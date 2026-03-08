<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import { useUserStore } from '@/store/userstore';
import { useUiStore } from '@/store/Uistore';
import axios from 'axios';
import '@/assets/icomoon/icomoon.css';

const userStore = useUserStore();
const ui = useUiStore();

const pagos = ref<any[]>([]);
const loading = ref(false);
const esAdmin = computed((): boolean => userStore.userRole === 'admin');

const totalPagado = computed(() =>
  pagos.value.filter(p => (p.estado ?? p.Estado) === 'Pagado')
    .reduce((sum, p) => sum + Number(p.cantidad ?? p.Cantidad ?? 0), 0)
);
const totalPendiente = computed(() =>
  pagos.value.filter(p => (p.estado ?? p.Estado) === 'Pendiente')
    .reduce((sum, p) => sum + Number(p.cantidad ?? p.Cantidad ?? 0), 0)
);
const proximoPago = computed(() => {
  const pendientes = pagos.value
    .filter(p => (p.estado ?? p.Estado) === 'Pendiente')
    .sort((a, b) => new Date(a.fechaVencimiento ?? '').getTime() - new Date(b.fechaVencimiento ?? '').getTime());
  return pendientes[0] ?? null;
});

const mostrarCrear = ref(false);
const nuevoPago = ref({ concepto: '', cantidad: 0, fechaVencimiento: '', id_user: 0 });
const vecinosPiso = ref<any[]>([]);
const confirmandoPagar = ref<number | null>(null);
const confirmandoEliminar = ref<number | null>(null);

async function fetchPagos(): Promise<void> {
  const token = localStorage.getItem('token');
  if (!token) return;
  loading.value = true;
  try {
    if (esAdmin.value) {
      const idPiso = userStore.fincaActivaId;
      if (!idPiso) return;
      const res = await axios.get(`https://localhost:7152/api/Pagos/piso/${idPiso}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      pagos.value = res.data;
    } else {
      const userId = localStorage.getItem('userId');
      const res = await axios.get(`https://localhost:7152/api/Pagos/usuario/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      pagos.value = res.data;
    }
  } catch (err) { console.error(err); }
  finally { loading.value = false; }
}

async function fetchVecinos(): Promise<void> {
  const token = localStorage.getItem('token');
  const idPiso = userStore.fincaActivaId;
  if (!token || !idPiso || idPiso === 'null') return;
  try {
    const res = await axios.get(`https://localhost:7152/api/Pisos/${idPiso}/vecinos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    vecinosPiso.value = res.data.filter((v: any) => (v.role ?? v.Role) !== 'admin');
  } catch { vecinosPiso.value = []; }
}

async function crearPago(): Promise<void> {
  if (!nuevoPago.value.concepto || !nuevoPago.value.cantidad || !nuevoPago.value.id_user) {
    ui.warn('Campos obligatorios', 'Rellena concepto, cantidad y vecino');
    return;
  }
  const token = localStorage.getItem('token');
  try {
    await axios.post('https://localhost:7152/api/Pagos', {
      concepto: nuevoPago.value.concepto,
      cantidad: nuevoPago.value.cantidad,
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaVencimiento: nuevoPago.value.fechaVencimiento || null,
      estado: 'Pendiente',
      id_user: nuevoPago.value.id_user,
      id_piso: Number(userStore.fincaActivaId)
    }, { headers: { Authorization: `Bearer ${token}` } });
    ui.success('Recibo creado', 'El pago se ha generado correctamente');
    nuevoPago.value = { concepto: '', cantidad: 0, fechaVencimiento: '', id_user: 0 };
    mostrarCrear.value = false;
    await fetchPagos();
  } catch { ui.error('Error', 'No se pudo crear el pago'); }
}

async function pagarRecibo(): Promise<void> {
  if (!confirmandoPagar.value) return;
  const token = localStorage.getItem('token');
  try {
    await axios.patch(`https://localhost:7152/api/Pagos/${confirmandoPagar.value}/pagar`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ui.success('Pago realizado', 'Recibo marcado como pagado');
    confirmandoPagar.value = null;
    await fetchPagos();
  } catch { ui.error('Error', 'No se pudo procesar el pago'); }
}

async function eliminarPago(): Promise<void> {
  if (!confirmandoEliminar.value) return;
  const token = localStorage.getItem('token');
  try {
    await axios.delete(`https://localhost:7152/api/Pagos/${confirmandoEliminar.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ui.success('Eliminado', 'El recibo ha sido eliminado');
    confirmandoEliminar.value = null;
    await fetchPagos();
  } catch { ui.error('Error', 'No se pudo eliminar'); }
}

// ══════════════════════════════════════════════
//  GENERAR PDF RECIBO — canvas nativo, sin librerías
// ══════════════════════════════════════════════
function descargarRecibo(pago: any): void {
  const canvas = document.createElement('canvas');
  canvas.width = 794;   // A4 a 96 dpi
  canvas.height = 1123;
  const ctx = canvas.getContext('2d')!;

  const concepto    = pago.concepto ?? pago.Concepto ?? '-';
  const cantidad    = Number(pago.cantidad ?? pago.Cantidad ?? 0).toFixed(2);
  const estado      = pago.estado ?? pago.Estado ?? '-';
  const vecino      = pago.nombre_usuario ?? userStore.userName ?? '-';
  const comunidad   = userStore.viviendaNombre ?? '-';
  const idPago      = pago.id_pago ?? pago.Id_pago ?? '-';
  const fechaEmision = formatFecha(pago.fechaEmision ?? pago.FechaEmision ?? new Date().toISOString());
  const fechaVenc   = formatFecha(pago.fechaVencimiento ?? pago.FechaVencimiento ?? null);
  const fechaPago   = formatFecha(pago.fechaPago ?? pago.FechaPago ?? null);
  const esPagado    = estado === 'Pagado';

  // ── Fondo ──
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ── Franja superior naranja ──
  ctx.fillStyle = '#ff8c00';
  ctx.fillRect(0, 0, canvas.width, 120);

  // ── Logo / título en franja ──
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px Arial';
  ctx.fillText('GesFincas', 48, 58);
  ctx.font = '16px Arial';
  ctx.fillText('Recibo de Pago Comunitario', 48, 88);

  // ── Número de recibo (derecha) ──
  ctx.textAlign = 'right';
  ctx.font = 'bold 14px Arial';
  ctx.fillText(`Recibo #${idPago}`, canvas.width - 48, 58);
  ctx.font = '13px Arial';
  ctx.fillText(`Emitido: ${fechaEmision}`, canvas.width - 48, 80);
  ctx.textAlign = 'left';

  // ── Badge estado ──
  const badgeX = canvas.width - 160;
  const badgeY = 140;
  ctx.fillStyle = esPagado ? '#dcfce7' : '#fff3e0';
  roundRect(ctx, badgeX, badgeY, 120, 36, 18);
  ctx.fill();
  ctx.fillStyle = esPagado ? '#16a34a' : '#f59e0b';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(esPagado ? '✓  PAGADO' : '⏳  PENDIENTE', badgeX + 60, badgeY + 24);
  ctx.textAlign = 'left';

  // ── Separador ──
  ctx.strokeStyle = '#f3f4f6';
  ctx.lineWidth = 1.5;
  line(ctx, 48, 200, canvas.width - 48, 200);

  // ── Sección datos ──
  let y = 240;
  const labelColor = '#6b7280';
  const valueColor = '#1a1a2e';

  function drawRow(label: string, value: string, bold = false) {
    ctx.fillStyle = labelColor;
    ctx.font = '13px Arial';
    ctx.fillText(label, 48, y);
    ctx.fillStyle = valueColor;
    ctx.font = bold ? 'bold 15px Arial' : '14px Arial';
    ctx.fillText(value, 260, y);
    y += 44;
  }

  drawRow('Concepto:', concepto, true);
  drawRow('Vecino / Titular:', vecino);
  drawRow('Comunidad:', comunidad);
  drawRow('Fecha de emisión:', fechaEmision);
  drawRow('Fecha de vencimiento:', fechaVenc || 'Sin vencimiento');
  if (esPagado && fechaPago) drawRow('Fecha de pago:', fechaPago);

  // ── Separador ──
  line(ctx, 48, y + 10, canvas.width - 48, y + 10);
  y += 40;

  // ── Caja importe total ──
  ctx.fillStyle = '#fff8f0';
  roundRect(ctx, 48, y, canvas.width - 96, 90, 16);
  ctx.fill();

  ctx.fillStyle = '#6b7280';
  ctx.font = '14px Arial';
  ctx.fillText('IMPORTE TOTAL', 80, y + 34);

  ctx.fillStyle = '#ff8c00';
  ctx.font = 'bold 42px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`${cantidad} €`, canvas.width - 80, y + 72);
  ctx.textAlign = 'left';

  y += 120;

  // ── Nota si está pagado ──
  if (esPagado) {
    ctx.fillStyle = '#dcfce7';
    roundRect(ctx, 48, y, canvas.width - 96, 60, 12);
    ctx.fill();
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✓  Este recibo ha sido pagado correctamente', canvas.width / 2, y + 36);
    ctx.textAlign = 'left';
    y += 80;
  }

  // ── Línea separadora inferior ──
  line(ctx, 48, canvas.height - 80, canvas.width - 48, canvas.height - 80);

  // ── Footer ──
  ctx.fillStyle = '#9ca3af';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('GesFincas — Sistema de Gestión de Comunidades', canvas.width / 2, canvas.height - 50);
  ctx.fillText(`Documento generado el ${new Date().toLocaleDateString('es-ES')}`, canvas.width / 2, canvas.height - 30);

  // ── Descargar ──
  const link = document.createElement('a');
  link.download = `recibo_${idPago}_${concepto.replace(/\s+/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();

  ui.success('Recibo descargado', `Recibo #${idPago} generado correctamente`);
}

// Helpers canvas
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function formatFecha(fecha: string | null): string {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getEstado(pago: any): string { return pago.estado ?? pago.Estado ?? 'Pendiente'; }

function abrirCrear(): void {
  mostrarCrear.value = !mostrarCrear.value;
  if (mostrarCrear.value) fetchVecinos();
}

onMounted(() => fetchPagos());
</script>

<template>
  <div class="pagos-page">
    <Header />

    <div class="page-top">
      <div class="page-info">
        <h2><i class="icon-credit-card title-icon"></i> Gestión de Pagos</h2>
        <p>Consulta y gestiona tus pagos comunitarios</p>
      </div>
      <button v-if="esAdmin" class="btn-nueva" @click="abrirCrear">
        {{ mostrarCrear ? '✕ Cancelar' : '+ Nuevo Recibo' }}
      </button>
    </div>

    <!-- STATS -->
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-top"><span>Total Pagado</span><i class="icon-checkmark stat-icon-i green"></i></div>
        <strong class="stat-num green-text">{{ totalPagado.toFixed(2) }}€</strong>
      </div>
      <div class="stat-box">
        <div class="stat-top"><span>Total Pendiente</span><i class="icon-cog stat-icon-i orange"></i></div>
        <strong class="stat-num orange-text">{{ totalPendiente.toFixed(2) }}€</strong>
      </div>
      <div class="stat-box highlight" v-if="proximoPago">
        <div class="stat-top"><span>Próximo Pago</span></div>
        <strong class="stat-num">{{ Number(proximoPago.cantidad ?? 0).toFixed(2) }}€</strong>
        <small>Vence: {{ formatFecha(proximoPago.fechaVencimiento) }}</small>
        <button class="btn-pagar-inline" @click="confirmandoPagar = proximoPago.id_pago ?? proximoPago.Id_pago">Pagar ahora</button>
      </div>
    </div>

    <!-- FORMULARIO NUEVO PAGO -->
    <Transition name="slide">
      <div v-if="mostrarCrear" class="form-box">
        <h3>Nuevo Recibo</h3>
        <div class="form-grid">
          <div class="input-group">
            <label>Concepto <span class="req">*</span></label>
            <input v-model="nuevoPago.concepto" type="text" class="form-input" placeholder="Ej: Cuota mensual enero" />
          </div>
          <div class="input-group">
            <label>Cantidad (€) <span class="req">*</span></label>
            <input v-model="nuevoPago.cantidad" type="number" class="form-input" placeholder="0.00" step="0.01" min="0" />
          </div>
          <div class="input-group">
            <label>Fecha de vencimiento</label>
            <input v-model="nuevoPago.fechaVencimiento" type="date" class="form-input" />
          </div>
          <div class="input-group">
            <label>Vecino <span class="req">*</span></label>
            <select v-model="nuevoPago.id_user" class="form-input">
              <option :value="0" disabled>Seleccionar vecino</option>
              <option v-for="v in vecinosPiso" :key="v.id_user ?? v.Id_user" :value="v.id_user ?? v.Id_user">
                {{ v.name ?? v.Name ?? v.nombre ?? 'Vecino' }}
              </option>
            </select>
          </div>
        </div>
        <button class="btn-publicar" @click="crearPago">Generar Recibo</button>
      </div>
    </Transition>

    <!-- TABLA -->
    <div class="tabla-box">
      <h3>Historial de Pagos</h3>
      <p v-if="loading" class="info-msg">Cargando pagos...</p>
      <div v-else-if="pagos.length === 0" class="empty-state">
        <i class="icon-credit-card empty-icon-i"></i>
        <h3>No hay pagos registrados</h3>
        <p>{{ esAdmin ? 'Genera el primer recibo.' : 'No tienes recibos.' }}</p>
      </div>
      <table v-else class="pagos-table">
        <thead>
          <tr>
            <th>Concepto</th>
            <th v-if="esAdmin">Vecino</th>
            <th>Importe</th>
            <th>Vencimiento</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in pagos" :key="p.id_pago ?? p.Id_pago">
            <td><strong>{{ p.concepto ?? p.Concepto }}</strong></td>
            <td v-if="esAdmin"><span class="vecino-name">{{ p.nombre_usuario ?? '-' }}</span></td>
            <td><strong>{{ Number(p.cantidad ?? p.Cantidad ?? 0).toFixed(2) }}€</strong></td>
            <td>
              <span>{{ formatFecha(p.fechaVencimiento ?? p.FechaVencimiento) }}</span>
              <small v-if="getEstado(p) === 'Pagado' && (p.fechaPago ?? p.FechaPago)" class="fecha-pago">
                Pagado: {{ formatFecha(p.fechaPago ?? p.FechaPago) }}
              </small>
            </td>
            <td>
              <span :class="['estado-badge', getEstado(p) === 'Pagado' ? 'badge-pagado' : 'badge-pendiente']">
                {{ getEstado(p) === 'Pagado' ? '✔' : '' }} {{ getEstado(p).toUpperCase() }}
              </span>
            </td>
            <td class="acciones-cell">
              <!-- Pagar si está pendiente -->
              <button v-if="getEstado(p) === 'Pendiente'" class="btn-pagar"
                @click="confirmandoPagar = p.id_pago ?? p.Id_pago">Pagar</button>

              <!-- Descargar recibo siempre disponible -->
              <button class="btn-recibo" @click="descargarRecibo(p)" title="Descargar recibo">
                 Recibo
              </button>

              <button v-if="esAdmin" class="btn-eliminar-pago"
                @click="confirmandoEliminar = p.id_pago ?? p.Id_pago"><i class="icon-bin"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL CONFIRMAR PAGO -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="confirmandoPagar" class="modal-overlay" @click.self="confirmandoPagar = null">
          <div class="confirm-card">
            <i class="icon-credit-card confirm-icon-i"></i>
            <h3>¿Confirmar pago?</h3>
            <p>Se marcará como pagado con fecha de hoy.</p>
            <div class="confirm-actions">
              <button class="btn-cancel" @click="confirmandoPagar = null">Cancelar</button>
              <button class="btn-confirm-pay" @click="pagarRecibo">Confirmar Pago</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- MODAL CONFIRMAR ELIMINAR -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="confirmandoEliminar" class="modal-overlay" @click.self="confirmandoEliminar = null">
          <div class="confirm-card">
            <i class="icon-bin confirm-icon-i"></i>
            <h3>¿Eliminar este recibo?</h3>
            <p>Esta acción no se puede deshacer.</p>
            <div class="confirm-actions">
              <button class="btn-cancel" @click="confirmandoEliminar = null">Cancelar</button>
              <button class="btn-delete" @click="eliminarPago">Eliminar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Footer />
  </div>
</template>

<style scoped>
.pagos-page { background-color: #f4f7f6; min-height: 100vh; padding: 0 30px 30px; display: flex; flex-direction: column; }
.page-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-info h2 { margin: 0; font-size: 1.6rem; color: #1a1a2e; }
.page-info p { margin: 4px 0 0 0; color: #7f8c8d; font-size: 0.9rem; }
.btn-nueva { background: #ff8c00; color: white; border: none; padding: 14px 28px; border-radius: 30px; font-weight: 700; cursor: pointer; }
.btn-nueva:hover { background: #e67e00; }

.stats-row { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 20px; margin-bottom: 28px; }
.stat-box { background: white; padding: 24px; border-radius: 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
.stat-box.highlight { background: #FFF7ED; border: 1.5px solid #FFE8CC; display: flex; flex-direction: column; gap: 4px; }
.stat-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.stat-top span:first-child { font-size: 0.85rem; color: #6b7280; font-weight: 600; }
.stat-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.stat-icon.green { background: #e8f5e9; } .stat-icon.orange { background: #fff3e0; }
.stat-num { font-size: 1.8rem; font-weight: 800; color: #1a1a2e; }
.green-text { color: #22c55e; } .orange-text { color: #f59e0b; }
.stat-box small { font-size: 0.78rem; color: #9ca3af; }
.btn-pagar-inline { align-self: flex-end; background: #ff8c00; color: white; border: none; padding: 10px 24px; border-radius: 30px; font-weight: 700; font-size: 0.85rem; cursor: pointer; margin-top: 4px; }

.form-box { background: white; border-radius: 20px; padding: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); margin-bottom: 28px; }
.form-box h3 { margin: 0 0 20px 0; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.input-group { margin-bottom: 16px; }
.input-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.88rem; color: #374151; }
.req { color: #ff8c00; }
.form-input { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1.5px solid #E5E7EB; background: #FAFAFA; font-family: inherit; font-size: 0.95rem; box-sizing: border-box; outline: none; }
.form-input:focus { border-color: #ff8c00; }
.btn-publicar { width: 100%; padding: 15px; background: #ff8c00; color: white; border: none; border-radius: 30px; font-weight: 700; cursor: pointer; margin-top: 8px; }

.tabla-box { background: white; border-radius: 20px; padding: 28px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); flex: 1; }
.tabla-box h3 { margin: 0 0 20px 0; font-size: 1.15rem; }
.pagos-table { width: 100%; border-collapse: collapse; }
.pagos-table th { text-align: left; padding: 14px 16px; font-size: 0.82rem; color: #6b7280; font-weight: 700; border-bottom: 2px solid #f3f4f6; }
.pagos-table td { padding: 18px 16px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
.pagos-table tr:hover { background: #fafafa; }
.pagos-table td strong { color: #1a1a2e; font-size: 0.92rem; }
.vecino-name { font-size: 0.85rem; color: #6b7280; }
.fecha-pago { display: block; font-size: 0.72rem; color: #22c55e; margin-top: 2px; }
.estado-badge { padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
.badge-pagado { background: #e8f5e9; color: #22c55e; }
.badge-pendiente { background: #fff3e0; color: #f59e0b; }

.acciones-cell { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.btn-pagar { background: #ff8c00; color: white; border: none; padding: 8px 20px; border-radius: 10px; font-weight: 700; font-size: 0.82rem; cursor: pointer; }
.btn-pagar:hover { background: #e67e00; }
.btn-recibo { background: #f0f9ff; color: #3b82f6; border: 1px solid #bfdbfe; padding: 7px 14px; border-radius: 10px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
.btn-recibo:hover { background: #dbeafe; }
.btn-eliminar-pago { background: #fef2f2; border: 1px solid #fee2e2; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; }
.btn-eliminar-pago:hover { background: #fee2e2; }

.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 3rem; display: block; margin-bottom: 16px; }
.info-msg { text-align: center; color: #95a5a6; padding: 40px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.confirm-card { background: white; max-width: 380px; width: 100%; border-radius: 24px; padding: 36px; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
.confirm-icon { font-size: 2.5rem; margin-bottom: 12px; display: block; }
.confirm-card h3 { margin: 0 0 8px 0; }
.confirm-card p { color: #6b7280; margin-bottom: 24px; }
.confirm-actions { display: flex; gap: 12px; }
.btn-cancel { flex: 1; padding: 14px; background: #F3F4F6; border: none; border-radius: 30px; font-weight: 600; cursor: pointer; color: #6B7280; }
.btn-confirm-pay { flex: 1; padding: 14px; background: #22c55e; color: white; border: none; border-radius: 30px; font-weight: 700; cursor: pointer; }
.btn-delete { flex: 1; padding: 14px; background: #ef4444; color: white; border: none; border-radius: 30px; font-weight: 700; cursor: pointer; }

.slide-enter-active { animation: slideDown 0.3s ease; }
.slide-leave-active { animation: slideDown 0.2s ease reverse; }
@keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 500px; } }
.modal-enter-active { animation: modalIn 0.3s ease; }
.modal-leave-active { animation: modalIn 0.2s ease reverse; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

@media (max-width: 1024px) { .stats-row { grid-template-columns: 1fr 1fr; } }
@media (max-width: 640px) { .pagos-page { padding: 0 16px 20px; } .stats-row { grid-template-columns: 1fr; } }

/* ── Icomoon shared icon styles ── */
.title-icon { font-size: 1.3rem; color: #ff8c00; margin-right: 8px; vertical-align: middle; }
.empty-icon-i { font-size: 3rem; color: #ff8c00; display: block; margin-bottom: 16px; }
.confirm-icon-i { font-size: 2.5rem; color: #ff8c00; margin-bottom: 12px; display: block; }
.stat-icon-i { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
.stat-icon-i.green { background: #e8f5e9; color: #22c55e; }
.stat-icon-i.orange { background: #fff3e0; color: #f59e0b; }
.drop-icon-i { font-size: 2rem; color: #ff8c00; display: block; margin-bottom: 8px; }
.doc-icon-i { font-size: 1.4rem; color: #ff8c00; }
.file-icon-i { font-size: 2rem; color: #ff8c00; }
.file-icon-i.red { color: #ef4444; }
.file-icon-i.blue { color: #3b82f6; }
.file-icon-i.green { color: #22c55e; }
.reserva-icon-i { width: 40px; height: 40px; background: #ff8c00; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: white; }
</style>