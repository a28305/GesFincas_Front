<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const scrolled = ref(false);
const activeSection = ref('inicio');

function onScroll() {
  scrolled.value = window.scrollY > 50;
  const sections = ['inicio', 'funciones', 'estadisticas', 'testimonios', 'contacto'];
  for (const id of [...sections].reverse()) {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 120) { activeSection.value = id; break; }
  }
}
function scrollTo(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }

const formData = ref({ nombre: '', email: '', mensaje: '' });
const formEnviado = ref(false);
function enviarMensaje() {
  if (!formData.value.nombre || !formData.value.email || !formData.value.mensaje) return;
  formEnviado.value = true;
  setTimeout(() => { formEnviado.value = false; formData.value = { nombre: '', email: '', mensaje: '' }; }, 3000);
}

const counters = ref({ comunidades: 0, vecinos: 0, incidencias: 0, satisfaccion: 0 });
let animStarted = false;
function animateCounters() {
  if (animStarted) return; animStarted = true;
  const targets = { comunidades: 350, vecinos: 1200, incidencias: 4800, satisfaccion: 98 };
  const duration = 1800; const start = Date.now();
  const tick = () => {
    const p = Math.min((Date.now() - start) / duration, 1);
    const e = 1 - Math.pow(1 - p, 3);
    counters.value.comunidades = Math.round(targets.comunidades * e);
    counters.value.vecinos = Math.round(targets.vecinos * e);
    counters.value.incidencias = Math.round(targets.incidencias * e);
    counters.value.satisfaccion = Math.round(targets.satisfaccion * e);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

let observer: IntersectionObserver | undefined;
onMounted(() => {
  window.addEventListener('scroll', onScroll);
  observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
    if (entries[0]?.isIntersecting) animateCounters();
  }, { threshold: 0.3 });
  const el = document.getElementById('estadisticas');
  if (el) observer.observe(el);
});
onUnmounted(() => { window.removeEventListener('scroll', onScroll); observer?.disconnect(); });
</script>

<template>
  <div class="landing">

    <nav :class="['navbar', { scrolled }]">
      <div class="nav-inner">
        <div class="nav-logo" @click="scrollTo('inicio')">
          <div class="logo-icon-box"><img src="@/assets/logo_gesfincas.png" alt="Logo" class="nav-logo-img" /></div>
          <span class="nav-logo-text">Ges<span>Fincas</span></span>
        </div>
        <div class="nav-links">
          <button v-for="item in [
            { id: 'funciones', label: 'Funciones' },
            { id: 'estadisticas', label: 'Estadísticas' },
            { id: 'testimonios', label: 'Testimonios' },
            { id: 'contacto', label: 'Contacto' }
          ]" :key="item.id" :class="['nav-link', { active: activeSection === item.id }]" @click="scrollTo(item.id)">
            {{ item.label }}
          </button>
        </div>
        <div class="nav-actions">
          <button class="btn-nav-login" @click="router.push('/login')">Iniciar sesión</button>
          <button class="btn-nav-register" @click="router.push('/register')">Acceder ahora</button>
        </div>
      </div>
    </nav>

    <!-- HERO -->
    <section id="inicio" class="hero">
      <div class="hero-content">
        <div class="hero-badge"><span class="badge-dot"></span>Plataforma activa · +350 comunidades</div>
        <h1>Tu comunidad,<br><span class="hero-highlight">mejor que nunca</span></h1>
        <p>GesFincas digitaliza la gestión de tu edificio. Incidencias, reservas, pagos y comunicación entre vecinos, todo en un solo lugar.</p>
        <div class="hero-btns">
          <button class="btn-hero-primary" @click="router.push('/register')">
            <i class="icon-home3"></i> Entrar a mi comunidad
          </button>
          <button class="btn-hero-secondary" @click="scrollTo('funciones')">
            <i class="icon-stats-dots"></i> Ver funciones
          </button>
        </div>
      </div>
      <div class="hero-stats">
        <div class="hstat" v-for="s in [
          { icon: 'icon-users',      val: '1.200+', label: 'Vecinos activos' },
          { icon: 'icon-checkmark',  val: '98%',    label: 'Satisfacción' },
          { icon: 'icon-bell',       val: '24/7',   label: 'Disponibilidad' },
          { icon: 'icon-home3',      val: '350+',   label: 'Comunidades' }
        ]" :key="s.label">
          <i :class="s.icon" class="hstat-icon"></i>
          <strong>{{ s.val }}</strong>
          <small>{{ s.label }}</small>
        </div>
      </div>
      <div class="hero-scroll-hint" @click="scrollTo('funciones')">
        <span>Descubre más</span>
        <div class="scroll-arrow">↓</div>
      </div>
    </section>

    <!-- FUNCIONES -->
    <section id="funciones" class="funciones">
      <div class="section-header">
        <span class="section-tag">TODO EN UNO</span>
        <h2>Todo lo que necesita<br>tu comunidad</h2>
        <p>Seis módulos diseñados para hacer la vida en comunidad más fácil, transparente y conectada.</p>
      </div>
      <div class="funciones-grid">
        <div class="func-card" v-for="f in [
          { icon: 'icon-warning',     color: '#ff6b35', bg: '#fff2ee', title: 'Incidencias',    desc: 'Reporta y sigue el estado de cualquier avería o problema en tiempo real.' },
          { icon: 'icon-home3',       color: '#22c55e', bg: '#f0fdf4', title: 'Zonas Comunes', desc: 'Reserva la piscina, gimnasio o sala de reuniones en segundos.' },
          { icon: 'icon-credit-card', color: '#a855f7', bg: '#faf5ff', title: 'Pagos',          desc: 'Consulta y gestiona tus cuotas comunitarias sin complicaciones.' },
          { icon: 'icon-bullhorn',    color: '#ec4899', bg: '#fdf2f8', title: 'Anuncios',       desc: 'Mantente informado de todo lo que ocurre en tu comunidad.' },
          { icon: 'icon-wrench',      color: '#f59e0b', bg: '#fffbeb', title: 'Proveedores',    desc: 'Directorio de profesionales verificados listos para ayudarte.' },
          { icon: 'icon-bubbles',     color: '#0ea5e9', bg: '#f0f9ff', title: 'Chat Vecinos',   desc: 'Comunícate con tus vecinos de forma rápida y sencilla.' }
        ]" :key="f.title">
          <div class="func-icon-wrap" :style="{ background: f.bg }">
            <i :class="f.icon" :style="{ color: f.color }" class="func-icon"></i>
          </div>
          <h4>{{ f.title }}</h4>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- CTA BANNER -->
    <section class="cta-banner">
      <div class="cta-content">
        <h2>¡Listo para transformar<br>tu comunidad?</h2>
        <p>Únete a miles de vecinos que ya gestionan su edificio de forma digital.</p>
        <button class="btn-cta-banner" @click="router.push('/register')">Empezar gratis →</button>
      </div>
    </section>

    <!-- ESTADÍSTICAS -->
    <section id="estadisticas" class="estadisticas">
      <div class="stats-left">
        <span class="section-tag">POR QUÉ ELEGIRNOS</span>
        <h2>Gestión inteligente para vecinos modernos</h2>
        <p>GesFincas nació para eliminar las llamadas interminables, los papeles perdidos y las reuniones eternas. Todo lo que necesitas, en tu bolsillo.</p>
        <ul class="stats-list">
          <li v-for="item in [
            { icon: 'icon-lock',      text: 'Datos seguros y privados, solo accesibles por tu comunidad' },
            { icon: 'icon-phone',     text: 'Diseñado para móvil, funciona perfecto en cualquier dispositivo' },
            { icon: 'icon-bell',      text: 'Notificaciones instantáneas de incidencias y anuncios' },
            { icon: 'icon-settings',  text: 'Soporte técnico disponible todos los días del año' }
          ]" :key="item.text">
            <i :class="item.icon" class="li-icon"></i>{{ item.text }}
          </li>
        </ul>
      </div>
      <div class="stats-right">
        <div class="stat-card-big" v-for="s in [
          { icon: 'icon-home3',       val: counters.comunidades + '+',              label: 'Comunidades gestionadas', color: '#ff8c00' },
          { icon: 'icon-users',       val: counters.vecinos.toLocaleString() + '+', label: 'Vecinos registrados',     color: '#22c55e' },
          { icon: 'icon-checkmark',   val: counters.incidencias.toLocaleString() + '+', label: 'Incidencias resueltas', color: '#ec4899' },
          { icon: 'icon-stats-dots',  val: counters.satisfaccion + '%',             label: 'Tasa de satisfacción',    color: '#f59e0b' }
        ]" :key="s.label">
          <i :class="s.icon" :style="{ color: s.color }" class="sc-icon"></i>
          <strong :style="{ color: s.color }">{{ s.val }}</strong>
          <small>{{ s.label }}</small>
        </div>
      </div>
    </section>

    <!-- TESTIMONIOS -->
    <section id="testimonios" class="testimonios">
      <div class="section-header">
        <span class="section-tag">OPINIONES REALES</span>
        <h2>Lo que dicen nuestros vecinos</h2>
      </div>
      <div class="testimonios-grid">
        <div class="testi-card" v-for="t in [
          { texto: 'Desde que usamos GesFincas, los problemas del edificio se resuelven el doble de rápido. ¡Es increíble!', nombre: 'Carmen Ruiz',     apto: 'Apto. 4A · Residencial Las Palmas', initials: 'CR', color: '#ff8c00' },
          { texto: 'Reservar la piscina o el gimnasio ahora es cuestión de segundos. Muy intuitivo y bonito.',               nombre: 'Javier Moreno',   apto: 'Apto. 2C · Torre Mediterráneo',     initials: 'JM', color: '#22c55e' },
          { texto: 'El chat con los vecinos y el directorio de proveedores son mis funciones favoritas. ¡Lo recomiendo!',    nombre: 'Lucía Fernández', apto: 'Apto. 7B · Urbanización El Pinar',  initials: 'LF', color: '#a855f7' }
        ]" :key="t.nombre">
          <div class="stars">
            <i class="icon-checkmark star-icon" v-for="n in 5" :key="n"></i>
          </div>
          <p class="testi-texto">"{{ t.texto }}"</p>
          <div class="testi-user">
            <div class="testi-avatar" :style="{ background: t.color }">{{ t.initials }}</div>
            <div><strong>{{ t.nombre }}</strong><small>{{ t.apto }}</small></div>
          </div>
        </div>
      </div>
    </section>

    <!-- CONTACTO -->
    <section id="contacto" class="contacto">
      <div class="contacto-left">
        <span class="section-tag">CONTACTO</span>
        <h2>¿Tienes alguna<br>pregunta?</h2>
        <p>Escríbenos y te responderemos en menos de 24 horas. También puedes acceder directamente a tu comunidad.</p>
        <div class="contact-info">
          <div class="cinfo-row"><span class="cinfo-icon"><i class="icon-bullhorn"></i></span><div><small>Email</small><strong>hola@gesfincas.com</strong></div></div>
          <div class="cinfo-row"><span class="cinfo-icon"><i class="icon-phone"></i></span><div><small>Teléfono</small><strong>900 123 456</strong></div></div>
          <div class="cinfo-row"><span class="cinfo-icon"><i class="icon-location2"></i></span><div><small>Dirección</small><strong>Madrid, España</strong></div></div>
        </div>
      </div>
      <div class="contacto-right">
        <div v-if="formEnviado" class="form-success">
          <i class="icon-checkmark success-icon"></i>
          <h3>¡Mensaje enviado!</h3>
          <p>Te responderemos en menos de 24 horas.</p>
        </div>
        <div v-else class="contacto-form">
          <div class="form-group">
            <label>Nombre</label>
            <input v-model="formData.nombre" type="text" placeholder="Tu nombre completo" class="form-input" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="formData.email" type="email" placeholder="tu@email.com" class="form-input" />
          </div>
          <div class="form-group">
            <label>Mensaje <span class="char-count">({{ formData.mensaje.length }}/500)</span></label>
            <textarea v-model="formData.mensaje" placeholder="¿En qué podemos ayudarte?" class="form-input form-textarea" maxlength="500" rows="4"></textarea>
          </div>
          <button class="btn-submit" @click="enviarMensaje">Enviar mensaje</button>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="landing-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="nav-logo">
            <div class="logo-icon-box small"><img src="@/assets/logo_gesfincas.png" alt="Logo" class="nav-logo-img" /></div>
            <span class="nav-logo-text">Ges<span>Fincas</span></span>
          </div>
          <p>La plataforma más completa para la gestión digital de comunidades de vecinos en España.</p>
        </div>
        <div class="footer-links">
          <h5>MÓDULOS</h5>
          <a v-for="m in ['Incidencias','Zonas Comunes','Pagos','Anuncios','Proveedores','Chat Vecinos']" :key="m" href="#">{{ m }}</a>
        </div>
        <div class="footer-links">
          <h5>EMPRESA</h5>
          <a v-for="m in ['Sobre nosotros','Blog','Privacidad','Términos de uso','Contacto']" :key="m" href="#">{{ m }}</a>
        </div>
      </div>
      <div class="footer-bottom"><span>© 2025 GesFincas. Todos los derechos reservados.</span></div>
    </footer>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
@import '@/assets/icomoon/icomoon.css';

* { box-sizing: border-box; margin: 0; padding: 0; }
.landing { font-family: 'Montserrat', sans-serif; color: #1a1a2e; overflow-x: hidden; }

/* NAVBAR */
.navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; padding: 16px 0; transition: all 0.3s ease; }
.navbar.scrolled { background: #FEEBC6; backdrop-filter: blur(12px); box-shadow: 0 2px 20px rgba(0,0,0,0.08); padding: 10px 0; }
.nav-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; gap: 16px; }
.nav-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; flex-shrink: 0; }
.logo-icon-box { width: 38px; height: 38px; border-radius: 10px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.logo-icon-box.small { width: 32px; height: 32px; }
.nav-logo-img { width: 100%; height: 100%; object-fit: contain; }
.nav-logo-text { font-family: 'Montserrat', sans-serif; font-size: 1.3rem; font-weight: 800; color: #1a1a2e; }
.nav-logo-text span { color: #ff8c00; }
.nav-links { display: flex; gap: 4px; }
.nav-link { background: none; border: none; padding: 8px 16px; font-family: 'Montserrat', sans-serif; font-size: 0.85rem; font-weight: 500; color: rgba(255,255,255,0.85); cursor: pointer; border-radius: 8px; transition: 0.2s; }
.navbar.scrolled .nav-link { color: #6b7280; }
.nav-link:hover, .nav-link.active { color: #ff8c00 !important; }
.nav-actions { display: flex; gap: 10px; flex-shrink: 0; }
.btn-nav-login { padding: 9px 22px; border: 1.5px solid rgba(255,255,255,0.6); background: transparent; color: white; border-radius: 30px; font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: 0.2s; }
.navbar.scrolled .btn-nav-login { border-color: #ff8c00; color: #ff8c00; }
.btn-nav-register { padding: 9px 22px; background: #ff8c00; color: white; border: none; border-radius: 30px; font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 14px rgba(255,140,0,0.35); }
.btn-nav-register:hover { background: #e67e00; transform: translateY(-1px); }

/* HERO */
.hero { min-height: 100vh; background: linear-gradient(135deg, #1a0a00 0%, #3d1800 40%, #1a1a2e 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 120px 40px 60px; position: relative; overflow: hidden; text-align: center; }
.hero::before { content: ''; position: absolute; inset: 0; background: url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=80') center/cover; opacity: 0.25; }
.hero-content { position: relative; z-index: 2; max-width: 780px; }
.hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.12); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.9); padding: 8px 18px; border-radius: 30px; font-size: 0.75rem; font-weight: 500; margin-bottom: 28px; }
.badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.3); animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.3); } 50% { box-shadow: 0 0 0 6px rgba(34,197,94,0.1); } }
.hero h1 { font-family: 'Montserrat', sans-serif; font-size: clamp(2rem, 5vw, 3rem); font-weight: 900; color: white; line-height: 1.15; margin-bottom: 20px; }
.hero-highlight { color: #ff8c00; }
.hero-content p { font-size: 1.1rem; font-weight: 400; color: rgba(255,255,255,0.75); line-height: 1.8; margin-bottom: 36px; max-width: 580px; margin-left: auto; margin-right: auto; }
.hero-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
.btn-hero-primary { display: flex; align-items: center; gap: 10px; padding: 16px 32px; background: #ff8c00; color: white; border: none; border-radius: 50px; font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 1rem; cursor: pointer; transition: 0.3s; box-shadow: 0 6px 24px rgba(255,140,0,0.4); }
.btn-hero-primary:hover { background: #e67e00; transform: translateY(-2px); }
.btn-hero-secondary { display: flex; align-items: center; gap: 10px; padding: 16px 32px; background: rgba(255,255,255,0.1); backdrop-filter: blur(8px); color: white; border: 1.5px solid rgba(255,255,255,0.3); border-radius: 50px; font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 1rem; cursor: pointer; transition: 0.3s; }
.btn-hero-secondary:hover { background: rgba(255,255,255,0.2); }
.btn-hero-primary i, .btn-hero-secondary i { font-size: 1.1rem; }

.hero-stats { position: relative; z-index: 2; display: flex; margin-top: 60px; background: rgba(255,255,255,0.1); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; overflow: hidden; }
.hstat { display: flex; flex-direction: column; align-items: center; padding: 20px 36px; gap: 6px; border-right: 1px solid rgba(255,255,255,0.1); }
.hstat:last-child { border-right: none; }
.hstat-icon { font-size: 1.4rem; color: #ff8c00; }
.hstat strong { font-family: 'Montserrat', sans-serif; font-size: 1.3rem; font-weight: 800; color: white; }
.hstat small { font-size: 0.75rem; font-weight: 300; color: rgba(255,255,255,0.6); }

.hero-scroll-hint { position: relative; z-index: 2; margin-top: 40px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 300; letter-spacing: 1px; text-transform: uppercase; transition: color 0.2s; }
.hero-scroll-hint:hover { color: rgba(255,255,255,0.8); }
.scroll-arrow { animation: bounce 2s infinite; font-size: 1.1rem; }
@keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }

/* FUNCIONES */
.funciones { padding: 100px 40px; background: #f9fafb; }
.section-header { text-align: center; margin-bottom: 60px; }
.section-tag { display: inline-block; background: #fff3e0; color: #ff8c00; padding: 6px 16px; border-radius: 30px; font-size: 0.72rem; font-weight: 700; letter-spacing: 1px; margin-bottom: 16px; }
.section-header h2 { font-family: 'Montserrat', sans-serif; font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 700; color: #1a1a2e; line-height: 1.2; margin-bottom: 16px; }
.section-header p { color: #6b7280; font-size: 1rem; font-weight: 400; max-width: 500px; margin: 0 auto; line-height: 1.7; }
.funciones-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1100px; margin: 0 auto; }
.func-card { background: white; border-radius: 20px; padding: 32px 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); transition: 0.3s; border: 1px solid #f3f4f6; }
.func-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
.func-icon-wrap { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
.func-icon { font-size: 1.5rem; }
.func-card h4 { font-family: 'Montserrat', sans-serif; font-size: 1rem; font-weight: 700; color: #1a1a2e; margin-bottom: 10px; }
.func-card p { font-size: 0.88rem; font-weight: 400; color: #6b7280; line-height: 1.6; }

/* CTA BANNER */
.cta-banner { background: linear-gradient(135deg, #ff8c00, #ff6b35); padding: 80px 40px; text-align: center; }
.cta-content h2 { font-family: 'Montserrat', sans-serif; font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 700; color: white; margin-bottom: 16px; }
.cta-content p { color: rgba(255,255,255,0.85); font-size: 1rem; font-weight: 400; margin-bottom: 32px; }
.btn-cta-banner { padding: 16px 40px; background: white; color: #ff8c00; border: none; border-radius: 50px; font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 1rem; cursor: pointer; transition: 0.3s; box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
.btn-cta-banner:hover { transform: translateY(-2px); }

/* ESTADÍSTICAS */
.estadisticas { padding: 100px 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; max-width: 1100px; margin: 0 auto; align-items: center; }
.stats-left .section-tag { margin-bottom: 16px; }
.stats-left h2 { font-family: 'Montserrat', sans-serif; font-size: clamp(1.4rem, 2.5vw, 2rem); font-weight: 700; color: #1a1a2e; margin-bottom: 16px; line-height: 1.25; }
.stats-left > p { color: #6b7280; font-size: 1rem; font-weight: 400; line-height: 1.8; margin-bottom: 28px; }
.stats-list { list-style: none; display: flex; flex-direction: column; gap: 14px; }
.stats-list li { color: #374151; font-size: 0.95rem; font-weight: 400; display: flex; align-items: center; gap: 12px; }
.li-icon { font-size: 1.1rem; color: #ff8c00; flex-shrink: 0; }
.stats-right { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.stat-card-big { background: #f9fafb; border-radius: 20px; padding: 28px; border: 1px solid #f3f4f6; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; transition: 0.3s; }
.stat-card-big:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
.sc-icon { font-size: 1.8rem; }
.stat-card-big strong { font-family: 'Montserrat', sans-serif; font-size: 1.8rem; font-weight: 800; }
.stat-card-big small { font-size: 0.75rem; font-weight: 300; color: #9ca3af; text-align: center; }

/* TESTIMONIOS */
.testimonios { padding: 100px 40px; background: #f9fafb; }
.testimonios-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; max-width: 1100px; margin: 0 auto; }
.testi-card { background: white; border-radius: 20px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid #f3f4f6; display: flex; flex-direction: column; gap: 16px; }
.stars { display: flex; gap: 4px; }
.star-icon { font-size: 0.9rem; color: #f59e0b; }
.testi-texto { font-size: 0.9rem; font-weight: 400; color: #374151; line-height: 1.7; flex: 1; font-style: italic; }
.testi-user { display: flex; align-items: center; gap: 14px; }
.testi-avatar { width: 44px; height: 44px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; flex-shrink: 0; }
.testi-user strong { display: block; font-size: 0.9rem; font-weight: 700; color: #1a1a2e; }
.testi-user small { font-size: 0.75rem; font-weight: 300; color: #9ca3af; }

/* CONTACTO */
.contacto { padding: 100px 40px; display: grid; grid-template-columns: 1fr 1.2fr; gap: 80px; max-width: 1100px; margin: 0 auto; align-items: start; }
.contacto-left h2 { font-family: 'Montserrat', sans-serif; font-size: clamp(1.4rem, 2.5vw, 2rem); font-weight: 700; color: #1a1a2e; margin: 16px 0; line-height: 1.25; }
.contacto-left > p { color: #6b7280; font-size: 1rem; font-weight: 400; line-height: 1.8; margin-bottom: 32px; }
.contact-info { display: flex; flex-direction: column; gap: 20px; }
.cinfo-row { display: flex; align-items: center; gap: 16px; }
.cinfo-icon { width: 42px; height: 42px; background: #fff3e0; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: #ff8c00; flex-shrink: 0; }
.cinfo-row small { display: block; font-size: 0.75rem; font-weight: 300; color: #9ca3af; margin-bottom: 2px; }
.cinfo-row strong { font-size: 0.9rem; font-weight: 600; color: #1a1a2e; }
.contacto-right { background: #f9fafb; border-radius: 24px; padding: 40px; border: 1px solid #f3f4f6; }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: #374151; }
.char-count { font-weight: 300; color: #9ca3af; }
.form-input { padding: 12px 16px; border: 1.5px solid #e5e7eb; border-radius: 12px; font-size: 0.9rem; font-family: 'Montserrat', sans-serif; font-weight: 400; background: white; color: #1a1a2e; outline: none; transition: 0.2s; }
.form-input:focus { border-color: #ff8c00; box-shadow: 0 0 0 3px rgba(255,140,0,0.1); }
.form-textarea { resize: vertical; min-height: 120px; }
.btn-submit { width: 100%; padding: 15px; background: #ff8c00; color: white; border: none; border-radius: 50px; font-family: 'Montserrat', sans-serif; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 14px rgba(255,140,0,0.3); }
.btn-submit:hover { background: #e67e00; transform: translateY(-1px); }
.form-success { text-align: center; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.success-icon { font-size: 3rem; color: #22c55e; }
.form-success h3 { font-size: 1.3rem; font-weight: 700; color: #1a1a2e; }
.form-success p { color: #6b7280; font-weight: 400; }

/* FOOTER */
.landing-footer { background: #1a1a2e; padding: 60px 40px 30px; }
.footer-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 60px; padding-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.footer-brand .nav-logo-text { color: white; }
.footer-brand p { color: rgba(255,255,255,0.45); font-size: 0.75rem; font-weight: 300; margin-top: 12px; line-height: 1.7; }
.footer-links { display: flex; flex-direction: column; gap: 12px; }
.footer-links h5 { color: rgba(255,255,255,0.4); font-size: 0.72rem; font-weight: 700; letter-spacing: 1.5px; margin-bottom: 4px; }
.footer-links a { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 0.75rem; font-weight: 300; transition: 0.2s; }
.footer-links a:hover { color: #ff8c00; }
.footer-bottom { max-width: 1100px; margin: 24px auto 0; color: rgba(255,255,255,0.3); font-size: 0.75rem; font-weight: 300; text-align: center; }

/* RESPONSIVE */
@media (max-width: 900px) {
  .funciones-grid { grid-template-columns: repeat(2, 1fr); }
  .estadisticas { grid-template-columns: 1fr; gap: 40px; }
  .testimonios-grid { grid-template-columns: 1fr; }
  .contacto { grid-template-columns: 1fr; gap: 40px; }
  .footer-inner { grid-template-columns: 1fr 1fr; }
  .hero-stats { flex-wrap: wrap; }
}
@media (max-width: 600px) {
  .funciones-grid { grid-template-columns: 1fr; }
  .nav-links { display: none; }
  .nav-inner { padding: 0 16px; gap: 12px; }
  .nav-logo-text { font-size: 1.05rem; }
  .btn-nav-login { padding: 7px 12px; font-size: 0.78rem; }
  .btn-nav-register { padding: 7px 12px; font-size: 0.78rem; }
  .hero { padding: 100px 20px 50px; }
  .funciones, .estadisticas, .testimonios, .contacto { padding: 60px 20px; }
  .footer-inner { grid-template-columns: 1fr; gap: 30px; }
  .hstat { padding: 16px 20px; }
}
</style>