<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import AppBrand from '@/components/AppBrand.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';

interface Piso {
  id_piso: number;
  nombre: string;
  direccion: string;
}

const router = useRouter();
const listaPisos = ref<Piso[]>([]);
const pisosSeleccionados = ref<number[]>([]);

// Lógica de roles y formularios
const userRole = ref(localStorage.getItem('role'));
const mostrarForm = ref(false); // Formulario de creación (Admin)
const pasoConfirmacion = ref(false); // Segundo paso (Vecino)

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
    alert("Solo los administradores pueden crear pisos");
  }
};

const togglePiso = (id_piso: number) => {
  const index = pisosSeleccionados.value.indexOf(id_piso);
  if (index > -1) pisosSeleccionados.value.splice(index, 1);
  else pisosSeleccionados.value.push(id_piso);
};

const seleccionado = (id_piso: number) => pisosSeleccionados.value.includes(id_piso);

// CAMBIO AQUÍ: Función inteligente según el rol
const irAConfirmar = () => {
  if (pisosSeleccionados.value.length > 0) {
    if (userRole.value === 'admin') {
      // Si es admin, guardamos directamente sin pedir puerta/bloque
      guardarSeleccion();
    } else {
      // Si es vecino, mostramos el paso de detalles
      pasoConfirmacion.value = true;
    }
  }
};

const guardarSeleccion = async () => {
  try {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    for (const id_piso of pisosSeleccionados.value) {
      await axios.post('https://localhost:7152/api/pisos/asignar-vecino', {
        id_user: Number(userId),
        id_piso: id_piso,
        // Si es admin, enviamos vacío; si es vecino, los datos del form
        puerta: userRole.value === 'admin' ? "" : detallesVivienda.value.puerta,
        bloque: userRole.value === 'admin' ? "" : detallesVivienda.value.bloque
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    localStorage.setItem('hasPisos', 'true');
    router.push('/dashboard');
  } catch (e) {
    alert("Error al guardar la selección");
  }
};
</script>

<template>
  <div class="selection-container">
    <AppBrand :width="120" />

    <div class="info-section">
      <h2 v-if="!pasoConfirmacion">Selecciona tu comunidad</h2>
      <h2 v-else>Casi listo...</h2>
      <p v-if="!pasoConfirmacion">Indica en qué edificios resides.</p>
      <p v-else>Dinos tu bloque y puerta para terminar.</p>
      
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
            v-for="piso in listaPisos" 
            :key="piso.id_piso" 
            class="piso-card"
            :class="{ active: seleccionado(piso.id_piso) }"
            @click="togglePiso(piso.id_piso)"
          >
            {{ piso.nombre }}
          </div>
        </div>

        <PrimaryButton 
          :text="userRole === 'admin' ? 'Confirmar y Entrar' : 'Siguiente'" 
          @click="irAConfirmar" 
          :disabled="pisosSeleccionados.length === 0"
        />
      </div>

      <div v-else class="admin-form-box confirmation-step">
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
/* Mantengo tus estilos originales para que no cambie el diseño */
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
  max-width: 360px;
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
  gap: 10px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 20px;
  border: 2px dashed #e8dab2;
  margin-bottom: 20px;
}

.custom-input {
  width: 100%;
  padding: 12px 15px;
  border-radius: 20px;
  border: none;
  background-color: #e8dab2;
  outline: none;
}

.pisos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  margin-bottom: 20px;
}

.piso-card {
  padding: 20px 10px;
  border-radius: 15px;
  background-color: #e8dab2;
  cursor: pointer;
  text-align: center;
  font-weight: bold;
  transition: all 0.3s ease;
  color: #5d4037;
}

.piso-card.active {
  background-color: #ff8c00;
  color: white;
  transform: scale(1.05);
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.back-btn {
  background-color: #5d4037 !important;
  flex: 0.5;
}
</style>