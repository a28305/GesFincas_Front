<script setup lang="ts" >
import { useRouter } from 'vue-router';

const router = useRouter();

const logout = () => {
  localStorage.removeItem('token'); // Borramos el token de seguridad
  router.push('/'); // Volvemos al Login
};
</script>
<template>
  <div class="dashboard">
    <header class="top-bar">
      <h2>Panel de Control - GesFincas</h2>
      <button @click="logout" class="btn-logout">Cerrar Sesión</button>
    </header>

    <main class="menu-grid">
      <div class="menu-card">
        <div class="icon">📢</div>
        <h3>Tablón de Anuncios</h3>
        <p>Consulta las últimas noticias de la comunidad.</p>
      </div>

      <div class="menu-card">
        <div class="icon">🎾</div>
        <h3>Reservar Zonas</h3>
        <p>Pistas de pádel, piscina y zonas comunes.</p>
      </div>

      <div class="menu-card">
        <div class="icon">🏠</div>
        <h3>Mi Vivienda</h3>
        <p>Gestión de pisos y vecinos.</p>
      </div>
    </main>
  </div>
</template>