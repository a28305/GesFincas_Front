import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    userName: localStorage.getItem('userName') || 'Usuario',
    userRole: localStorage.getItem('role') || '',
    viviendaNombre: localStorage.getItem('viviendaNombre') || 'Comunidad no seleccionada',
    fincaActivaId: localStorage.getItem('fincaActiva') || null,
  }),
  actions: {
    setUserData(name: string, role: string) {
      this.userName = name || 'Usuario';
      this.userRole = role || '';
      localStorage.setItem('userName', this.userName);
      localStorage.setItem('role', this.userRole);
    },
    setComunidad(id: string, nombre: string) {
      this.fincaActivaId = id;
      this.viviendaNombre = nombre || 'Sin nombre';
      localStorage.setItem('fincaActiva', id);
      localStorage.setItem('viviendaNombre', this.viviendaNombre);
    },
    $reset() {
      this.userName = 'Usuario';
      this.viviendaNombre = 'Comunidad no seleccionada';
      this.userRole = '';
      this.fincaActivaId = null;
    }
  }
});