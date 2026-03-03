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
const pisosSeleccionados = ref<number[]>([]);
const userRole = ref(localStorage.getItem('role'));
const mostrarForm = ref(false);
const pasoConfirmacion = ref(false);

const nuevoPiso = ref({ nombre: '', direccion: '' });
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

const crearPiso = async () => {
  try {
    const token = localStorage.getItem('token');
    await axios.post('https://localhost:7152/api/pisos', nuevoPiso.value, {
      headers: { Authorization: `Bearer ${token}` }
    });
    nuevoPiso.value = { nombre: '', direccion: '' };
    mostrarForm.value = false;
    await cargarPisos();
  } catch (error) {
    ui.error("Error", "No se pudo crear el edificio");
  }
};

const togglePiso = (id_piso: number) => {
  pisosSeleccionados.value = [id_piso];
  const pisoData = listaPisos.value.find(p => p.id_piso === id_piso);
  if (pisoData) {
    // ✅ Guardamos en Pinia Y en localStorage AQUÍ, no esperamos a confirmar
    userStore.setComunidad(String(pisoData.id_piso), pisoData.nombre);
    console.log('📌 Piso guardado:', pisoData.nombre, '| localStorage viviendaNombre:', localStorage.getItem('viviendaNombre'));
  }
};

const seleccionado = (id_piso: number) => pisosSeleccionados.value.includes(id_piso);

const irAConfirmar = () => {
  if (pisosSeleccionados.value.length === 0) return;

  // Nos aseguramos de que el piso esté guardado antes de navegar
  const pisoData = listaPisos.value.find(p => p.id_piso === pisosSeleccionados.value[0]);
  if (pisoData) {
    userStore.setComunidad(String(pisoData.id_piso), pisoData.nombre);
  }

  if (userRole.value === 'admin') {
    localStorage.setItem('hasPisos', 'true');
    router.push('/app/dashboard');
  } else {
    pasoConfirmacion.value = true;
  }
};

const guardarSeleccion = async () => {
  try {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    await axios.post('https://localhost:7152/api/pisos/asignar-vecino', {
      id_user: parseInt(userId || '0'),
      id_piso: pisosSeleccionados.value[0],
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
      
      <PrimaryButton 
        v-if="userRole === 'admin' && !pasoConfirmacion" 
        :text="mostrarForm ? 'Cancelar' : '+ Añadir Edificio'" 
        @click="mostrarForm = !mostrarForm"
        class="admin-btn"
      />
    </div>

    <div class="form-section">
      <div v-if="!pasoConfirmacion">
        <div v-if="mostrarForm" class="admin-form-box">
          <input v-model="nuevoPiso.nombre" placeholder="Nombre Edificio" class="custom-input">
          <input v-model="nuevoPiso.direccion" placeholder="Dirección" class="custom-input">
          <PrimaryButton text="Guardar Piso" @click="crearPiso" />
        </div>

        <div class="pisos-grid">
          <div 
            v-for="piso in listaPisos" :key="piso.id_piso" 
            class="piso-card" :class="{ active: seleccionado(piso.id_piso) }"
            @click="togglePiso(piso.id_piso)"
          >
            <div class="piso-icon">🏢</div>
            {{ piso.nombre }}
          </div>
        </div>

        <PrimaryButton 
          :text="userRole === 'admin' ? 'Confirmar y Entrar' : 'Siguiente'" 
          @click="irAConfirmar" :disabled="pisosSeleccionados.length === 0"
        />
      </div>

      <div v-else class="admin-form-box">
        <div class="selected-badge">Comunidad: {{ userStore.viviendaNombre }}</div>
        <input v-model="detallesVivienda.bloque" placeholder="Bloque (ej: Bloque A)" class="custom-input">
        <input v-model="detallesVivienda.puerta" placeholder="Puerta (ej: 2ºB)" class="custom-input">
        <div class="button-group">
          <PrimaryButton text="Atrás" @click="pasoConfirmacion = false" class="back-btn" />
          <PrimaryButton text="Finalizar y Entrar" @click="guardarSeleccion" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.selection-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #fdfaf3;
}
.info-section {
  text-align: center;
  margin-bottom: 20px;
  color: #5d4037;
}
.form-section {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.admin-btn {
  background-color: #5d4037 !important;
  margin-top: 15px;
  transform: scale(0.9);
}
.admin-form-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}
.selected-badge {
  background: #fff3e0;
  color: #ff8c00;
  padding: 8px;
  border-radius: 10px;
  text-align: center;
  font-weight: bold;
  font-size: 0.9rem;
}
.custom-input {
  width: 100%;
  padding: 12px 15px;
  border-radius: 12px;
  border: 1px solid #e8dab2;
  background-color: #fdfaf3;
  outline: none;
}
.pisos-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  max-height: 350px;
  overflow-y: auto;
  padding: 10px;
  margin-bottom: 20px;
}
.piso-card {
  padding: 20px 10px;
  border-radius: 15px;
  background-color: white;
  cursor: pointer;
  text-align: center;
  font-weight: bold;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  color: #5d4037;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.piso-icon { font-size: 1.5rem; margin-bottom: 5px; }
.piso-card.active {
  border-color: #ff8c00;
  background-color: #fff9f2;
  color: #ff8c00;
  transform: translateY(-3px);
}
.button-group {
  display: flex;
  gap: 10px;
}
.back-btn {
  background-color: #a1887f !important;
}
</style>