<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import '@/assets/icomoon/icomoon.css';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import AnuncioCard from '@/components/AnuncioCard.vue';
import { useAnuncioStore } from '@/store/Anunciosstore';
import { useUserStore } from '@/store/userstore';
import { useUiStore } from '@/store/Uistore';

const anuncioStore = useAnuncioStore();
const userStore = useUserStore();
const ui = useUiStore();

const mostrarFormulario = ref(false);
const mostrarDetalle = ref(false);
const anuncioSeleccionado = ref<Record<string, any> | null>(null);
const confirmandoEliminar = ref<number | null>(null);

const esAdmin = computed((): boolean => userStore.userRole === 'admin');
const anuncios = computed(() => anuncioStore.listaAnuncios);

// Filtro
const filtroActivo = ref('Todos');
const filtros = ['Todos', 'Urgente', 'Alta', 'Media', 'Baja'];

const anunciosFiltrados = computed(() => {
  if (filtroActivo.value === 'Todos') return anuncios.value;
  return anuncios.value.filter((a: any) => {
    const p = a.prioridad ?? a.Prioridad ?? '';
    return p === filtroActivo.value;
  });
});

// Formulario nuevo anuncio
const form = ref({
  titulo: '',
  contenido: '',
  prioridad: 'Baja'
});

// Errores de validación
const errores = ref({
  titulo: '',
  contenido: ''
});

const prioridades = ['Baja', 'Media', 'Alta', 'Urgente'];

function validarFormulario(): boolean {
  errores.value.titulo = '';
  errores.value.contenido = '';
  let valido = true;

  if (!form.value.titulo.trim()) {
    errores.value.titulo = 'El título es obligatorio';
    valido = false;
  } else if (form.value.titulo.trim().length < 5) {
    errores.value.titulo = 'Mínimo 5 caracteres';
    valido = false;
  }

  if (!form.value.contenido.trim()) {
    errores.value.contenido = 'El contenido es obligatorio';
    valido = false;
  } else if (form.value.contenido.trim().length < 10) {
    errores.value.contenido = 'Mínimo 10 caracteres';
    valido = false;
  }

  return valido;
}

async function crearAnuncio(): Promise<void> {
  if (!validarFormulario()) return;

  const ok = await anuncioStore.crearAnuncio({
    titulo: form.value.titulo.trim(),
    contenido: form.value.contenido.trim(),
    prioridad: form.value.prioridad
  });

  if (ok) {
    ui.success('Anuncio publicado', 'El anuncio se ha creado correctamente');
    form.value = { titulo: '', contenido: '', prioridad: 'Baja' };
    mostrarFormulario.value = false;
  } else {
    ui.error('Error', 'No se pudo crear el anuncio');
  }
}

function confirmarEliminar(id: number | undefined): void {
  if (!id) return;
  confirmandoEliminar.value = id;
}

async function eliminarAnuncio(): Promise<void> {
  if (!confirmandoEliminar.value) return;
  const ok = await anuncioStore.eliminarAnuncio(confirmandoEliminar.value);
  if (ok) {
    ui.success('Eliminado', 'El anuncio ha sido eliminado');
  } else {
    ui.error('Error', 'No se pudo eliminar el anuncio');
  }
  confirmandoEliminar.value = null;
}

function abrirDetalle(anuncio: Record<string, any>): void {
  anuncioSeleccionado.value = anuncio;
  mostrarDetalle.value = true;
}

function cerrarDetalle(): void {
  mostrarDetalle.value = false;
  anuncioSeleccionado.value = null;
}

onMounted(async () => {
  await anuncioStore.fetchAnuncios();
});
</script>

<template>
  <div class="anuncios-page">
    <Header />

    <!-- Cabecera -->
    <div class="page-top">
      <div class="page-info">
        <h2><i class="icon-bullhorn title-icon"></i> Tablón de Anuncios</h2>
        <p>Comunicados y avisos de la comunidad</p>
      </div>
      <button v-if="esAdmin" class="btn-nueva" @click="mostrarFormulario = !mostrarFormulario">
        {{ mostrarFormulario ? '✕ Cancelar' : '+ Nuevo Anuncio' }}
      </button>
    </div>

    <!-- Formulario crear (solo admin) -->
    <Transition name="slide">
      <div v-if="mostrarFormulario && esAdmin" class="form-box">
        <h3>Publicar nuevo anuncio</h3>

        <div class="input-group">
          <label>Título <span class="req">*</span></label>
          <input
            v-model="form.titulo"
            type="text"
            placeholder="Ej: Junta de vecinos extraordinaria"
            :class="['form-input', { 'input-error': errores.titulo }]"
          >
          <small v-if="errores.titulo" class="error-msg">{{ errores.titulo }}</small>
        </div>

        <div class="input-group">
          <label>Contenido <span class="req">*</span></label>
          <textarea
            v-model="form.contenido"
            placeholder="Escribe el contenido del anuncio..."
            :class="['form-textarea', { 'input-error': errores.contenido }]"
          ></textarea>
          <small v-if="errores.contenido" class="error-msg">{{ errores.contenido }}</small>
        </div>

        <div class="input-group">
          <label>Prioridad</label>
          <div class="priority-selector">
            <button
              v-for="p in prioridades" :key="p" type="button"
              :class="['prio-btn', { active: form.prioridad === p }]"
              @click="form.prioridad = p"
            >{{ p }}</button>
          </div>
        </div>

        <button class="btn-publicar" @click="crearAnuncio" :disabled="anuncioStore.loading">
          {{ anuncioStore.loading ? 'Publicando...' : 'Publicar Anuncio' }}
        </button>
      </div>
    </Transition>

    <!-- Filtros -->
    <div class="filtros-bar">
      <span class="filtro-label">Prioridad:</span>
      <button
        v-for="f in filtros" :key="f"
        :class="['filtro-btn', { active: filtroActivo === f }]"
        @click="filtroActivo = f"
      >{{ f }}</button>
    </div>

    <!-- Loading -->
    <p v-if="anuncioStore.loading" class="info-msg">Cargando anuncios...</p>

    <!-- Grid de Cards -->
    <div v-else-if="anunciosFiltrados.length > 0" class="cards-grid">
      <AnuncioCard
        v-for="anuncio in anunciosFiltrados"
        :key="(anuncio as any).id_anuncio"
        :anuncio="anuncio"
        @ver-detalle="abrirDetalle"
        @eliminar="confirmarEliminar"
      />
    </div>

    <!-- Empty -->
    <div v-else class="empty-state">
      <i class="icon-bullhorn empty-icon-i"></i>
      <h3>No hay anuncios</h3>
      <p>{{ esAdmin ? 'Publica el primer anuncio de la comunidad.' : 'Aún no hay anuncios publicados.' }}</p>
    </div>

    <!-- MODAL DETALLE -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="mostrarDetalle && anuncioSeleccionado" class="detalle-overlay" @click.self="cerrarDetalle">
          <div class="detalle-card">
            <div class="detalle-header">
              <span :class="['priority-badge-lg', 'badge-' + (anuncioSeleccionado.prioridad ?? 'Baja').toLowerCase()]">
                {{ anuncioSeleccionado.prioridad ?? 'Baja' }}
              </span>
              <button class="detalle-close" @click="cerrarDetalle">✕</button>
            </div>
            <h2>{{ anuncioSeleccionado.titulo ?? 'Sin título' }}</h2>
            <p class="detalle-fecha">
              <i class="icon-cog" style="color:#ff8c00;margin-right:4px"></i> {{ anuncioSeleccionado.fechaPublicacion
                ? new Date(anuncioSeleccionado.fechaPublicacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Sin fecha' }}
            </p>
            <div class="detalle-contenido">{{ anuncioSeleccionado.contenido ?? '' }}</div>
            <button class="btn-cerrar" @click="cerrarDetalle">Cerrar</button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- MODAL CONFIRMAR ELIMINAR -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="confirmandoEliminar" class="detalle-overlay" @click.self="confirmandoEliminar = null">
          <div class="confirm-card">
            <i class="icon-bin confirm-icon-i"></i>
            <h3>¿Eliminar anuncio?</h3>
            <p>Esta acción no se puede deshacer.</p>
            <div class="confirm-actions">
              <button class="btn-cancel" @click="confirmandoEliminar = null">Cancelar</button>
              <button class="btn-delete" @click="eliminarAnuncio">Eliminar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Footer />
  </div>
</template>

<style scoped>
.anuncios-page {
  background-color: #f4f7f6;
  min-height: 100vh;
  padding: 0 30px 30px 30px;
  display: flex;
  flex-direction: column;
}

/* CABECERA */
.page-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-info h2 { margin: 0; font-size: 1.6rem; color: #1a1a2e; font-weight: 700; }
.page-info p { margin: 4px 0 0 0; color: #7f8c8d; font-size: 0.9rem; }
.btn-nueva {
  background: #ff8c00; color: white; border: none;
  padding: 14px 28px; border-radius: 30px;
  font-weight: 700; font-size: 0.95rem; cursor: pointer;
  transition: all 0.25s ease; white-space: nowrap;
}
.btn-nueva:hover { background: #e67e00; transform: translateY(-2px); box-shadow: 0 6px 18px rgba(255,140,0,0.25); }

/* FORMULARIO */
.form-box {
  background: white; border-radius: 20px; padding: 28px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06); margin-bottom: 28px;
}
.form-box h3 { margin: 0 0 20px 0; color: #1a1a2e; font-size: 1.15rem; }
.input-group { margin-bottom: 18px; }
.input-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.88rem; color: #374151; }
.req { color: #ff8c00; }
.form-input, .form-textarea {
  width: 100%; padding: 14px 16px; border-radius: 12px;
  border: 1.5px solid #E5E7EB; background: #FAFAFA;
  font-family: inherit; font-size: 0.95rem; color: #1a1a1a;
  box-sizing: border-box; outline: none; transition: 0.2s;
}
.form-input:focus, .form-textarea:focus { border-color: #ff8c00; background: white; box-shadow: 0 0 0 3px rgba(255,140,0,0.1); }
.form-textarea { height: 120px; resize: none; }
.input-error { border-color: #ef4444 !important; }
.error-msg { color: #ef4444; font-size: 0.78rem; margin-top: 4px; display: block; }

.priority-selector { display: flex; background: #F3F4F6; padding: 4px; border-radius: 12px; }
.prio-btn {
  flex: 1; padding: 10px; border: none; background: transparent;
  border-radius: 9px; cursor: pointer; font-weight: 600;
  color: #6B7280; transition: 0.25s; font-size: 0.88rem;
}
.prio-btn.active { background: white; color: #ff8c00; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

.btn-publicar {
  width: 100%; padding: 15px; background: #ff8c00; color: white;
  border: none; border-radius: 30px; font-weight: 700;
  font-size: 1rem; cursor: pointer; transition: 0.25s; margin-top: 8px;
}
.btn-publicar:hover:not(:disabled) { background: #e67e00; }
.btn-publicar:disabled { background: #d1d5db; cursor: not-allowed; }

/* FILTROS */
.filtros-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 28px; flex-wrap: wrap; }
.filtro-label { font-weight: 600; color: #6B7280; font-size: 0.88rem; margin-right: 4px; }
.filtro-btn {
  padding: 8px 18px; border-radius: 10px; border: 1.5px solid #E5E7EB;
  background: white; color: #6B7280; font-weight: 600; font-size: 0.85rem;
  cursor: pointer; transition: 0.2s;
}
.filtro-btn:hover { border-color: #FFD9A0; color: #ff8c00; }
.filtro-btn.active { background: #1a1a2e; color: white; border-color: #1a1a2e; }

/* GRID */
.cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; flex: 1; }

/* EMPTY */
.empty-state {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; text-align: center; padding: 60px 20px;
}
.empty-icon { font-size: 3rem; margin-bottom: 16px; }
.empty-state h3 { margin: 0 0 8px 0; color: #374151; }
.empty-state p { margin: 0; color: #95a5a6; font-size: 0.9rem; }
.info-msg { text-align: center; color: #95a5a6; padding: 40px; }

/* MODAL DETALLE */
.detalle-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  backdrop-filter: blur(6px); display: flex; align-items: center;
  justify-content: center; z-index: 9999;
}
.detalle-card {
  background: white; max-width: 520px; width: 100%;
  border-radius: 24px; padding: 32px; box-shadow: 0 25px 60px rgba(0,0,0,0.2);
  max-height: 85vh; overflow-y: auto;
}
.detalle-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.priority-badge-lg { padding: 6px 16px; border-radius: 10px; font-size: 0.8rem; font-weight: 700; color: white; }
.badge-urgente { background: #ef4444; }
.badge-alta { background: #f59e0b; }
.badge-media { background: #3b82f6; }
.badge-baja { background: #9ca3af; }
.detalle-close {
  width: 36px; height: 36px; border-radius: 50%;
  background: #f3f4f6; border: none; cursor: pointer;
  font-size: 1.1rem; display: flex; align-items: center; justify-content: center;
}
.detalle-card h2 { margin: 0 0 8px 0; font-size: 1.3rem; color: #1a1a2e; }
.detalle-fecha { color: #9ca3af; font-size: 0.85rem; margin-bottom: 20px; }
.detalle-contenido { color: #4b5563; line-height: 1.7; font-size: 0.95rem; margin-bottom: 28px; white-space: pre-wrap; }
.btn-cerrar {
  width: 100%; padding: 14px; background: #F3F4F6; border: none;
  border-radius: 30px; font-weight: 600; cursor: pointer;
  color: #6B7280; font-size: 0.95rem; transition: 0.2s;
}
.btn-cerrar:hover { background: #E5E7EB; }

/* MODAL CONFIRMAR */
.confirm-card {
  background: white; max-width: 380px; width: 100%;
  border-radius: 24px; padding: 36px; text-align: center;
  box-shadow: 0 25px 60px rgba(0,0,0,0.2);
}
.confirm-icon { font-size: 2.5rem; margin-bottom: 12px; display: block; }
.confirm-card h3 { margin: 0 0 8px 0; color: #1a1a2e; }
.confirm-card p { color: #6b7280; margin-bottom: 24px; }
.confirm-actions { display: flex; gap: 12px; }
.btn-cancel {
  flex: 1; padding: 14px; background: #F3F4F6; border: none;
  border-radius: 30px; font-weight: 600; cursor: pointer; color: #6B7280;
}
.btn-delete {
  flex: 1; padding: 14px; background: #ef4444; color: white;
  border: none; border-radius: 30px; font-weight: 700; cursor: pointer;
}
.btn-delete:hover { background: #dc2626; }

/* ANIMACIONES */
.slide-enter-active { animation: slideDown 0.3s ease; }
.slide-leave-active { animation: slideDown 0.2s ease reverse; }
@keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 500px; } }
.modal-enter-active { animation: modalIn 0.3s ease; }
.modal-leave-active { animation: modalIn 0.2s ease reverse; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

@media (max-width: 1024px) { .cards-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) {
  .anuncios-page { padding: 0 16px 20px; }
  .page-top { flex-direction: column; align-items: flex-start; gap: 16px; }
  .cards-grid { grid-template-columns: 1fr; }
}

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