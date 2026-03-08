<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import Header from '@/components/Header.vue';
import { useUserStore } from '@/store/userstore';
import axios from 'axios';

const userStore = useUserStore();
const mensajes = ref<any[]>([]);
const nuevoMensaje = ref('');
const loading = ref(false);
const enviando = ref(false);
const chatContainer = ref<HTMLElement | null>(null);
let pollingInterval: ReturnType<typeof setInterval> | null = null;

const userId = computed(() => Number(localStorage.getItem('userId') || 0));
const userName = computed(() => userStore.userName || 'Usuario');

async function fetchMensajes(scroll = false): Promise<void> {
  const token = localStorage.getItem('token');
  const idPiso = userStore.fincaActivaId;
  if (!token || !idPiso || idPiso === 'null') return;
  try {
    const res = await axios.get(`https://localhost:7152/api/Mensajes/piso/${idPiso}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const prevCount = mensajes.value.length;
    mensajes.value = res.data;
    if (scroll || res.data.length > prevCount) {
      await nextTick();
      scrollToBottom();
    }
  } catch (err) { console.error(err); }
}

async function enviarMensaje(): Promise<void> {
  if (!nuevoMensaje.value.trim()) return;
  const token = localStorage.getItem('token');
  const idPiso = userStore.fincaActivaId;
  if (!token || !idPiso) return;
  enviando.value = true;
  try {
    await axios.post('https://localhost:7152/api/Mensajes', {
      contenido: nuevoMensaje.value.trim(),
      id_user: userId.value,
      id_piso: Number(idPiso),
      nombre_usuario: userName.value
    }, { headers: { Authorization: `Bearer ${token}` } });
    nuevoMensaje.value = '';
    await fetchMensajes(true);
  } catch (err) { console.error(err); }
  finally { enviando.value = false; }
}

function scrollToBottom(): void {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
}

function esMio(msg: any): boolean {
  return (msg.id_user ?? msg.Id_user) === userId.value;
}

function formatHora(fecha: any): string {
  if (!fecha) return '';
  const d = new Date(String(fecha));
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatFechaGrupo(fecha: any): string {
  if (!fecha) return '';
  const d = new Date(String(fecha));
  const hoy = new Date();
  if (d.toDateString() === hoy.toDateString()) return 'Hoy';
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  if (d.toDateString() === ayer.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
}

function getInitials(name: any): string {
  const n = String(name || 'U');
  if (!n || n === 'U') return 'U';
  return n.trim().substring(0, 2).toUpperCase();
}

function getAvatarColor(name: any): string {
  const n = String(name || '');
  const colors = ['#ff8c00', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];
  let hash = 0;
  for (let i = 0; i < n.length; i++) hash = n.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length] ?? '#ff8c00';
}

function mostrarFecha(index: number): boolean {
  if (index === 0) return true;
  const currFecha = mensajes.value[index]?.fecha_envio;
  const prevFecha = mensajes.value[index - 1]?.fecha_envio;
  if (!currFecha || !prevFecha) return false;
  const curr = new Date(String(currFecha)).toDateString();
  const prev = new Date(String(prevFecha)).toDateString();
  return curr !== prev;
}

function handleKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    enviarMensaje();
  }
}

onMounted(async () => {
  loading.value = true;
  await fetchMensajes(true);
  loading.value = false;
  pollingInterval = setInterval(() => fetchMensajes(), 5000);
});

onUnmounted(() => {
  if (pollingInterval) clearInterval(pollingInterval);
});
</script>

<template>
  <div class="chat-page">
    <Header />

    <div class="chat-wrapper">
      <div class="chat-header">
        <div class="chat-header-info">
          <h3>💬 Chat de la Comunidad</h3>
          <p>{{ userStore.viviendaNombre || 'Tu comunidad' }} · {{ mensajes.length }} mensajes</p>
        </div>
        <div class="online-indicator">
          <span class="online-dot"></span>
          <small>En línea</small>
        </div>
      </div>

      <div class="chat-messages" ref="chatContainer">
        <div v-if="loading" class="chat-loading">
          <p>Cargando mensajes...</p>
        </div>

        <div v-else-if="mensajes.length === 0" class="chat-empty">
          <span class="chat-empty-icon">💬</span>
          <h4>No hay mensajes aún</h4>
          <p>Sé el primero en escribir en el chat de la comunidad</p>
        </div>

        <template v-else>
          <template v-for="(msg, index) in mensajes" :key="msg.id_mensaje">
            <div v-if="mostrarFecha(index)" class="fecha-separator">
              <span>{{ formatFechaGrupo(msg.fecha_envio) }}</span>
            </div>

            <div :class="['msg-row', esMio(msg) ? 'msg-mio' : 'msg-otro']">
              <div v-if="!esMio(msg)" class="msg-avatar" :style="{ background: getAvatarColor(msg.nombre_usuario) }">
                {{ getInitials(msg.nombre_usuario) }}
              </div>

              <div :class="['msg-bubble', esMio(msg) ? 'bubble-mio' : 'bubble-otro']">
                <span v-if="!esMio(msg)" class="msg-nombre">{{ msg.nombre_usuario || 'Usuario' }}</span>
                <p class="msg-contenido">{{ msg.contenido }}</p>
                <span class="msg-hora">{{ formatHora(msg.fecha_envio) }}</span>
              </div>
            </div>
          </template>
        </template>
      </div>

      <div class="chat-input-bar">
        <textarea
          v-model="nuevoMensaje"
          placeholder="Escribe un mensaje..."
          class="chat-input"
          rows="1"
          @keydown="handleKeyDown"
          :disabled="enviando"
        ></textarea>
        <button class="btn-enviar" @click="enviarMensaje" :disabled="!nuevoMensaje.trim() || enviando">
          {{ enviando ? '...' : '➤' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-page { background-color: #f4f7f6; min-height: 100vh; padding: 0 30px 30px; display: flex; flex-direction: column; }
.chat-wrapper { flex: 1; display: flex; flex-direction: column; background: white; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); overflow: hidden; max-height: calc(100vh - 140px); }

.chat-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 28px; border-bottom: 1px solid #f3f4f6; background: #FAFAFA; }
.chat-header-info h3 { margin: 0; font-size: 1.1rem; color: #1a1a2e; }
.chat-header-info p { margin: 2px 0 0 0; font-size: 0.8rem; color: #9ca3af; }
.online-indicator { display: flex; align-items: center; gap: 6px; }
.online-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite; }
.online-indicator small { font-size: 0.78rem; color: #22c55e; font-weight: 600; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.chat-messages { flex: 1; overflow-y: auto; padding: 20px 28px; display: flex; flex-direction: column; gap: 6px; background: #f9fafb; }
.chat-loading, .chat-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.chat-empty-icon { font-size: 3rem; margin-bottom: 12px; }
.chat-empty h4 { margin: 0 0 4px 0; color: #374151; }
.chat-empty p { margin: 0; color: #9ca3af; font-size: 0.85rem; }

.fecha-separator { text-align: center; margin: 16px 0 10px; }
.fecha-separator span { background: #e5e7eb; color: #6b7280; padding: 4px 16px; border-radius: 12px; font-size: 0.72rem; font-weight: 600; }

.msg-row { display: flex; align-items: flex-end; gap: 8px; max-width: 75%; }
.msg-mio { align-self: flex-end; flex-direction: row-reverse; }
.msg-otro { align-self: flex-start; }

.msg-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; }

.msg-bubble { padding: 10px 14px; border-radius: 18px; }
.bubble-mio { background: #ff8c00; color: white; border-bottom-right-radius: 6px; }
.bubble-otro { background: white; color: #1a1a2e; border-bottom-left-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }

.msg-nombre { display: block; font-size: 0.7rem; font-weight: 700; color: #ff8c00; margin-bottom: 2px; }
.msg-contenido { margin: 0; font-size: 0.9rem; line-height: 1.4; word-break: break-word; }
.msg-hora { display: block; font-size: 0.65rem; text-align: right; margin-top: 4px; opacity: 0.7; }
.bubble-mio .msg-hora { color: rgba(255,255,255,0.8); }
.bubble-otro .msg-hora { color: #9ca3af; }

.chat-input-bar { display: flex; align-items: flex-end; gap: 12px; padding: 16px 28px; border-top: 1px solid #f3f4f6; background: white; }
.chat-input { flex: 1; padding: 14px 18px; border-radius: 24px; border: 1.5px solid #e5e7eb; background: #f9fafb; font-family: inherit; font-size: 0.92rem; resize: none; outline: none; max-height: 100px; line-height: 1.4; }
.chat-input:focus { border-color: #ff8c00; background: white; }
.btn-enviar { width: 48px; height: 48px; border-radius: 50%; background: #ff8c00; color: white; border: none; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; flex-shrink: 0; }
.btn-enviar:hover:not(:disabled) { background: #e67e00; transform: scale(1.05); }
.btn-enviar:disabled { background: #d1d5db; cursor: not-allowed; }

.chat-messages::-webkit-scrollbar { width: 6px; }
.chat-messages::-webkit-scrollbar-track { background: transparent; }
.chat-messages::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }

@media (max-width: 640px) {
  .chat-page { padding: 0 12px 12px; }
  .msg-row { max-width: 85%; }
  .chat-header { padding: 14px 18px; }
  .chat-messages { padding: 14px 18px; }
  .chat-input-bar { padding: 12px 18px; }
}
</style>