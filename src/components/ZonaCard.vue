<script setup lang="ts">
const props = defineProps<{
  zona: {
    id_zona?: number;
    nombre?: string;
    descripcion?: string;
    capacidad_max?: number;
  };
  esAdmin?: boolean;
}>();

const emit = defineEmits(['reservar', 'eliminar']);

function getNombre(): string { return props.zona.nombre ?? 'Sin nombre'; }
function getDescripcion(): string { return props.zona.descripcion ?? ''; }
function getCapacidad(): number { return props.zona.capacidad_max ?? 0; }

function getFoto(): string {
  const n = getNombre().toLowerCase();
  if (n.includes('piscina')) return 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400&h=250&fit=crop';
  if (n.includes('gimnasio')) return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop';
  if (n.includes('salón') || n.includes('salon') || n.includes('actos')) return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=250&fit=crop';
  if (n.includes('terraza')) return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=250&fit=crop';
  if (n.includes('infantil') || n.includes('niños')) return 'https://images.unsplash.com/photo-1566454825481-f0a20a4a3c00?w=400&h=250&fit=crop';
  if (n.includes('juego') || n.includes('billar')) return 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=250&fit=crop';
  if (n.includes('jardín') || n.includes('jardin')) return 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=250&fit=crop';
  if (n.includes('parking') || n.includes('garaje')) return 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&h=250&fit=crop';
  if (n.includes('barbacoa') || n.includes('bbq')) return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=250&fit=crop';
  return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop';
}
</script>

<template>
  <div class="zona-card">
    <div class="zona-img" :style="{ backgroundImage: 'url(' + getFoto() + ')' }">
      <span class="zona-badge badge-ok">DISPONIBLE</span>
    </div>
    <div class="zona-body">
      <h4>{{ getNombre() }}</h4>
      <p class="zona-desc">{{ getDescripcion() }}</p>
      <div class="zona-meta">
        <span><i class="icon-users"></i> Capacidad: {{ getCapacidad() }} personas</span>
      </div>
      <div class="zona-actions">
        <button class="btn-reservar" @click="emit('reservar', zona)">Reservar</button>
        <<button v-if="esAdmin" class="btn-eliminar-zona" @click="emit('eliminar', zona.id_zona)"><i class="icon-exit"></i></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/icomoon/icomoon.css';

.zona-meta i { color: #ff8c00; margin-right: 4px; font-size: 0.8rem; }
.btn-eliminar-zona i { color: #ef4444; font-size: 0.9rem; }
.zona-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); transition: 0.3s; }
.zona-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.zona-img { height: 180px; background-size: cover; background-position: center; position: relative; }
.zona-badge { position: absolute; top: 12px; right: 12px; padding: 5px 14px; border-radius: 8px; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.5px; }
.badge-ok { background: #22c55e; color: white; }
.zona-body { padding: 20px; }
.zona-body h4 { margin: 0 0 6px 0; font-size: 1.1rem; color: #1a1a2e; font-weight: 700; }
.zona-desc { margin: 0 0 12px 0; font-size: 0.84rem; color: #6b7280; line-height: 1.5; }
.zona-meta { font-size: 0.82rem; color: #374151; margin-bottom: 16px; }
.zona-actions { display: flex; gap: 8px; }
.btn-reservar { flex: 1; padding: 12px; background: #ff8c00; color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: 0.2s; }
.btn-reservar:hover { background: #e67e00; }
.btn-eliminar-zona { padding: 12px 14px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; cursor: pointer; font-size: 1rem; }
.btn-eliminar-zona:hover { background: #fee2e2; }
</style>