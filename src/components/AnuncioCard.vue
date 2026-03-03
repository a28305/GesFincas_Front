<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  anuncio: {
    id_anuncio?: number;
    titulo?: string;
    contenido?: string;
    fechaPublicacion?: string;
    prioridad?: string;
    foto_url?: string;
  };
}>(), {});

const emit = defineEmits(['eliminar', 'ver-detalle']);

function getTitulo(): string {
  return props.anuncio.titulo ?? 'Sin título';
}
function getContenido(): string {
  return props.anuncio.contenido ?? '';
}
function getPrioridad(): string {
  return props.anuncio.prioridad ?? 'Baja';
}
function getFecha(): string {
  const f = props.anuncio.fechaPublicacion ?? '';
  if (!f) return 'Reciente';
  return new Date(f).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getPrioridadClass(): string {
  const p = getPrioridad().toLowerCase();
  if (p === 'urgente') return 'badge-red';
  if (p === 'alta') return 'badge-orange';
  if (p === 'media') return 'badge-blue';
  return 'badge-grey';
}

function getPrioridadIcon(): string {
  const p = getPrioridad().toLowerCase();
  if (p === 'urgente') return '🔴';
  if (p === 'alta') return '🟠';
  if (p === 'media') return '🔵';
  return '⚪';
}
</script>

<template>
  <div class="anuncio-card">
    <div class="card-header">
      <span :class="['priority-badge', getPrioridadClass()]">
        {{ getPrioridadIcon() }} {{ getPrioridad() }}
      </span>
      <span class="card-date">{{ getFecha() }}</span>
    </div>
    <h4 class="card-title">{{ getTitulo() }}</h4>
    <p class="card-content">{{ getContenido() }}</p>
    <div class="card-actions">
      <button class="btn-detalle" @click="emit('ver-detalle', anuncio)">Ver más</button>
      <button class="btn-eliminar" @click.stop="emit('eliminar', anuncio.id_anuncio)">🗑️</button>
    </div>
  </div>
</template>

<style scoped>
.anuncio-card {
  background: white;
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  border-left: 4px solid transparent;
}
.anuncio-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.priority-badge {
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
}
.badge-red { background: #ef4444; }
.badge-orange { background: #f59e0b; }
.badge-blue { background: #3b82f6; }
.badge-grey { background: #9ca3af; }

.card-date { font-size: 0.78rem; color: #9ca3af; }

.card-title {
  margin: 0 0 8px 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.35;
}

.card-content {
  margin: 0 0 16px 0;
  font-size: 0.88rem;
  color: #6b7280;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-detalle {
  background: #ff8c00;
  color: white;
  border: none;
  padding: 10px 22px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: 0.2s;
}
.btn-detalle:hover {
  background: #e67e00;
}

.btn-eliminar {
  background: #fef2f2;
  border: 1px solid #fee2e2;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  transition: 0.2s;
}
.btn-eliminar:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}
</style>