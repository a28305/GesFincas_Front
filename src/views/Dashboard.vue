<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

// Datos dinámicos desde tu API
const vivienda = ref({ nombre: '', bloque: '', puerta: '' });
const userName = ref(localStorage.getItem('userName') || 'Usuario');

onMounted(async () => {
  try {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    
    // Obtenemos los detalles guardados (Edificio + Puerta)
    const res = await axios.get(`https://localhost:7152/api/pisos/mi-vivienda/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    vivienda.value = res.data;
  } catch (error) {
    console.error("Error cargando dashboard:", error);
  }
});
</script>

<template>
  <div class="dashboard-container">
    <aside class="sidebar">
      <div class="logo">
        <img src="../assets/logo_gesfincas.png" alt="GesFincas" />
      </div>
      <nav class="menu">
        <a href="#" class="active"><span>📊</span> Dashboard</a>
        <a href="#"><span>⚠️</span> Incidencias</a>
        <a href="#"><span>📢</span> Tablón</a>
        <a href="#"><span>🏢</span> Zonas Comunes</a>
        <a href="#"><span>💶</span> Pagos</a>
      </nav>
    </aside>

    <main class="main-content">
      <header class="header">
        <div class="welcome">
          <h1>Dashboard</h1>
          <p>Bienvenido a <strong>{{ vivienda.nombre }}</strong>, {{ vivienda.bloque }} {{ vivienda.puerta }}</p>
        </div>
        <div class="user-info">
          <span>🔔</span>
          <div class="avatar">{{ userName.charAt(0) }}</div>
          <span class="desktop-only">{{ userName }}</span>
        </div>
      </header>

      <section class="summary-grid">
        <div class="stat-card">
          <span class="icon red">⚠️</span>
          <h3>6</h3>
          <p>Incidencias Activas</p>
        </div>
        <div class="stat-card">
          <span class="icon blue">📢</span>
          <h3>5</h3>
          <p>Anuncios Nuevos</p>
        </div>
        <div class="stat-card">
          <span class="icon gold">💶</span>
          <h3>2</h3>
          <p>Pagos Pendientes</p>
        </div>
        <div class="stat-card">
          <span class="icon green">🏢</span>
          <h3>5</h3>
          <p>Zonas Comunes</p>
        </div>
      </section>

      <div class="lists-container">
        <div class="list-box">
          <div class="list-header">
            <h3>Incidencias Recientes</h3>
            <button class="link-btn">Ver todas →</button>
          </div>
          <div class="item-card">
            <div class="status resuelta">RESUELTA</div>
            <div class="details">
              <h4>Ascensor averiado en planta 3</h4>
              <p>El ascensor principal ya funciona correctamente.</p>
            </div>
          </div>
        </div>

        <div class="list-box quick-actions">
          <h3>Acciones Rápidas</h3>
          <div class="actions-grid">
            <button class="action-btn"><span>➕</span> Nueva Incidencia</button>
            <button class="action-btn"><span>📅</span> Reservar Zona</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
<style scoped>
.dashboard-container {
  display: flex;
  min-height: 100vh;

  background-color: #fbfaf8e7;
}

/* SIDEBAR RESPONSIVE */
.sidebar {
  width: 250px;
  background: #FEEBC6;
  padding: 20px;
  border-right: 1px solid #f7f6f4;
}

@media (max-width: 768px) {
  .sidebar { width: 70px; padding: 10px; }
  .sidebar span, .sidebar .logo img { display: none; } /* Ocultar texto en móvil */
}

/* MAIN CONTENT */
.main-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

/* GRID DE CARDS */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.02);
}

.stat-card h3 { font-size: 24px; margin: 10px 0; }

/* ICONOS DE COLORES */
.icon.red { color: #ff4d4d; }
.icon.blue { color: #4d94ff; }
.icon.gold { color: #ffcc00; }
.icon.green { color: #2ecc71; }

/* LISTAS Y ACCIONES */
.lists-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
}

@media (max-width: 1024px) {
  .lists-container { grid-template-columns: 1fr; } /* Apilar en tablets/móvil */
}

.item-card {
  display: flex;
  gap: 15px;
  background: white;
  padding: 15px;
  border-radius: 12px;
  margin-top: 15px;
  border-left: 5px solid #ff8c00; /* Naranja corporativo */
}

.status.resuelta {
  background: #e6fffa;
  color: #38b2ac;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  height: fit-content;
}

.action-btn {
  width: 100%;
  padding: 15px;
  border-radius: 12px;
  border: 1px solid #eee;
  background: white;
  cursor: pointer;
  transition: 0.3s;
  font-weight: bold;
}

.action-btn:hover {
  background: #fff5e6;
  border-color: #ff8c00;
}
</style>