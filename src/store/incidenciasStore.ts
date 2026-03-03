import { defineStore } from 'pinia';
import axios from 'axios';
import { useUserStore } from './userstore';

// Interfaz para cumplir con TypeScript (Requisito de Oliver)
interface Incidencia {
  id_incidencias?: number;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  foto_URL?: string;
  id_user: number;
  id_proveedor?: number;
  id_piso: number;
  fechaCreacion?: string;
}

export const useIncidenciaStore = defineStore('incidencias', {
  // Al igual que en tu userstore, inicializamos el estado
  state: () => ({
    listaIncidencias: [] as Incidencia[],
    loading: false,
    error: null as string | null
  }),

  actions: {
    // 1. OBTENER INCIDENCIAS (Filtradas por el piso del UserStore)
    // src/store/incidenciasStore.ts
async fetchIncidencias() {
  const token = localStorage.getItem('token');
  const userStore = useUserStore();
  const idPiso = userStore.fincaActivaId;

  // Si no hay token o el piso es inválido, abortamos para evitar el error 401
  if (!token || !idPiso || idPiso === 'undefined' || idPiso === 'null') {
    return; 
  }

  this.loading = true;
  try {
    const res = await axios.get(`https://localhost:7152/api/Incidencias/piso/${idPiso}`, {
      headers: { 
        'Authorization': `Bearer ${token}` // LA LLAVE MAESTRA
      }
    });
    this.listaIncidencias = res.data;
  } catch (error) {
    // Si da 401 aquí, es que el token ha caducado
    console.error("Error de autorización:", error);
  } finally {
    this.loading = false;
  }
},

    // 2. CREAR INCIDENCIA (Guardar en la base de datos)
    async crearIncidencia(nueva: Incidencia) {
      const token = localStorage.getItem('token');
      this.loading = true;
      
      try {
        await axios.post('https://localhost:7152/api/Incidencias', nueva, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Tras guardar en la BD, refrescamos la lista local
        await this.fetchIncidencias();
      } catch (err) {
        console.error("Error al guardar en la BD:", err);
      } finally {
        this.loading = false;
      }
    }
  }
});