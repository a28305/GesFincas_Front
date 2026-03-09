<script setup lang="ts">
import { ref, computed } from 'vue';
import { useIncidenciaStore } from '@/store/incidenciasStore';
import { useUserStore } from '@/store/userstore';

const props = defineProps<{ show: boolean }>();
const emit = defineEmits(['close']);

const incidenciaStore = useIncidenciaStore();
const userStore = useUserStore();

const paso = ref(1);

const form = ref({
  nombre: '',
  categoria: 'Ascensor',
  prioridad: 'Media',
  descripcion: '',
  apartamento: '',
  ubicacion: ''
});

const categorias = [
  { id: 'Ascensor',          icon: 'icon-settings'     },
  { id: 'Fontanería',        icon: 'icon-wrench'        },
  { id: 'Electricidad',      icon: 'icon-cog'           },
  { id: 'Accesos / Puertas', icon: 'icon-home3'         },
  { id: 'Limpieza',          icon: 'icon-checkmark'     },
  { id: 'Ruidos',            icon: 'icon-bullhorn'      },
  { id: 'Estructura',        icon: 'icon-wrench2'       },
  { id: 'Otros',             icon: 'icon-bubbles'       }
];

const prioridades = ['Baja', 'Media', 'Alta'];

const maxDescripcion = 500;
const charsCount = computed(() => form.value.descripcion.length);

const resetForm = () => {
  form.value = {
    nombre: '',
    categoria: 'Ascensor',
    prioridad: 'Media',
    descripcion: '',
    apartamento: '',
    ubicacion: ''
  };
  paso.value = 1;
};

const cerrar = () => {
  emit('close');
  resetForm();
};

const enviar = async () => {
  const ubicacionCompleta = [
    form.value.apartamento ? `Apt: ${form.value.apartamento}` : '',
    form.value.ubicacion || ''
  ].filter(Boolean).join(' | ');

  const payload = {
    titulo: form.value.nombre,
    descripcion: form.value.descripcion + (ubicacionCompleta ? ` | ${ubicacionCompleta}` : ''),
    estado: 'Nueva',
    prioridad: form.value.prioridad,
    id_user: Number(localStorage.getItem('userId')),
    id_piso: Number(userStore.fincaActivaId)
  };

  await incidenciaStore.crearIncidencia(payload);
  cerrar();
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="cerrar">
        <div class="modal-card">
          <!-- HEADER -->
          <div class="modal-header">
            <div class="header-top">
              <div class="title-with-icon">
                <span class="orange-icon"><i class="icon-warning"></i></span>
                <h2>Nueva Incidencia</h2>
              </div>
              <button @click="cerrar" class="close-x">✕</button>
            </div>

            <div class="stepper">
              <div :class="['step', { active: paso >= 1 }]">
                <span class="step-num">1</span> Tipo
              </div>
              <div :class="['step-line', { active: paso >= 2 }]"></div>
              <div :class="['step', { active: paso === 2 }]">
                <span class="step-num">2</span> Detalles
              </div>
            </div>
          </div>

          <!-- BODY -->
          <div class="modal-body">
            <!-- PASO 1 -->
            <div v-if="paso === 1" class="fade-in">
              <div class="input-group">
                <label>Título <span class="req">*</span></label>
                <input v-model="form.nombre" type="text" placeholder="Ej: Ascensor no funciona" class="main-input">
              </div>

              <div class="input-group">
                <label>Categoría <span class="req">*</span></label>
                <div class="grid-buttons">
                  <button
                    v-for="cat in categorias" :key="cat.id" type="button"
                    :class="['grid-item', { active: form.categoria === cat.id }]"
                    @click="form.categoria = cat.id"
                  >
                    <span class="cat-icon"><i :class="cat.icon"></i></span>
                    <span class="cat-text">{{ cat.id }}</span>
                  </button>
                </div>
              </div>

              <div class="input-group">
                <label>Prioridad</label>
                <div class="priority-selector">
                  <button v-for="p in prioridades" :key="p" type="button"
                    :class="['prio-btn', { active: form.prioridad === p }]"
                    @click="form.prioridad = p"
                  >{{ p }}</button>
                </div>
              </div>

              <button @click="paso = 2" class="btn-orange-full" :disabled="!form.nombre.trim()">
                Siguiente →
              </button>
            </div>

            <!-- PASO 2 -->
            <div v-else class="fade-in">
              <div class="input-group">
                <label>Descripción <span class="req">*</span></label>
                <div class="textarea-wrapper">
                  <textarea v-model="form.descripcion" :maxlength="maxDescripcion"
                    placeholder="Describe la incidencia con el mayor detalle posible..."
                    class="main-area"
                  ></textarea>
                  <span class="char-count" :class="{ warn: charsCount > 450 }">
                    {{ charsCount }}/{{ maxDescripcion }}
                  </span>
                </div>
              </div>

              <div class="input-group">
                <label>Tu apartamento <span class="req">*</span></label>
                <input v-model="form.apartamento" type="text" placeholder="Ej: 3B" class="main-input">
              </div>

              <div class="input-group">
                <label>Ubicación exacta</label>
                <input v-model="form.ubicacion" type="text" placeholder="Ej: Escalera B, planta 3" class="main-input">
              </div>

              <div class="footer-actions">
                <button @click="paso = 1" class="btn-back">← Atrás</button>
                <button @click="enviar" class="btn-orange-full"
                  :disabled="!form.descripcion.trim() || !form.apartamento.trim()">
                  Enviar incidencia
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@import '@/assets/icomoon/icomoon.css';

.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}

.modal-card {
  background: var(--bg-card, white);
  width: 100%; max-width: 520px;
  border-radius: 24px; overflow: hidden;
  box-shadow: 0 25px 60px rgba(0,0,0,0.2);
  max-height: 90vh; overflow-y: auto;
  border: 1px solid var(--border-input, transparent);
}

/* HEADER */
.modal-header {
  background: var(--accent-light, #FFF7ED);
  padding: 28px 30px 22px;
}
.header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
.title-with-icon { display: flex; align-items: center; gap: 12px; }
.orange-icon {
  background: #FF8C00; color: white;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
}
.orange-icon i { font-size: 1rem; }
.modal-header h2 { margin: 0; font-size: 1.35rem; color: var(--text-primary, #1a1a1a); font-weight: 700; }

.close-x {
  background: var(--bg-card, white);
  border: 1px solid var(--border-input, #E5E7EB);
  width: 34px; height: 34px; border-radius: 50%;
  cursor: pointer; font-size: 1rem;
  color: var(--text-secondary, #6B7280);
  display: flex; align-items: center; justify-content: center;
  transition: 0.2s;
}
.close-x:hover { opacity: 0.8; }

/* STEPPER */
.stepper { display: flex; align-items: center; gap: 12px; }
.step { display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--text-muted, #C0C0D0); font-size: 0.88rem; transition: 0.3s; }
.step.active { color: #FF8C00; }
.step-num {
  width: 26px; height: 26px;
  background: var(--bg-card, white);
  border: 2px solid var(--border-input, #E0E0E8);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; font-weight: 700; transition: 0.3s;
}
.step.active .step-num { background: #FF8C00; color: white; border-color: #FF8C00; }
.step-line { flex: 1; height: 2px; background: var(--border-input, #E0E0E8); border-radius: 2px; transition: 0.3s; }
.step-line.active { background: #FF8C00; }

/* BODY */
.modal-body { padding: 28px 30px 30px; background: var(--bg-card, white); }
.input-group { margin-bottom: 20px; }
.input-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.88rem; color: var(--text-primary, #374151); }
.req { color: #FF8C00; }

.main-input {
  width: 100%; padding: 14px 16px; border-radius: 12px;
  border: 1.5px solid var(--border-input, #E5E7EB);
  background: var(--bg-input, #FAFAFA);
  font-family: inherit; font-size: 0.95rem;
  color: var(--text-primary, #1a1a1a);
  transition: 0.2s; box-sizing: border-box; outline: none;
}
.main-input:focus { border-color: #FF8C00; box-shadow: 0 0 0 3px rgba(255,140,0,0.1); }
.main-input::placeholder { color: var(--text-muted, #B0B8C4); }

.textarea-wrapper { position: relative; }
.main-area {
  width: 100%; padding: 14px 16px 30px; border-radius: 12px;
  border: 1.5px solid var(--border-input, #E5E7EB);
  background: var(--bg-input, #FAFAFA);
  font-family: inherit; font-size: 0.95rem;
  color: var(--text-primary, #1a1a1a);
  height: 130px; resize: none; transition: 0.2s;
  box-sizing: border-box; outline: none;
}
.main-area:focus { border-color: #FF8C00; box-shadow: 0 0 0 3px rgba(255,140,0,0.1); }
.main-area::placeholder { color: var(--text-muted, #B0B8C4); }
.char-count { position: absolute; bottom: 10px; right: 14px; font-size: 0.75rem; color: var(--text-muted, #B0B8C4); }
.char-count.warn { color: #e53935; }

/* GRID CATEGORÍAS */
.grid-buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.grid-item {
  display: flex; flex-direction: column; align-items: center;
  padding: 14px 6px;
  border: 1.5px solid var(--border-input, #E5E7EB);
  border-radius: 14px;
  background: var(--bg-card, white);
  cursor: pointer; transition: all 0.2s ease; gap: 6px;
}
.grid-item:hover { border-color: #FFD9A0; background: var(--accent-light, #FFFAF5); }
.grid-item.active {
  border: 2px solid #FF8C00;
  background: var(--accent-light, #FFF7ED);
  box-shadow: 0 2px 8px rgba(255,140,0,0.12);
}
.cat-icon { font-size: 1.3rem; display: flex; align-items: center; justify-content: center; }
.cat-icon i { font-size: 1.2rem; color: var(--text-secondary, #6B7280); }
.grid-item.active .cat-icon i { color: #FF8C00; }
.cat-text { font-size: 0.72rem; font-weight: 600; text-align: center; line-height: 1.2; color: var(--text-secondary, #6B7280); }
.grid-item.active .cat-text { color: #FF8C00; }

/* PRIORIDAD */
.priority-selector { display: flex; background: var(--bg-input, #F3F4F6); padding: 4px; border-radius: 12px; }
.prio-btn {
  flex: 1; padding: 10px; border: none;
  background: transparent; border-radius: 9px;
  cursor: pointer; font-weight: 600;
  color: var(--text-secondary, #6B7280);
  transition: 0.25s; font-size: 0.9rem;
}
.prio-btn.active { background: var(--bg-card, white); color: #FF8C00; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

/* BOTONES */
.btn-orange-full {
  width: 100%; padding: 15px; background: #FF8C00; color: white;
  border: none; border-radius: 30px; font-weight: 700;
  font-size: 1rem; cursor: pointer; margin-top: 6px; transition: all 0.25s ease;
}
.btn-orange-full:hover:not(:disabled) {
  background: #E67E00; transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(255,140,0,0.25);
}
.btn-orange-full:disabled { background: var(--bg-input, #E0E0E0); color: var(--text-muted, #A0A0A0); cursor: not-allowed; }

.footer-actions { display: flex; gap: 12px; margin-top: 6px; }
.btn-back {
  background: var(--bg-input, #F3F4F6);
  border: none; padding: 15px 24px;
  border-radius: 30px; font-weight: 600;
  cursor: pointer; color: var(--text-secondary, #6B7280);
  transition: 0.2s; white-space: nowrap;
}
.btn-back:hover { opacity: 0.85; }

/* ANIMACIONES */
.fade-in { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.modal-enter-active { animation: modalIn 0.3s ease; }
.modal-leave-active { animation: modalIn 0.2s ease reverse; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

@media (max-width: 560px) {
  .modal-card { margin: 12px; max-height: 95vh; border-radius: 20px; }
  .modal-header { padding: 22px 20px 18px; }
  .modal-body { padding: 22px 20px 24px; }
  .grid-buttons { grid-template-columns: repeat(3, 1fr); }
}
</style>