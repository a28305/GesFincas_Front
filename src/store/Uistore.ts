import { defineStore } from 'pinia';

export interface ToastMessage {
  id: number;
  severity: 'success' | 'error' | 'warn' | 'info';
  summary: string;
  detail: string;
  life?: number;
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    // Toast notifications (reemplaza alert() nativo)
    toasts: [] as ToastMessage[],
    toastCounter: 0,

    // Theme
    darkMode: localStorage.getItem('darkMode') === 'true',

    // Sidebar
    sidebarOpen: false,

    // Loading global
    globalLoading: false,

    // Idioma
    locale: localStorage.getItem('lang') || 'es',
  }),

  actions: {
    // ===== TOASTS (reemplazo de alert()) =====
    showToast(severity: ToastMessage['severity'], summary: string, detail: string, life: number = 3000) {
      this.toastCounter++;
      const toast: ToastMessage = {
        id: this.toastCounter,
        severity,
        summary,
        detail,
        life
      };
      this.toasts.push(toast);

      // Auto-remove after life
      setTimeout(() => {
        this.removeToast(toast.id);
      }, life);
    },

    removeToast(id: number) {
      this.toasts = this.toasts.filter(t => t.id !== id);
    },

    success(msg: string, detail: string = '') {
      this.showToast('success', msg, detail);
    },

    error(msg: string, detail: string = '') {
      this.showToast('error', msg, detail, 5000);
    },

    warn(msg: string, detail: string = '') {
      this.showToast('warn', msg, detail);
    },

    info(msg: string, detail: string = '') {
      this.showToast('info', msg, detail);
    },

    // ===== THEME =====
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', String(this.darkMode));
      document.documentElement.classList.toggle('dark-theme', this.darkMode);
    },

    // ===== IDIOMA =====
    setLocale(lang: string) {
      this.locale = lang;
      localStorage.setItem('lang', lang);
    },

    // ===== SIDEBAR =====
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },

    // ===== LOADING =====
    setLoading(val: boolean) {
      this.globalLoading = val;
    }
  }
});