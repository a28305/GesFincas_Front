<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import axios from 'axios';

interface Proveedor {
  id_proveedor: number;
  nombre: string;
  telefono: string;
  especialidad: string;
  calificacion: number | null;
  total_votos: number;
  mi_valoracion: number | null;
}

const proveedores = ref<Proveedor[]>([]);
const loading = ref(true);
const error = ref('');
const votando = ref<number | null>(null);
const hoverStars = ref<Record<number, number>>({});

const categorias = computed(() =>
  ['Todos', ...new Set(proveedores.value.map(p => p.especialidad))]
);
const categoriaActiva = ref('Todos');

const proveedoresFiltrados = computed(() =>
  categoriaActiva.value === 'Todos'
    ? proveedores.value
    : proveedores.value.filter(p => p.especialidad === categoriaActiva.value)
);

async function cargarProveedores() {
  loading.value = true;
  error.value = '';
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('https://localhost:7152/api/Proveedores', {
      headers: { Authorization: `Bearer ${token}` }
    });
    proveedores.value = res.data;
  } catch (err: any) {
    error.value = 'No se pudieron cargar los proveedores';
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function votar(idProveedor: number, puntuacion: number) {
  if (votando.value === idProveedor) return;
  votando.value = idProveedor;
  try {
    const token = localStorage.getItem('token');
    await axios.post('https://localhost:7152/api/Proveedores/valorar',
      { id_proveedor: idProveedor, puntuacion },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await cargarProveedores(); // recarga el promedio real desde BD
  } catch (err: any) {
    console.error('Error al votar:', err);
  } finally {
    votando.value = null;
  }
}

function getColorEspecialidad(esp: string): string {
  const mapa: Record<string, string> = {
    Ascensores: '#8b5cf6', Limpieza: '#22c55e', Electricidad: '#f59e0b',
    Fontanería: '#3b82f6', Cerrajería: '#6b7280', Pintura: '#ec4899',
    Jardinería: '#16a34a', Climatización: '#06b6d4',
  };
  if (mapa[esp]) return mapa[esp];
  let hash = 0;
  for (let i = 0; i < esp.length; i++) hash = esp.charCodeAt(i) + ((hash << 5) - hash);
  const defaults = ['#ff8c00', '#3b82f6', '#22c55e', '#8b5cf6', '#ec4899'];
  return defaults[Math.abs(hash) % defaults.length] ?? '#ff8c00';
}

function getIconoEspecialidad(esp: string): string {
  const mapa: Record<string, string> = {
    Ascensores: '🔧', Limpieza: '🧹', Electricidad: '⚡',
    Fontanería: '🔩', Cerrajería: '🔑', Pintura: '🎨',
    Jardinería: '🌿', Climatización: '❄️',
  };
  return mapa[esp] ?? '🏪';
}

function getEtiqueta(cal: number | null): string {
  if (cal === null) return 'Sin votos';
  if (cal >= 4.5) return 'Excelente';
  if (cal >= 3.5) return 'Muy buena';
  if (cal >= 2.5) return 'Buena';
  if (cal >= 1.5) return 'Regular';
  return 'Mala';
}

function starClass(proveedor: Proveedor, i: number): string {
  const hover = hoverStars.value[proveedor.id_proveedor] ?? 0;
  if (hover > 0) return i <= hover ? 'hover' : 'empty';
  const val = proveedor.mi_valoracion ?? Math.round(proveedor.calificacion ?? 0);
  return i <= val ? 'filled' : 'empty';
}

function llamar(tel: string) {
  window.location.href = `tel:${tel}`;
}

onMounted(cargarProveedores);
</script>

<template>
  <div class="page">
    <Header />
    <div class="content">

      <div v-if="loading" class="estado">
        <div class="loading-dots"><span></span><span></span><span></span></div>
        <p>Cargando proveedores...</p>
      </div>

      <div v-else-if="error" class="estado">
        <span style="font-size:2rem">⚠️</span>
        <p>{{ error }}</p>
        <button class="btn-reintentar" @click="cargarProveedores">Reintentar</button>
      </div>

      <template v-else>
        <!-- Filtros -->
        <div class="filtros-wrap">
          <div class="filtros">
            <button v-for="cat in categorias" :key="cat"
              :class="['filtro-btn', { active: categoriaActiva === cat }]"
              @click="categoriaActiva = cat">{{ cat }}</button>
          </div>
        </div>

        <!-- Grid -->
        <div class="grid">
          <div v-for="p in proveedoresFiltrados" :key="p.id_proveedor" class="card">

            <div class="card-header">
              <div class="card-icon"
                :style="{ background: getColorEspecialidad(p.especialidad)+'18', color: getColorEspecialidad(p.especialidad) }">
                {{ getIconoEspecialidad(p.especialidad) }}
              </div>
              <div>
                <div class="card-nombre">{{ p.nombre }}</div>
                <div class="card-cat">
                  <span class="dot" :style="{ background: getColorEspecialidad(p.especialidad) }"></span>
                  {{ p.especialidad }}
                </div>
              </div>
            </div>

            <!-- Promedio -->
            <div class="avg-section">
              <div class="stars-display">
                <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(p.calificacion ?? 0) }">★</span>
              </div>
              <span class="etiqueta">{{ getEtiqueta(p.calificacion) }}</span>
              <span class="votos">· {{ p.total_votos }} {{ p.total_votos === 1 ? 'voto' : 'votos' }}</span>
            </div>

            <!-- Input votar -->
            <div class="votar-box">
              <span class="votar-label">{{ p.mi_valoracion ? '✏️ Tu voto:' : '⭐ Valora:' }}</span>
              <div class="stars-input" @mouseleave="delete hoverStars[p.id_proveedor]">
                <button v-for="i in 5" :key="i"
                  class="star-btn" :class="starClass(p, i)"
                  :disabled="votando === p.id_proveedor"
                  @mouseenter="hoverStars[p.id_proveedor] = i"
                  @click="votar(p.id_proveedor, i)">★</button>
                <span v-if="votando === p.id_proveedor" class="spin">⏳</span>
              </div>
            </div>

            <!-- Teléfono -->
            <div class="tel-row">
              <span>📞</span>
              <span class="tel-num">{{ p.telefono }}</span>
            </div>

            <button class="btn-llamar" @click="llamar(p.telefono)">📞 &nbsp;Llamar Ahora</button>
          </div>
        </div>

        <div v-if="proveedoresFiltrados.length === 0" class="estado">
          <span style="font-size:2rem">🔍</span>
          <p>No hay proveedores en esta categoría</p>
        </div>

        <div class="info-banner">
          <span>ℹ️</span>
          <div>
            <div class="info-title">Proveedores Verificados</div>
            <div class="info-text">Verificados por la administración. Las valoraciones son el promedio de votos de los vecinos.</div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.page { background: #f4f7f6; min-height: 100vh; display: flex; flex-direction: column; }
.content { padding: 0 28px 32px; flex: 1; }

.estado { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px; gap:12px; color:#9ca3af; text-align:center; }
.loading-dots { display:flex; gap:6px; }
.loading-dots span { width:10px; height:10px; background:#ff8c00; border-radius:50%; animation:bounce 1.2s infinite; }
.loading-dots span:nth-child(2){animation-delay:.2s} .loading-dots span:nth-child(3){animation-delay:.4s}
@keyframes bounce{0%,80%,100%{transform:scale(.8);opacity:.5}40%{transform:scale(1.2);opacity:1}}
.btn-reintentar { padding:10px 24px; background:#ff8c00; color:white; border:none; border-radius:20px; cursor:pointer; font-weight:600; }

.filtros-wrap { margin-bottom:24px; overflow-x:auto; scrollbar-width:none; }
.filtros { display:flex; gap:10px; flex-wrap:wrap; }
.filtro-btn { padding:8px 18px; border-radius:30px; border:1.5px solid #e5e7eb; background:white; color:#374151; font-size:.85rem; font-weight:500; cursor:pointer; transition:all .18s; white-space:nowrap; }
.filtro-btn:hover { border-color:#ff8c00; color:#ff8c00; }
.filtro-btn.active { background:#ff8c00; border-color:#ff8c00; color:white; font-weight:700; }

.grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; margin-bottom:28px; }
@media(max-width:900px){.grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.grid{grid-template-columns:1fr}.content{padding:0 14px 24px}}

.card { background:white; border-radius:18px; padding:20px; box-shadow:0 2px 12px rgba(0,0,0,.05); display:flex; flex-direction:column; gap:14px; transition:box-shadow .2s,transform .2s; }
.card:hover { box-shadow:0 6px 24px rgba(0,0,0,.09); transform:translateY(-2px); }

.card-header { display:flex; align-items:center; gap:14px; }
.card-icon { width:46px; height:46px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.35rem; flex-shrink:0; }
.card-nombre { font-size:.97rem; font-weight:700; color:#1a1a2e; }
.card-cat { display:flex; align-items:center; gap:5px; font-size:.78rem; color:#6b7280; margin-top:2px; }
.dot { width:7px; height:7px; border-radius:50%; display:inline-block; flex-shrink:0; }

.avg-section { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.stars-display { display:flex; gap:2px; }
.star { font-size:1.05rem; color:#d1d5db; }
.star.filled { color:#ff8c00; }
.etiqueta { font-size:.78rem; color:#6b7280; font-weight:500; }
.votos { font-size:.73rem; color:#9ca3af; }

.votar-box { background:#fafafa; border-radius:12px; padding:12px 14px; display:flex; flex-direction:column; gap:8px; border:1px solid #f3f4f6; }
.votar-label { font-size:.78rem; color:#6b7280; font-weight:600; }
.stars-input { display:flex; align-items:center; gap:2px; }
.star-btn { background:none; border:none; cursor:pointer; font-size:1.5rem; color:#d1d5db; padding:0 2px; transition:color .1s,transform .1s; line-height:1; }
.star-btn.filled { color:#ff8c00; }
.star-btn.hover { color:#ffb347; transform:scale(1.2); }
.star-btn:disabled { cursor:wait; opacity:.6; }
.spin { font-size:.85rem; margin-left:6px; }

.tel-row { display:flex; align-items:center; gap:8px; background:#fff8f0; border-radius:10px; padding:10px 14px; }
.tel-num { font-size:.9rem; font-weight:600; color:#374151; }

.btn-llamar { width:100%; padding:13px; background:#ff8c00; color:white; border:none; border-radius:30px; font-size:.92rem; font-weight:700; cursor:pointer; transition:background .18s,transform .15s; margin-top:auto; }
.btn-llamar:hover { background:#e67e00; transform:scale(1.02); }

.info-banner { display:flex; align-items:flex-start; gap:14px; background:white; border-radius:16px; padding:18px 22px; box-shadow:0 2px 10px rgba(0,0,0,.04); }
.info-title { font-size:.9rem; font-weight:700; color:#1a1a2e; margin-bottom:4px; }
.info-text { font-size:.82rem; color:#6b7280; line-height:1.5; }
</style>