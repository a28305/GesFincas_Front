<script setup lang="ts">
import { ref } from 'vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

// Definimos las zonas comunes disponibles
const zonasComunes = ref([
  { id: 1, nombre: 'Piscina', icono: 'swimming_pool', disponible: true },
  { id: 2, nombre: 'Pista de Pádel', icono: 'sports_tennis', disponible: true },
  { id: 3, nombre: 'Gimnasio', icono: 'fitness_center', disponible: true },
  { id: 4, nombre: 'Sala Social', icono: 'groups', disponible: false },
  { id: 5, nombre: 'Solárium', icono: 'wb_sunny', disponible: true }
]);

const seleccionarZona = (zona: string) => {
  console.log("Zona seleccionada:", zona);
  // Aquí podrías navegar a una página de reserva específica:
  // router.push(`/reservas/${zona.toLowerCase()}`);
};
</script>

<template>
  <div class="gesfincas-layout">
    <Header />

    <main class="container">
      <div class="logo-section">
        <img src="@/assets/logo_gesfincas.png" alt="Logo" class="brand-logo" />
        <h1 class="brand-title">ZONAS COMUNES</h1>
      </div>

      <div class="options-grid">
        <h2 class="section-subtitle">Selecciona una instalación</h2>
        
        <div 
          v-for="zona in zonasComunes" 
          :key="zona.id" 
          class="zona-card"
          :class="{ 'no-disponible': !zona.disponible }"
          @click="zona.disponible && seleccionarZona(zona.nombre)"
        >
          <div class="zona-info">
            <span class="zona-name">{{ zona.nombre }}</span>
            <span class="zona-status">
              {{ zona.disponible ? 'Disponible' : 'Mantenimiento' }}
            </span>
          </div>
          <div class="arrow-icon">➔</div>
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
  letter-spacing: 2px;
  margin-top: 10px;
  font-weight: bold;
}

.section-subtitle {
  color: #888;
  font-size: 1rem;
  margin-bottom: 20px;
  padding-left: 10px;
}

.options-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.zona-card {
  background-color: white;
  border-radius: 50px;
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.2s, background-color 0.2s;
}

.zona-card:hover {
  transform: translateX(5px);
  background-color: #fefefe;
}

.zona-info {
  display: flex;
  flex-direction: column;
}

.zona-name {
  font-weight: bold;
  color: #333;
  font-size: 1.1rem;
}

.zona-status {
  font-size: 0.8rem;
  color: #F2994A;
}

.no-disponible {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(1);
}

.no-disponible .zona-status {
  color: #888;
}

.arrow-icon {
  color: #F2994A;
  font-weight: bold;
  font-size: 1.2rem;
}
</style>