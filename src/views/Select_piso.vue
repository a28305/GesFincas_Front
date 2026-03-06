<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUiStore } from '@/store/Uistore';
import { useRouter } from 'vue-router';
import axios from 'axios';
import AppBrand from '@/components/AppBrand.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import { useUserStore } from '@/store/userstore';

interface Piso {
  id_piso: number;
  nombre: string;
  direccion: string;
}

const router = useRouter();
const userStore = useUserStore();
const ui = useUiStore();

const listaPisos = ref<Piso[]>([]);
const pisoSeleccionado = ref<number | null>(null);
const pasoConfirmacion = ref(false);
const detallesVivienda = ref({ puerta: '', bloque: '' });

const cargarPisos = async () => {
  try {
    const res = await axios.get('https://localhost:7152/api/pisos', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    listaPisos.value = res.data;
  } catch (error) {
    console.error("Error al cargar pisos:", error);
  }
};

onMounted(cargarPisos);

const seleccionarPiso = (id_piso: number) => {
  pisoSeleccionado.value = id_piso;
  const pisoData = listaPisos.value.find(p => p.id_piso === id_piso);
  if (pisoData) {
    userStore.setComunidad(String(pisoData.id_piso), pisoData.nombre);
  }
};

const irAConfirmar = () => {
  if (!pisoSeleccionado.value) return;
  pasoConfirmacion.value = true;
};

const guardarSeleccion = async () => {
  try {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    await axios.post('https://localhost:7152/api/pisos/asignar-vecino', {
      id_user: parseInt(userId || '0'),
      id_piso: pisoSeleccionado.value,
      puerta: detallesVivienda.value.puerta || "N/A",
      bloque: detallesVivienda.value.bloque || "N/A"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    localStorage.setItem('hasPisos', 'true');
    router.push('/app/dashboard');
  } catch (e) {
    ui.error("Error", "No se pudo guardar la selección");
  }
};
</script>

<template>
  <div class="selection-container">
    <AppBrand :width="120" />

    <div class="info-section">
      <h2 v-if="!pasoConfirmacion">Selecciona tu comunidad</h2>
      <h2 v-else>Casi listo...</h2>
      <p v-if="!pasoConfirmacion">Hola <strong>{{ userStore.userName }}</strong>, indica dónde resides.</p>
      <p v-else>Dinos tu bloque y puerta en <strong>{{ userStore.viviendaNombre }}</strong>.</p>
    </div>

    <div class="form-section">
      <!-- PASO 1: Elegir piso -->
      <div v-if="!pasoConfirmacion">
        <div class="pisos-grid">
          <div
            v-for="piso in listaPisos" :key="piso.id_piso"
            class="piso-card" :class="{ active: pisoSeleccionado === piso.id_piso }"
            @click="seleccionarPiso(piso.id_piso)"
          >
            <div class="piso-icon">🏢</div>
            <span class="piso-nombre">{{ piso.nombre }}</span>
            <span class="piso-dir">{{ piso.direccion }}</span>
          </div>
        </div>

        <PrimaryButton text="Siguiente" @click="irAConfirmar" :disabled="!pisoSeleccionado" />
      </div>

      <!-- PASO 2: Bloque y puerta -->
      <div v-else class="confirm-box">
        <div class="selected-badge">🏢 {{ userStore.viviendaNombre }}</div>
        <input v-model="detallesVivienda.bloque" placeholder="Bloque (ej: Bloque A)" class="custom-input">
        <input v-model="detallesVivienda.puerta" placeholder="Puerta (ej: 2ºB)" class="custom-input">
        <div class="button-group">
          <button class="btn-back" @click="pasoConfirmacion = false">Atrás</button>
          <PrimaryButton text="Finalizar y Entrar" @click="guardarSeleccion" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.selection-container {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 100vh; padding: 20px; background-color: #fdfaf3;
}
.info-section { text-align: center; margin-bottom: 20px; color: #5d4037; }
.info-section h2 { margin: 0 0 8px 0; font-size: 1.5rem; }
.info-section p { margin: 0; font-size: 0.95rem; color: #7f8c8d; }
.form-section { width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 20px; }

.pisos-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px;
  max-height: 380px; overflow-y: auto; padding: 6px; margin-bottom: 20px;
}
.piso-card {
  padding: 20px 14px; border-radius: 16px; background: white; cursor: pointer;
  text-align: center; border: 2px solid transparent; transition: 0.3s;
  color: #5d4037; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.piso-icon { font-size: 1.5rem; }
.piso-nombre { font-weight: 700; font-size: 0.95rem; }
.piso-dir { font-size: 0.75rem; color: #9ca3af; }
.piso-card.active {
  border-color: #ff8c00; background: #fff9f2; color: #ff8c00; transform: translateY(-3px);
}

.confirm-box {
  display: flex; flex-direction: column; gap: 14px; padding: 24px;
  background: white; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}
.selected-badge {
  background: #fff3e0; color: #ff8c00; padding: 10px; border-radius: 12px;
  text-align: center; font-weight: 700; font-size: 0.92rem;
}
.custom-input {
  width: 100%; padding: 14px 16px; border-radius: 12px; border: 1.5px solid #e5e7eb;
  background: #fdfaf3; outline: none; font-family: inherit; font-size: 0.95rem; box-sizing: border-box;
}
.custom-input:focus { border-color: #ff8c00; }
.button-group { display: flex; gap: 10px; }
.btn-back {
  flex: 1; padding: 14px; background: #f3f4f6; border: none; border-radius: 30px;
  font-weight: 600; cursor: pointer; color: #6b7280; font-size: 0.95rem;
}
.btn-back:hover { background: #e5e7eb; }
</style>