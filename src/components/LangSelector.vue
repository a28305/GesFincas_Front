<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useUiStore } from '@/store/Uistore';

const { locale } = useI18n();
const ui = useUiStore();

function cambiarIdioma(lang: string): void {
  locale.value = lang;
  ui.setLocale(lang);
}
</script>

<template>
  <div class="lang-selector">
    <button 
      :class="['lang-btn', { active: locale === 'es' }]"
      @click="cambiarIdioma('es')"
    >ES</button>
    <button 
      :class="['lang-btn', { active: locale === 'en' }]"
      @click="cambiarIdioma('en')"
    >EN</button>
  </div>
</template>

<style scoped>
.lang-selector {
  display: flex;
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
  overflow: hidden;
}
.lang-btn {
  padding: 6px 14px;
  border: none;
  background: transparent;
  color: #9ca3af;
  font-weight: 700;
  font-size: 0.78rem;
  cursor: pointer;
  transition: 0.2s;
}
.lang-btn.active {
  background: #ff8c00;
  color: white;
}
.lang-btn:hover:not(.active) {
  background: rgba(255,255,255,0.05);
  color: white;
}
</style>