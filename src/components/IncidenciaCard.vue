<script setup lang="ts">

const props = withDefaults(defineProps<{
  item: {
    id_incidencias?: number;
    titulo?: string;
    Titulo?: string;
    descripcion?: string;
    Descripcion?: string;
    estado?: string;
    Estado?: string;
    prioridad?: string;
    Prioridad?: string;
    fechaCreacion?: string;
    FechaCreacion?: string;
  };
  mode?: string;
}>(), {
  mode: 'card'
});

const emit = defineEmits(['ver-detalle']);

function getTitulo(): string {
  return props.item.titulo ?? props.item.Titulo ?? 'Sin título';
}
function getDescripcion(): string {
  return props.item.descripcion ?? props.item.Descripcion ?? '';
}
function getEstado(): string {
  return props.item.estado ?? props.item.Estado ?? '';
}
function getPrioridad(): string {
  return props.item.prioridad ?? props.item.Prioridad ?? 'Media';
}
function getFechaCreacion(): string {
  return props.item.fechaCreacion ?? props.item.FechaCreacion ?? '';
}

const defaultImage = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop';
const categoryImages = new Map<string, string>([
  ['ascensor', 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&h=300&fit=crop'],
  ['fontanería', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop'],
  ['fontaneria', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop'],
  ['fuga', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop'],
  ['agua', 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop'],
  ['electricidad', 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop'],
  ['luz', 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop'],
  ['puerta', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop'],
  ['portal', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop'],
  ['acceso', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop'],
  ['limpieza', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop'],
  ['basura', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop'],
  ['ruido', 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=300&fit=crop'],
  ['estructura', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop'],
]);

function getImagenUrl(): string {
  const texto = (getTitulo() + ' ' + getDescripcion()).toLowerCase();
  for (const [keyword, url] of categoryImages) {
    if (texto.includes(keyword)) return url;
  }
  return defaultImage;
}

function getStatusLabel(): string {
  const e = getEstado().toLowerCase();
  if (e === 'nueva') return 'NUEVA';
  if (e === 'en proceso') return 'EN PROCESO';
  if (e === 'resuelta') return 'RESUELTA';
  if (e === 'asignada') return 'ASIGNADA';
  if (e) return e.toUpperCase();
  return 'SIN ESTADO';
}

function getStatusClass(): string {
  const e = getEstado().toLowerCase();
  if (e === 'nueva') return 'badge-red';
  if (e === 'en proceso') return 'badge-orange';
  if (e === 'resuelta') return 'badge-green';
  if (e === 'asignada') return 'badge-blue';
  return 'badge-grey';
}

function getPrioridadIcon(): string {
  const p = getPrioridad().toLowerCase();
  if (p === 'alta') return 'icon-warning';
  if (p === 'media') return 'icon-bell';
  return 'icon-bubbles';
}

function getPrioridadClass(): string {
  const p = getPrioridad().toLowerCase();
  if (p === 'alta') return 'prio-alta';
  if (p === 'media') return 'prio-media';
  return 'prio-baja';
}

function getFechaFormateada(): string {
  const f = getFechaCreacion();
  if (!f) return 'Reciente';
  const d = new Date(f);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

function getDescripcionLimpia(): string {
  const desc = getDescripcion();
  const partes = desc.split('|');
  return partes[0] ? partes[0].trim() : '';
}

function getApartamento(): string {
  const desc = getDescripcion();
  const match = desc.match(/Apt:\s*([^|]+)/i);
  if (match && match[1]) return match[1].trim();
  return '';
}
</script>

<template>
  <!-- MODO CARD -->
  <div v-if="mode === 'card'" class="card" @click="emit('ver-detalle', item)">
    <div class="card-img" :style="{ backgroundImage: 'url(' + getImagenUrl() + ')' }">
      <span :class="['prio-icon', getPrioridadClass()]">
        <i :class="getPrioridadIcon()"></i>
      </span>
      <span :class="['status-badge', getStatusClass()]">{{ getStatusLabel() }}</span>
    </div>

    <div class="card-body">
      <h4 class="card-title">{{ getTitulo() }}</h4>
      <p class="card-desc">{{ getDescripcionLimpia() }}</p>

      <div class="card-info">
        <span class="info-item"><i class="icon-users"></i> {{ getApartamento() || 'Vecino' }}</span>
        <span class="info-item"><i class="icon-bell"></i> {{ getFechaFormateada() }}</span>
      </div>

      <button class="btn-ver" @click.stop="emit('ver-detalle', item)">Ver Detalles</button>
    </div>
  </div>

  <!-- MODO ROW (Dashboard) -->
  <div v-else class="row" @click="emit('ver-detalle', item)">
    <div class="row-img" :style="{ backgroundImage: 'url(' + getImagenUrl() + ')' }"></div>
    <div class="row-body">
      <div class="row-top">
        <span :class="['status-badge-sm', getStatusClass()]">{{ getStatusLabel() }}</span>
        <span class="row-date">{{ getFechaFormateada() }}</span>
      </div>
      <h4 class="row-title">{{ getTitulo() }}</h4>
      <p class="row-desc">{{ getDescripcionLimpia() }}</p>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/icomoon/icomoon.css';

/* ========================
   MODO CARD
   ======================== */
.card {
  border-radius: 16px;
  overflow: hidden;
  background: var(--bg-card, white);
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 28px rgba(0,0,0,0.12);
}

.card-img {
  height: 190px;
  background-size: cover;
  background-position: center;
  background-color: #ddd;
  position: relative;
}

.prio-icon {
  position: absolute;
  top: 12px; left: 12px;
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.prio-alta  { background: rgba(239,68,68,0.15); }
.prio-media { background: rgba(245,158,11,0.15); }
.prio-baja  { background: rgba(59,130,246,0.15); }
.prio-icon i { font-size: 0.85rem; }
.prio-alta  i { color: #ef4444; }
.prio-media i { color: #f59e0b; }
.prio-baja  i { color: #3b82f6; }

.status-badge {
  position: absolute;
  top: 12px; right: 12px;
  padding: 5px 14px; border-radius: 8px;
  font-size: 0.7rem; font-weight: 700;
  letter-spacing: 0.5px; color: white;
}
.badge-red    { background: #ef4444; }
.badge-orange { background: #f59e0b; }
.badge-green  { background: #22c55e; }
.badge-blue   { background: #3b82f6; }
.badge-grey   { background: #9ca3af; }

.card-body {
  padding: 18px 20px 20px;
  display: flex; flex-direction: column; flex: 1;
  background: var(--bg-card, white);
}
.card-title {
  margin: 0 0 6px 0;
  font-size: 1.02rem; font-weight: 700;
  color: var(--text-primary, #1a1a2e);
  line-height: 1.35;
}
.card-desc {
  margin: 0 0 14px 0;
  font-size: 0.84rem;
  color: var(--text-secondary, #6b7280);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-info {
  display: flex; flex-direction: column;
  gap: 4px; margin-bottom: 16px;
}
.info-item {
  font-size: 0.78rem;
  color: var(--text-muted, #9ca3af);
  display: flex; align-items: center; gap: 5px;
}
.info-item i { color: #ff8c00; font-size: 0.75rem; }

.btn-ver {
  width: 100%; padding: 12px;
  background: #ff8c00; color: white;
  border: none; border-radius: 12px;
  font-weight: 700; font-size: 0.9rem;
  cursor: pointer; transition: 0.25s;
}
.btn-ver:hover {
  background: #e67e00;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255,140,0,0.25);
}

/* ========================
   MODO ROW (Dashboard)
   ======================== */
.row {
  display: flex; gap: 15px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-input, #f0f0f0);
  cursor: pointer; transition: 0.2s;
}
.row:hover {
  background: var(--bg-input, #fafbfc);
  margin: 0 -10px; padding: 14px 10px;
  border-radius: 12px;
}
.row-img {
  width: 50px; height: 50px;
  border-radius: 12px;
  background-size: cover; background-position: center;
  background-color: var(--bg-input, #e8e8e8);
  flex-shrink: 0;
}
.row-body { flex: 1; min-width: 0; }
.row-top {
  display: flex; justify-content: space-between;
  align-items: center; margin-bottom: 4px;
}
.status-badge-sm {
  font-size: 0.62rem; padding: 2px 8px;
  border-radius: 5px; color: white;
  font-weight: 700; text-transform: uppercase;
}
.row-date { font-size: 0.75rem; color: var(--text-muted, #9ca3af); }
.row-title {
  margin: 0; font-size: 0.92rem;
  color: var(--text-primary, #2c3e50);
  font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.row-desc {
  margin: 3px 0 0 0; font-size: 0.82rem;
  color: var(--text-secondary, #7f8c8d);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
</style>