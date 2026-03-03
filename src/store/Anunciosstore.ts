import { defineStore } from 'pinia';
import axios from 'axios';

export interface Anuncio {
  id_anuncio?: number;
  titulo: string;
  contenido: string;
  fechaPublicacion?: string;
  prioridad: string;
  foto_url?: string;
}

export const useAnuncioStore = defineStore('anuncios', {
  state: () => ({
    listaAnuncios: [] as Anuncio[],
    loading: false,
    error: null as string | null
  }),

  getters: {
    totalAnuncios: (state): number => state.listaAnuncios.length,
    anunciosUrgentes: (state): Anuncio[] =>
      state.listaAnuncios.filter(a => a.prioridad === 'Urgente'),
  },

  actions: {
    async fetchAnuncios() {
      const token = localStorage.getItem('token');
      if (!token) return;

      this.loading = true;
      this.error = null;
      try {
        const res = await axios.get('https://localhost:7152/api/Anuncios', {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.listaAnuncios = res.data;
      } catch (err) {
        this.error = 'Error al cargar anuncios';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    async crearAnuncio(nuevo: Anuncio) {
      const token = localStorage.getItem('token');
      this.loading = true;
      try {
        await axios.post('https://localhost:7152/api/Anuncios', nuevo, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await this.fetchAnuncios();
        return true;
      } catch (err) {
        this.error = 'Error al crear anuncio';
        console.error(err);
        return false;
      } finally {
        this.loading = false;
      }
    },

    async eliminarAnuncio(id: number) {
      const token = localStorage.getItem('token');
      this.loading = true;
      try {
        await axios.delete(`https://localhost:7152/api/Anuncios/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await this.fetchAnuncios();
        return true;
      } catch (err) {
        this.error = 'Error al eliminar anuncio';
        console.error(err);
        return false;
      } finally {
        this.loading = false;
      }
    }
  }
});