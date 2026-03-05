<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import { useUserStore } from '@/store/userstore';
import { useUiStore } from '@/store/Uistore';
import axios from 'axios';

const userStore = useUserStore();
const ui = useUiStore();

const documentos = ref<any[]>([]);
const loading = ref(false);
const esAdmin = computed((): boolean => userStore.userRole === 'admin');

const busqueda = ref('');
const filtroActivo = ref('Todos');

const categorias = computed(() => {
  const cats = ['Todos'];
  const set = new Set<string>();
  documentos.value.forEach(d => {
    const c = d.categoria ?? d.Categoria ?? 'General';
    if (!set.has(c)) { set.add(c); cats.push(c); }
  });
  return cats;
});

const documentosFiltrados = computed(() => {
  let lista = documentos.value;
  if (filtroActivo.value !== 'Todos') {
    lista = lista.filter(d => (d.categoria ?? d.Categoria) === filtroActivo.value);
  }
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase();
    lista = lista.filter(d => (d.titulo ?? d.Titulo ?? '').toLowerCase().includes(q));
  }
  return lista;
});

const mostrarCrear = ref(false);
const nuevoDoc = ref({ titulo: '', categoria: 'General', descripcion: '', archivo_url: '' });
const categoriasOpciones = ['Actas de Juntas', 'Presupuestos', 'Normativa', 'Contratos', 'Seguros', 'Certificados', 'General'];
const confirmandoEliminar = ref<number | null>(null);

async function fetchDocumentos(): Promise<void> {
  const token = localStorage.getItem('token');
  const idPiso = userStore.fincaActivaId;
  if (!token || !idPiso) return;
  loading.value = true;
  try {
    const res = await axios.get(`https://localhost:7152/api/Documentacion/piso/${idPiso}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    documentos.value = res.data;
  } catch (err) { console.error(err); }
  finally { loading.value = false; }
}

async function crearDocumento(): Promise<void> {
  if (!nuevoDoc.value.titulo.trim()) {
    ui.warn('Campo obligatorio', 'El título es obligatorio');
    return;
  }
  const token = localStorage.getItem('token');
  try {
    await axios.post('https://localhost:7152/api/Documentacion', {
      titulo: nuevoDoc.value.titulo,
      categoria: nuevoDoc.value.categoria,
      descripcion: nuevoDoc.value.descripcion,
      archivo_url: nuevoDoc.value.archivo_url,
      fecha_subida: new Date().toISOString().split('T')[0],
      id_piso: Number(userStore.fincaActivaId)
    }, { headers: { Authorization: `Bearer ${token}` } });
    ui.success('Documento subido', 'El documento se ha añadido correctamente');
    nuevoDoc.value = { titulo: '', categoria: 'General', descripcion: '', archivo_url: '' };
    mostrarCrear.value = false;
    await fetchDocumentos();
  } catch { ui.error('Error', 'No se pudo subir el documento'); }
}

async function eliminarDocumento(): Promise<void> {
  if (!confirmandoEliminar.value) return;
  const token = localStorage.getItem('token');
  try {
    await axios.delete(`https://localhost:7152/api/Documentacion/${confirmandoEliminar.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    ui.success('Eliminado', 'Documento eliminado');
    confirmandoEliminar.value = null;
    await fetchDocumentos();
  } catch { ui.error('Error', 'No se pudo eliminar'); }
}

function formatFecha(fecha: string | null): string {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

function getCatIcon(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes('acta')) return '📋';
  if (c.includes('presupuesto')) return '💰';
  if (c.includes('normativa')) return '📜';
  if (c.includes('contrato')) return '📝';
  if (c.includes('seguro')) return '🛡️';
  if (c.includes('certificado')) return '🏅';
  return '📄';
}

function getCatCount(cat: string): number {
  if (cat === 'Todos') return documentos.value.length;
  return documentos.value.filter(d => (d.categoria ?? d.Categoria) === cat).length;
}

onMounted(() => fetchDocumentos());
</script>

<template>
  <div class="docs-page">
    <Header />

    <div class="page-top">
      <div class="page-info">
        <h2>📄 Documentos</h2>
        <p>Accede a toda la documentación de la comunidad</p>
      </div>
      <button v-if="esAdmin" class="btn-nueva" @click="mostrarCrear = !mostrarCrear">
        {{ mostrarCrear ? '✕ Cancelar' : '+ Subir Documento' }}
      </button>
    </div>

    <!-- BUSCADOR -->
    <div class="search-bar">
      <input v-model="busqueda" type="text" placeholder="🔍 Buscar documentos..." class="search-input">
    </div>

    <!-- FILTROS -->
    <div class="filtros-bar">
      <button v-for="cat in categorias" :key="cat"
        :class="['filtro-btn', { active: filtroActivo === cat }]"
        @click="filtroActivo = cat">
        {{ cat }} <span class="filtro-count">{{ getCatCount(cat) }}</span>
      </button>
    </div>

    <!-- FORM CREAR (admin) -->
    <Transition name="slide">
      <div v-if="mostrarCrear && esAdmin" class="form-box">
        <h3>Subir nuevo documento</h3>
        <div class="form-grid">
          <div class="input-group">
            <label>Título <span class="req">*</span></label>
            <input v-model="nuevoDoc.titulo" type="text" placeholder="Ej: Acta Junta Marzo 2026" class="form-input">
          </div>
          <div class="input-group">
            <label>Categoría</label>
            <select v-model="nuevoDoc.categoria" class="form-input">
              <option v-for="c in categoriasOpciones" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="input-group full">
            <label>Descripción</label>
            <textarea v-model="nuevoDoc.descripcion" placeholder="Breve descripción del documento..." class="form-textarea"></textarea>
          </div>
          <div class="input-group full">
            <label>URL del archivo (opcional)</label>
            <input v-model="nuevoDoc.archivo_url" type="text" placeholder="https://drive.google.com/..." class="form-input">
            <small class="hint">Puedes subir el archivo a Google Drive y pegar el enlace</small>
          </div>
        </div>
        <button class="btn-publicar" @click="crearDocumento">Subir Documento</button>
      </div>
    </Transition>

    <p v-if="loading" class="info-msg">Cargando documentos...</p>

    <!-- GRID DOCUMENTOS -->
    <div v-else-if="documentosFiltrados.length > 0" class="docs-grid">
      <div v-for="doc in documentosFiltrados" :key="doc.id_documento ?? doc.Id_documento" class="doc-card">
        <div class="doc-icon-box">
          <span class="doc-icon">{{ getCatIcon(doc.categoria ?? doc.Categoria ?? '') }}</span>
        </div>
        <div class="doc-info">
          <h4>{{ doc.titulo ?? doc.Titulo }}</h4>
          <span class="doc-cat">{{ doc.categoria ?? doc.Categoria }}</span>
          <small>{{ formatFecha(doc.fecha_subida ?? doc.Fecha_subida) }}</small>
        </div>
        <div class="doc-actions">
          <a v-if="doc.archivo_url" :href="doc.archivo_url" target="_blank" class="btn-ver">🔗 Ver</a>
          <span v-else class="btn-ver disabled">📄 Ver</span>
          <button v-if="esAdmin" class="btn-eliminar-doc" @click="confirmandoEliminar = doc.id_documento ?? doc.Id_documento">🗑️</button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <span class="empty-icon">📂</span>
      <h3>No hay documentos</h3>
      <p>{{ esAdmin ? 'Sube el primer documento de la comunidad.' : 'El administrador aún no ha subido documentos.' }}</p>
    </div>

    <!-- MODAL CONFIRMAR ELIMINAR -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="confirmandoEliminar" class="modal-overlay" @click.self="confirmandoEliminar = null">
          <div class="confirm-card">
            <span class="confirm-icon">🗑️</span>
            <h3>¿Eliminar documento?</h3>
            <p>Esta acción no se puede deshacer.</p>
            <div class="confirm-actions">
              <button class="btn-cancel" @click="confirmandoEliminar = null">Cancelar</button>
              <button class="btn-delete" @click="eliminarDocumento">Eliminar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Footer />
  </div>
</template>

<style scoped>
.docs-page { background-color: #f4f7f6; min-height: 100vh; padding: 0 30px 30px; display: flex; flex-direction: column; }
.page-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-info h2 { margin: 0; font-size: 1.6rem; color: #1a1a2e; }
.page-info p { margin: 4px 0 0 0; color: #7f8c8d; font-size: 0.9rem; }
.btn-nueva { background: #ff8c00; color: white; border: none; padding: 14px 28px; border-radius: 30px; font-weight: 700; cursor: pointer; }
.btn-nueva:hover { background: #e67e00; }

.search-bar { margin-bottom: 16px; }
.search-input { width: 100%; max-width: 400px; padding: 14px 18px; border-radius: 14px; border: 1.5px solid #E5E7EB; background: white; font-family: inherit; font-size: 0.95rem; box-sizing: border-box; outline: none; }
.search-input:focus { border-color: #ff8c00; box-shadow: 0 0 0 3px rgba(255,140,0,0.1); }

.filtros-bar { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; overflow-x: auto; }
.filtro-btn { padding: 8px 18px; border-radius: 10px; border: 1.5px solid #E5E7EB; background: white; color: #6B7280; font-weight: 600; font-size: 0.82rem; cursor: pointer; transition: 0.2s; white-space: nowrap; }
.filtro-btn:hover { border-color: #FFD9A0; color: #ff8c00; }
.filtro-btn.active { background: #ff8c00; color: white; border-color: #ff8c00; }
.filtro-count { margin-left: 4px; font-size: 0.72rem; opacity: 0.8; }

.form-box { background: white; border-radius: 20px; padding: 28px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); margin-bottom: 28px; }
.form-box h3 { margin: 0 0 20px 0; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-grid .full { grid-column: 1 / -1; }
.input-group { margin-bottom: 16px; }
.input-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.88rem; color: #374151; }
.req { color: #ff8c00; }
.hint { color: #9ca3af; font-size: 0.75rem; margin-top: 4px; display: block; }
.form-input { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1.5px solid #E5E7EB; background: #FAFAFA; font-family: inherit; font-size: 0.95rem; box-sizing: border-box; outline: none; }
.form-input:focus { border-color: #ff8c00; }
.form-textarea { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1.5px solid #E5E7EB; background: #FAFAFA; font-family: inherit; font-size: 0.95rem; box-sizing: border-box; outline: none; resize: none; height: 80px; }
.btn-publicar { width: 100%; padding: 15px; background: #ff8c00; color: white; border: none; border-radius: 30px; font-weight: 700; cursor: pointer; margin-top: 8px; }

.docs-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; flex: 1; }
.doc-card { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); display: flex; flex-direction: column; transition: 0.3s; }
.doc-card:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
.doc-icon-box { width: 48px; height: 48px; background: #FFF7ED; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin-bottom: 14px; }
.doc-info { flex: 1; }
.doc-info h4 { margin: 0 0 6px 0; font-size: 0.92rem; color: #1a1a2e; font-weight: 700; line-height: 1.3; }
.doc-cat { display: inline-block; background: #f3f4f6; padding: 2px 10px; border-radius: 6px; font-size: 0.7rem; color: #6b7280; font-weight: 600; margin-bottom: 6px; }
.doc-info small { display: block; font-size: 0.72rem; color: #9ca3af; }
.doc-actions { display: flex; gap: 8px; margin-top: 14px; align-items: center; }
.btn-ver { color: #22c55e; font-weight: 700; font-size: 0.82rem; text-decoration: none; cursor: pointer; }
.btn-ver:hover { text-decoration: underline; }
.btn-ver.disabled { color: #9ca3af; cursor: default; }
.btn-eliminar-doc { background: #fef2f2; border: 1px solid #fee2e2; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.btn-eliminar-doc:hover { background: #fee2e2; }

.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 3rem; display: block; margin-bottom: 16px; }
.info-msg { text-align: center; color: #95a5a6; padding: 40px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.confirm-card { background: white; max-width: 380px; width: 100%; border-radius: 24px; padding: 36px; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
.confirm-icon { font-size: 2.5rem; margin-bottom: 12px; display: block; }
.confirm-card h3 { margin: 0 0 8px 0; }
.confirm-card p { color: #6b7280; margin-bottom: 24px; }
.confirm-actions { display: flex; gap: 12px; }
.btn-cancel { flex: 1; padding: 14px; background: #F3F4F6; border: none; border-radius: 30px; font-weight: 600; cursor: pointer; color: #6B7280; }
.btn-delete { flex: 1; padding: 14px; background: #ef4444; color: white; border: none; border-radius: 30px; font-weight: 700; cursor: pointer; }

.slide-enter-active { animation: slideDown 0.3s ease; }
.slide-leave-active { animation: slideDown 0.2s ease reverse; }
@keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 500px; } }
.modal-enter-active { animation: modalIn 0.3s ease; }
.modal-leave-active { animation: modalIn 0.2s ease reverse; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

@media (max-width: 1024px) { .docs-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .docs-page { padding: 0 16px 20px; } .docs-grid { grid-template-columns: 1fr; } }
</style>