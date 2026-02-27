<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

interface Incidencia {
  id?: number;
  asunto: string;
  descripcion: string;
  estado: string;
}

const listaIncidencias = ref<Incidencia[]>([]);
const nuevaIncidencia = ref({ asunto: '', descripcion: '' });
const API_URL = 'http://127.0.0.1:8000/incidencias';

const cargarDatos = async () => {
  try {
    const res = await axios.get(API_URL);
    listaIncidencias.value = res.data;
  } catch (e) {
    listaIncidencias.value = [
      { id: 1, asunto: 'Ejemplo: Ascensor', descripcion: 'No funciona el botón del piso 3', estado: 'Pendiente' }
    ];
  }
};

const enviarIncidencia = async () => {
  if (!nuevaIncidencia.value.asunto || !nuevaIncidencia.value.descripcion) return;
  try {
    await axios.post(API_URL, {
      asunto: nuevaIncidencia.value.asunto,
      descripcion: nuevaIncidencia.value.descripcion,
      id_piso: 1
    });
    nuevaIncidencia.value = { asunto: '', descripcion: '' };
    await cargarDatos();
  } catch (e) {
    alert("Error al conectar con el servidor");
  }
};

onMounted(cargarDatos);
</script>

<template>
  <div class="gesfincas-layout">
    <Header />

    <main class="container">
      <div class="logo-section">
        <img src="@/assets/logo_gesfincas.png" alt="Logo" class="brand-logo" />
        <h1 class="brand-title">GesFincas</h1>
      </div>

      <div class="form-card">
        <h2 class="form-title">Reportar Incidencia</h2>
        
        <input 
          v-model="nuevaIncidencia.asunto" 
          type="text" 
          placeholder="Asunto" 
          class="pill-input"
        />
        
        <textarea 
          v-model="nuevaIncidencia.descripcion" 
          placeholder="Descripción detallada" 
          class="pill-input textarea"
        ></textarea>
        
        <button @click="enviarIncidencia" class="btn-primary-orange">
          Enviar Incidencia
        </button>
      </div>

      <div class="history-section">
        <h2 class="form-title">Historial</h2>
        
        <div v-for="item in listaIncidencias" :key="item.id" class="incidencia-pill">
          <div class="incidencia-content">
            <span class="incidencia-subject">{{ item.asunto }}</span>
            <span class="incidencia-desc">{{ item.descripcion }}</span>
          </div>
          <div class="status-tag" :class="item.estado.toLowerCase()">
            {{ item.estado }}
          </div>
        </div>
      </div>
    </main>

    <Footer />
  </div>
</template>

<style scoped>
.gesfincas-layout {
  background-color: #FDF6E3;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: sans-serif;
}

.container {
  flex: 1;
  padding: 40px 20px;
  max-width: 450px;
  margin: 0 auto;
  width: 100%;
}

.logo-section {
  text-align: center;
  margin-bottom: 30px;
}

.brand-logo {
  width: 70px;
}

.brand-title {
  color: #F2994A;
  font-size: 1.5rem;
  letter-spacing: 3px;
  margin-top: 10px;
  font-weight: bold;
}

.form-card {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-title {
  color: #888;
  font-size: 1rem;
  margin-bottom: 5px;
  padding-left: 15px;
}

.pill-input {
  background-color: #E9E1CC;
  border: none;
  border-radius: 50px;
  padding: 18px 25px;
  font-size: 1rem;
  width: 100%;
  outline: none;
  color: #555;
}

.textarea {
  border-radius: 25px;
  min-height: 100px;
  resize: none;
}

.btn-primary-orange {
  background-color: #F2994A;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 18px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  transition: opacity 0.2s;
}

.btn-primary-orange:hover {
  opacity: 0.9;
}

.history-section {
  margin-top: 40px;
}

.incidencia-pill {
  background-color: white;
  border-radius: 50px;
  padding: 12px 25px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.incidencia-content {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.incidencia-subject {
  font-weight: bold;
  color: #333;
  font-size: 0.9rem;
}

.incidencia-desc {
  font-size: 0.8rem;
  color: #777;
}

.status-tag {
  font-size: 0.7rem;
  font-weight: bold;
  padding: 5px 15px;
  border-radius: 20px;
  background-color: #E9E1CC;
  color: #888;
  text-transform: uppercase;
}

.pendiente { background-color: #FDF6E3; color: #F2994A; }
.resuelta { background-color: #D4EDDA; color: #155724; }
</style>