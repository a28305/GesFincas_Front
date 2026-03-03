<script setup lang="ts">
import { computed } from 'vue';
import { useUiStore } from '@/store/Uistore';

const uiStore = useUiStore();
const toasts = computed(() => uiStore.toasts);

function getIcon(severity: string): string {
  if (severity === 'success') return '✅';
  if (severity === 'error') return '❌';
  if (severity === 'warn') return '⚠️';
  return 'ℹ️';
}

function getBgClass(severity: string): string {
  if (severity === 'success') return 'toast-success';
  if (severity === 'error') return 'toast-error';
  if (severity === 'warn') return 'toast-warn';
  return 'toast-info';
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast-item', getBgClass(toast.severity)]"
          @click="uiStore.removeToast(toast.id)"
        >
          <span class="toast-icon">{{ getIcon(toast.severity) }}</span>
          <div class="toast-content">
            <strong>{{ toast.summary }}</strong>
            <p v-if="toast.detail">{{ toast.detail }}</p>
          </div>
          <button class="toast-close">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 380px;
}

.toast-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 14px;
  color: white;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  min-width: 300px;
}

.toast-success { background: linear-gradient(135deg, #22c55e, #16a34a); }
.toast-error { background: linear-gradient(135deg, #ef4444, #dc2626); }
.toast-warn { background: linear-gradient(135deg, #f59e0b, #d97706); }
.toast-info { background: linear-gradient(135deg, #3b82f6, #2563eb); }

.toast-icon { font-size: 1.2rem; margin-top: 2px; }
.toast-content { flex: 1; }
.toast-content strong { display: block; font-size: 0.92rem; margin-bottom: 2px; }
.toast-content p { margin: 0; font-size: 0.82rem; opacity: 0.9; }
.toast-close {
  background: none; border: none; color: white;
  opacity: 0.7; cursor: pointer; font-size: 0.9rem;
  padding: 0; margin-top: 2px;
}
.toast-close:hover { opacity: 1; }

/* Animaciones */
.toast-enter-active { animation: slideIn 0.3s ease; }
.toast-leave-active { animation: slideOut 0.25s ease; }
@keyframes slideIn { from { opacity: 0; transform: translateX(80px); } to { opacity: 1; transform: translateX(0); } }
@keyframes slideOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(80px); } }
</style>