<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import ZonaCard from '@/components/ZonaCard.vue';
import { useUserStore } from '@/store/userstore';
import { useUiStore } from '@/store/Uistore';
import axios from 'axios';
import '@/assets/icomoon/icomoon.css';

const userStore = useUserStore();
const ui = useUiStore();

const zonas = ref<any[]>([]);
const loading = ref(false);
const esAdmin = computed((): boolean => userStore.userRole === 'admin');

const mostrarReserva = ref(false);
const zonaSeleccionada = ref<any>(null);
const reservaForm = ref({ fecha: '', horario: '' });
const horariosOcupados = ref<string[]>([]);
const cargandoHorarios = ref(false);

const horarios = [
  { label: '08:00 - 10:00', inicio: '08:00', fin: '10:00' },
  { label: '10:00 - 12:00', inicio: '10:00', fin: '12:00' },
  { label: '12:00 - 14:00', inicio: '12:00', fin: '14:00' },
  { label: '16:00 - 18:00', inicio: '16:00', fin: '18:00' },
  { label: '18:00 - 20:00', inicio: '18:00', fin: '20:00' },
  { label: '20:00 - 22:00', inicio: '20:00', fin: '22:00' },
];

function isOcupado(h: { inicio: string }): boolean {
  return horariosOcupados.value.includes(h.inicio);
}

// Cuando cambia la fecha, consultar horarios ocupados
watch(() => reservaForm.value.fecha, async (newFecha) => {
  if (!newFecha || !zonaSeleccionada.value) return;
  reservaForm.value.horario = '';
  horariosOcupados.value = [];
  cargandoHorarios.value = true;
  const token = localStorage.getItem('token');
  const idZona = zonaSeleccionada.value.id_zona ?? zonaSeleccionada.value.Id_zona;
  try {
    const res = await axios.get(
      `https://localhost:7152/api/Reservas/ocupados/${idZona}/${newFecha}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    horariosOcupados.value = res.data;
  } catch (err) {
    horariosOcupados.value = [];
  } finally {
    cargandoHorarios.value = false;
  }
});

const mostrarCrear = ref(false);
const nuevaZona = ref({ nombre: '', descripcion: '', capacidad_max: 10, foto_url: '' });
const confirmandoEliminar = ref<number | null>(null);

async function fetchZonas(): Promise<void> {
  const token = localStorage.getItem('token');
  const idPiso = userStore.fincaActivaId;
  if (!token || !idPiso || idPiso === 'null') return;
  loading.value = true;
  try {
    const res = await axios.get(`https://localhost:7152/api/ZonasComunes/piso/${idPiso}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    zonas.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

function abrirReserva(zona: any): void {
  zonaSeleccionada.value = zona;
  reservaForm.value = { fecha: '', horario: '' };
  horariosOcupados.value = [];
  mostrarReserva.value = true;
}

async function enviarReserva(): Promise<void> {
  if (!reservaForm.value.fecha || !reservaForm.value.horario) {
    ui.warn('Campos obligatorios', 'Selecciona fecha y horario');
    return;
  }
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const h = horarios.find(x => x.label === reservaForm.value.horario);
  if (!h) return;

  try {
    await axios.post('https://localhost:7152/api/Reservas', {
      id_user: Number(userId),
      id_zona: zonaSeleccionada.value?.id_zona ?? zonaSeleccionada.value?.Id_zona,
      fecha_reserva: reservaForm.value.fecha,
      hora_inicio: h.inicio,
      hora_fin: h.fin
    }, { headers: { Authorization: `Bearer ${token}` } });
    ui.success('Reserva confirmada', `Has reservado ${zonaSeleccionada.value?.nombre ?? zonaSeleccionada.value?.Nombre}`);
    mostrarReserva.value = false;
  } catch (err: any) {
    const msg = err.response?.data ?? 'No se pudo completar la reserva';
    ui.error('Error', String(msg));
  }
}

async function crearZona(): Promise<void> {
  if (!nuevaZona.value.nombre.trim()) {
    ui.warn('Campo obligatorio', 'El nombre es obligatorio');
    return;
  }
  const token = localStorage.getItem('token');
  try {
    await axios.post('https://localhost:7152/api/ZonasComunes', {
      nombre: nuevaZona.value.nombre,
      descripcion: nuevaZona.value.descripcion,
      capacidad_max: nuevaZona.value.capacidad_max,
      foto_url: nuevaZona.value.foto_url,
      id_piso: Number(userStore.fincaActivaId)
    }, { headers: { Authorization: `Bearer ${token}` } });
    ui.success('Zona creada', `${nuevaZona.value.nombre} añadida correctamente`);
    nuevaZona.value = { nombre: '', descripcion: '', capacidad_max: 10, foto_url: '' };
    mostrarCrear.value = false;
    await fetchZonas();
  } catch (err) {
    ui.error('Error', 'No se pudo crear la zona');
  }
}

async function eliminarZona(): Promise<void> {
  if (!confirmandoEliminar.value) return;
  const token = localStorage.getItem('token');
  try {
    await axios.delete(`https://localhost:7152/api/ZonasComunes/${confirmandoEliminar.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ui.success('Zona eliminada');
    confirmandoEliminar.value = null;
    await fetchZonas();
  } catch (err) {
    ui.error('Error', 'No se pudo eliminar');
  }
}

onMounted(() => fetchZonas());
</script>

<template>
  <div class="comunes-page">
    <Header />

    <div class="page-top">
      <div class="page-info">
        <h2><i class="icon-home3 title-icon"></i> Zonas Comunes</h2>
        <p>Reserva y gestiona el uso de las instalaciones comunitarias</p>
      </div>
      <button v-if="esAdmin" class="btn-nueva" @click="mostrarCrear = !mostrarCrear">
        {{ mostrarCrear ? '✕ Cancelar' : '+ Nueva Zona' }}
      </button>
    </div>

    <!-- FORM CREAR ZONA (admin) -->
    <Transition name="slide">
      <div v-if="mostrarCrear && esAdmin" class="form-box">
        <h3>Crear nueva zona común</h3>
        <div class="form-grid">
          <div class="input-group">
            <label>Nombre <span class="req">*</span></label>
            <input v-model="nuevaZona.nombre" type="text" placeholder="Ej: Piscina Comunitaria" class="form-input">
          </div>
          <div class="input-group">
            <label>Capacidad máxima</label>
            <input v-model.number="nuevaZona.capacidad_max" type="number" class="form-input">
          </div>
          <div class="input-group full">
            <label>Descripción</label>
            <textarea v-model="nuevaZona.descripcion" placeholder="Describe la zona..." class="form-textarea"></textarea>
          </div>
          <div class="input-group full">
            <label>URL de la foto</label>
            <input v-model="nuevaZona.foto_url" type="text" placeholder="https://..." class="form-input">
            <small class="hint">Puedes buscar fotos gratis en unsplash.com y pegar la URL</small>
          </div>
          <div v-if="nuevaZona.foto_url" class="img-preview full">
            <img :src="nuevaZona.foto_url" alt="Preview" @error="($event.target as HTMLImageElement).style.display='none'">
          </div>
        </div>
        <button class="btn-publicar" @click="crearZona">Crear Zona</button>
      </div>
    </Transition>

    <p v-if="loading" class="info-msg">Cargando zonas...</p>

    <div v-else-if="zonas.length > 0" class="zonas-grid">
      <ZonaCard
        v-for="z in zonas" :key="z.id_zona ?? z.Id_zona"
        :zona="z" :es-admin="esAdmin"
        @reservar="abrirReserva"
        @eliminar="(id: number) => confirmandoEliminar = id"
      />
    </div>

    <div v-else class="empty-state">
      <i class="icon-home3 empty-icon-i"></i>
      <h3>No hay zonas comunes registradas</h3>
      <p>{{ esAdmin ? 'Añade la primera zona común del edificio.' : 'El administrador aún no ha añadido zonas.' }}</p>
    </div>

    <!-- MODAL RESERVAR -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="mostrarReserva && zonaSeleccionada" class="modal-overlay" @click.self="mostrarReserva = false">
          <div class="modal-reserva">
            <div class="reserva-header">
              <div>
                <div class="reserva-title-row">
                  <i class="icon-home3 reserva-icon-i"></i>
                  <div>
                    <h3>Reservar Espacio</h3>
                    <p class="reserva-sub">{{ zonaSeleccionada.nombre ?? zonaSeleccionada.Nombre }}</p>
                  </div>
                </div>
                <div class="reserva-tags">
                  <span class="r-tag"><i class="icon-users" style="margin-right:4px;color:#ff8c00"></i>Máx. {{ zonaSeleccionada.capacidad_max ?? zonaSeleccionada.Capacidad_max ?? 0 }} personas</span>
                </div>
              </div>
              <button class="close-x" @click="mostrarReserva = false">✕</button>
            </div>

            <div class="reserva-body">
              <div class="datos-usuario">
                <span class="datos-label">TUS DATOS</span>
                <div class="datos-grid">
                  <div><small>Nombre</small><p>{{ userStore.userName }}</p></div>
                  <div><small>Comunidad</small><p>{{ userStore.viviendaNombre }}</p></div>
                </div>
              </div>

              <div class="input-group">
                <label>Fecha <span class="req">*</span></label>
                <input v-model="reservaForm.fecha" type="date" class="form-input" :min="new Date().toISOString().split('T')[0]">
              </div>

              <div class="input-group">
                <label>Horario <span class="req">*</span></label>
                <p v-if="!reservaForm.fecha" class="hint-select">Selecciona una fecha primero</p>
                <p v-else-if="cargandoHorarios" class="hint-select">Comprobando disponibilidad...</p>
                <div v-else class="horarios-grid">
                  <button v-for="h in horarios" :key="h.label" type="button"
                    :class="['horario-btn', { active: reservaForm.horario === h.label, ocupado: isOcupado(h) }]"
                    :disabled="isOcupado(h)"
                    @click="reservaForm.horario = h.label">
                    {{ h.label }}
                    <span v-if="isOcupado(h)" class="ocupado-tag">Ocupado</span>
                  </button>
                </div>
              </div>

              <button class="btn-confirmar" @click="enviarReserva" :disabled="!reservaForm.fecha || !reservaForm.horario">
                Confirmar Reserva
              </button>
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
            <h3>¿Eliminar zona común?</h3>
            <p>Esta acción eliminará también las reservas asociadas.</p>
            <div class="confirm-actions">
              <button class="btn-cancel" @click="confirmandoEliminar = null">Cancelar</button>
              <button class="btn-delete" @click="eliminarZona">Eliminar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Footer />
  </div>
</template>

<style scoped>
.comunes-page { background-color: #f4f7f6; min-height: 100vh; padding: 0 30px 30px; display: flex; flex-direction: column; }
.page-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-info h2 { margin: 0; font-size: 1.6rem; color: #1a1a2e; font-weight: 700; }
.page-info p { margin: 4px 0 0 0; color: #7f8c8d; font-size: 0.9rem; }
.btn-nueva { background: #ff8c00; color: white; border: none; padding: 14px 28px; border-radius: 30px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: 0.25s; white-space: nowrap; }
.btn-nueva:hover { background: #e67e00; transform: translateY(-2px); }

.form-box { background: white; border-radius: 20px; padding: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); margin-bottom: 28px; }
.form-box h3 { margin: 0 0 20px 0; color: #1a1a2e; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-grid .full { grid-column: 1 / -1; }
.input-group { margin-bottom: 16px; }
.input-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.88rem; color: #374151; }
.req { color: #ff8c00; }
.hint { color: #9ca3af; font-size: 0.75rem; margin-top: 4px; display: block; }
.hint-select { color: #9ca3af; font-size: 0.82rem; font-style: italic; margin: 0; }
.form-input { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1.5px solid #E5E7EB; background: #FAFAFA; font-family: inherit; font-size: 0.95rem; box-sizing: border-box; outline: none; transition: 0.2s; }
.form-input:focus { border-color: #ff8c00; background: white; box-shadow: 0 0 0 3px rgba(255,140,0,0.1); }
.form-textarea { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1.5px solid #E5E7EB; background: #FAFAFA; font-family: inherit; font-size: 0.95rem; box-sizing: border-box; outline: none; resize: none; height: 100px; }
.img-preview { border-radius: 12px; overflow: hidden; max-height: 160px; }
.img-preview img { width: 100%; height: 150px; object-fit: cover; border-radius: 12px; }
.btn-publicar { width: 100%; padding: 15px; background: #ff8c00; color: white; border: none; border-radius: 30px; font-weight: 700; font-size: 1rem; cursor: pointer; margin-top: 8px; }
.btn-publicar:hover { background: #e67e00; }

.zonas-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; flex: 1; }
.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 3rem; margin-bottom: 16px; }
.empty-state h3 { margin: 0 0 8px 0; color: #374151; }
.empty-state p { margin: 0; color: #95a5a6; }
.info-msg { text-align: center; color: #95a5a6; padding: 40px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.modal-reserva { background: white; width: 100%; max-width: 480px; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
.reserva-header { background: #FFF7ED; padding: 24px 28px; display: flex; justify-content: space-between; align-items: flex-start; }
.reserva-title-row { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
.reserva-icon { width: 40px; height: 40px; background: #ff8c00; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.reserva-header h3 { margin: 0; font-size: 1.15rem; color: #1a1a2e; font-weight: 700; }
.reserva-sub { margin: 2px 0 0 0; font-size: 0.85rem; color: #6b7280; }
.reserva-tags { display: flex; gap: 8px; }
.r-tag { padding: 4px 12px; background: white; border-radius: 8px; font-size: 0.78rem; color: #374151; border: 1px solid #e5e7eb; }
.close-x { background: white; border: 1px solid #E5E7EB; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; font-size: 1rem; color: #6B7280; display: flex; align-items: center; justify-content: center; }
.reserva-body { padding: 24px 28px; }
.datos-usuario { background: #FFF7ED; border: 1px solid #FFE8CC; border-radius: 14px; padding: 16px; margin-bottom: 20px; }
.datos-label { font-size: 0.7rem; font-weight: 800; color: #ff8c00; letter-spacing: 0.5px; display: block; margin-bottom: 10px; }
.datos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.datos-grid small { font-size: 0.72rem; color: #9ca3af; }
.datos-grid p { margin: 2px 0 0 0; font-size: 0.9rem; color: #1a1a2e; font-weight: 600; }

.horarios-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.horario-btn { padding: 10px; border: 1.5px solid #e5e7eb; border-radius: 10px; background: white; cursor: pointer; font-size: 0.8rem; font-weight: 600; color: #6b7280; transition: 0.2s; position: relative; }
.horario-btn:hover:not(:disabled) { border-color: #FFD9A0; color: #ff8c00; }
.horario-btn.active { border-color: #ff8c00; background: #FFF7ED; color: #ff8c00; }
.horario-btn.ocupado { background: #fef2f2; border-color: #fecaca; color: #d1d5db; cursor: not-allowed; text-decoration: line-through; }
.ocupado-tag { display: block; font-size: 0.6rem; color: #ef4444; font-weight: 700; margin-top: 2px; text-decoration: none; }

.btn-confirmar { width: 100%; padding: 15px; background: #ff8c00; color: white; border: none; border-radius: 30px; font-weight: 700; font-size: 1rem; cursor: pointer; margin-top: 10px; transition: 0.2s; }
.btn-confirmar:hover:not(:disabled) { background: #e67e00; }
.btn-confirmar:disabled { background: #d1d5db; cursor: not-allowed; }

.confirm-card { background: white; max-width: 380px; width: 100%; border-radius: 24px; padding: 36px; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
.confirm-icon { font-size: 2.5rem; margin-bottom: 12px; display: block; }
.confirm-card h3 { margin: 0 0 8px 0; color: #1a1a2e; }
.confirm-card p { color: #6b7280; margin-bottom: 24px; }
.confirm-actions { display: flex; gap: 12px; }
.btn-cancel { flex: 1; padding: 14px; background: #F3F4F6; border: none; border-radius: 30px; font-weight: 600; cursor: pointer; color: #6B7280; }
.btn-delete { flex: 1; padding: 14px; background: #ef4444; color: white; border: none; border-radius: 30px; font-weight: 700; cursor: pointer; }

.slide-enter-active { animation: slideDown 0.3s ease; }
.slide-leave-active { animation: slideDown 0.2s ease reverse; }
@keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 600px; } }
.modal-enter-active { animation: modalIn 0.3s ease; }
.modal-leave-active { animation: modalIn 0.2s ease reverse; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

@media (max-width: 1024px) { .zonas-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .comunes-page { padding: 0 16px 20px; } .zonas-grid { grid-template-columns: 1fr; } .horarios-grid { grid-template-columns: repeat(2, 1fr); } }

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