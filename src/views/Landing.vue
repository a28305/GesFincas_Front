<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <div class="landing">
    <header class="landing-header">
      <div class="logo-area">
        <span class="logo-icon">🏠</span>
        <span class="logo-text">GesFincas</span>
      </div>
      <nav class="landing-nav">
        <button class="btn-login" @click="router.push('/login')">Iniciar Sesión</button>
        <button class="btn-register" @click="router.push('/register')">Registrarse</button>
      </nav>
    </header>

    <section class="hero">
      <div class="hero-content">
        <h1>Gestión de comunidades <span class="highlight">fácil y moderna</span></h1>
        <p>GesFincas te permite gestionar incidencias, anuncios, pagos y zonas comunes de tu comunidad de vecinos desde un solo lugar.</p>
        <div class="hero-buttons">
          <button class="btn-cta" @click="router.push('/register')">Empezar gratis</button>
          <button class="btn-secondary" @click="router.push('/login')">Ya tengo cuenta</button>
        </div>
      </div>
      <div class="hero-visual">
        <div class="feature-cards">
          <div class="fcard"><span>⚠️</span><h4>Incidencias</h4><p>Reporta y gestiona problemas</p></div>
          <div class="fcard"><span>📢</span><h4>Anuncios</h4><p>Comunica a tus vecinos</p></div>
          <div class="fcard"><span>💳</span><h4>Pagos</h4><p>Control de cuotas</p></div>
          <div class="fcard"><span>🌳</span><h4>Zonas Comunes</h4><p>Reserva espacios</p></div>
        </div>
      </div>
    </section>

    <section class="features">
      <h2>¿Por qué GesFincas?</h2>
      <div class="features-grid">
        <div class="feat"><span>🔒</span><h4>Seguro</h4><p>Autenticación JWT y roles de usuario</p></div>
        <div class="feat"><span>📱</span><h4>Responsive</h4><p>Funciona en móvil, tablet y PC</p></div>
        <div class="feat"><span>⚡</span><h4>Rápido</h4><p>Interfaz moderna con Vue 3</p></div>
      </div>
    </section>

    <footer class="landing-footer">
      <p>© 2026 GesFincas — Proyecto TFG · Desarrollo Web en Entorno Cliente</p>
    </footer>
  </div>
</template>

<style scoped>
.landing { min-height: 100vh; font-family: 'Segoe UI', sans-serif; }

.landing-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 40px; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.logo-area { display: flex; align-items: center; gap: 10px; }
.logo-icon { font-size: 1.8rem; }
.logo-text { font-size: 1.4rem; font-weight: 800; color: #ff8c00; }
.landing-nav { display: flex; gap: 12px; }
.btn-login {
  padding: 10px 24px; border: 2px solid #ff8c00; background: white;
  color: #ff8c00; border-radius: 30px; font-weight: 700; cursor: pointer;
}
.btn-register {
  padding: 10px 24px; background: #ff8c00; color: white;
  border: none; border-radius: 30px; font-weight: 700; cursor: pointer;
}

.hero {
  display: grid; grid-template-columns: 1fr 1fr; gap: 40px;
  padding: 80px 40px; background: linear-gradient(135deg, #FFF7ED, #FFF);
  align-items: center;
}
.hero h1 { font-size: 2.8rem; color: #1a1a2e; line-height: 1.2; margin: 0 0 20px 0; }
.highlight { color: #ff8c00; }
.hero p { font-size: 1.1rem; color: #6b7280; line-height: 1.7; margin: 0 0 30px 0; }
.hero-buttons { display: flex; gap: 16px; }
.btn-cta {
  padding: 16px 36px; background: #ff8c00; color: white; border: none;
  border-radius: 30px; font-weight: 700; font-size: 1.05rem; cursor: pointer;
  transition: 0.3s;
}
.btn-cta:hover { background: #e67e00; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(255,140,0,0.3); }
.btn-secondary {
  padding: 16px 36px; background: white; color: #374151; border: 2px solid #e5e7eb;
  border-radius: 30px; font-weight: 600; font-size: 1.05rem; cursor: pointer;
}

.feature-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.fcard {
  background: white; padding: 24px; border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06); text-align: center;
}
.fcard span { font-size: 2rem; display: block; margin-bottom: 10px; }
.fcard h4 { margin: 0 0 6px 0; color: #1a1a2e; }
.fcard p { margin: 0; font-size: 0.85rem; color: #9ca3af; }

.features { padding: 60px 40px; text-align: center; background: #f9fafb; }
.features h2 { font-size: 1.8rem; color: #1a1a2e; margin-bottom: 40px; }
.features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; max-width: 900px; margin: 0 auto; }
.feat { background: white; padding: 30px; border-radius: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
.feat span { font-size: 2rem; display: block; margin-bottom: 12px; }
.feat h4 { margin: 0 0 8px 0; color: #1a1a2e; }
.feat p { margin: 0; font-size: 0.88rem; color: #6b7280; }

.landing-footer { text-align: center; padding: 30px; color: #9ca3af; font-size: 0.85rem; }

@media (max-width: 768px) {
  .hero { grid-template-columns: 1fr; padding: 40px 20px; }
  .features-grid { grid-template-columns: 1fr; }
  .landing-header { padding: 16px 20px; }
}
</style>