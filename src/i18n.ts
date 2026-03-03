import { createI18n } from 'vue-i18n';

const messages = {
  es: {
    // Navegación
    nav: {
      dashboard: 'Dashboard',
      incidencias: 'Incidencias',
      tablon: 'Tablón de Anuncios',
      zonas: 'Zonas Comunes',
      pagos: 'Pagos',
      documentos: 'Documentos',
      admin: 'ADMINISTRACIÓN',
      vecinos: 'Gestión Vecinos',
      fincas: 'Configurar Fincas'
    },
    // Dashboard
    dashboard: {
      welcome: 'Bienvenido de nuevo',
      total: 'Total Incidencias',
      nuevas: 'Nuevas',
      enProceso: 'En Proceso',
      resueltas: 'Resueltas',
      ultimas: 'Últimas Incidencias',
      verTodos: 'Ver todos',
      pagos: 'Resumen de Pagos',
      alDia: 'Pagos al día',
      pendientes: 'Pendientes',
      vencidos: 'Vencidos',
      acciones: 'Acciones Rápidas',
      nuevaInc: '+ Nueva Incidencia',
      reservar: 'Reservar Zona Común',
      verDocs: 'Ver Documentos',
      anuncios: 'Anuncios',
      noIncidencias: 'No hay incidencias registradas en esta comunidad.',
      cargando: 'Cargando datos del servidor...'
    },
    // Incidencias
    incidencias: {
      titulo: 'Incidencias',
      subtitulo: 'Gestiona las incidencias de la comunidad',
      nueva: '+ Nueva Incidencia',
      estado: 'Estado',
      todas: 'Todas',
      filtroNuevas: 'Nuevas',
      enProceso: 'En Proceso',
      filtroResueltas: 'Resueltas',
      verDetalles: 'Ver Detalles',
      noHay: 'No hay incidencias',
      cerrar: 'Cerrar',
      actualizar: 'Actualizar Estado'
    },
    // Anuncios
    anuncios: {
      titulo: 'Tablón de Anuncios',
      subtitulo: 'Comunicados y avisos de la comunidad',
      nuevo: '+ Nuevo Anuncio',
      prioridad: 'Prioridad',
      todos: 'Todos',
      publicar: 'Publicar Anuncio',
      tituloLabel: 'Título',
      contenido: 'Contenido',
      noHay: 'No hay anuncios',
      eliminar: '¿Eliminar anuncio?',
      eliminarMsg: 'Esta acción no se puede deshacer.',
      cancelar: 'Cancelar'
    },
    // Modal nueva incidencia
    modal: {
      titulo: 'Nueva Incidencia',
      tipo: 'Tipo',
      detalles: 'Detalles',
      tituloLabel: 'Título',
      categoria: 'Categoría',
      prioridad: 'Prioridad',
      siguiente: 'Siguiente',
      descripcion: 'Descripción',
      descripcionPh: 'Describe la incidencia con el mayor detalle posible...',
      apartamento: 'Tu apartamento',
      ubicacion: 'Ubicación exacta',
      atras: 'Atrás',
      enviar: 'Enviar incidencia',
      baja: 'Baja',
      media: 'Media',
      alta: 'Alta'
    },
    // Auth
    auth: {
      login: 'Iniciar Sesión',
      register: 'Registrarse',
      email: 'Correo electrónico',
      password: 'Contraseña',
      confirmar: 'Confirmar contraseña',
      nombre: 'Nombre completo',
      entrar: 'Entrar',
      crearCuenta: 'Crear cuenta',
      yaTengo: '¿Ya tienes cuenta?',
      noTengo: '¿No tienes cuenta?'
    },
    // General
    general: {
      cargando: 'Cargando...',
      error: 'Error',
      exito: 'Éxito',
      guardar: 'Guardar',
      cancelar: 'Cancelar',
      eliminar: 'Eliminar',
      buscar: 'Buscar',
      idioma: 'Idioma'
    }
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      incidencias: 'Incidents',
      tablon: 'Notice Board',
      zonas: 'Common Areas',
      pagos: 'Payments',
      documentos: 'Documents',
      admin: 'ADMINISTRATION',
      vecinos: 'Manage Residents',
      fincas: 'Configure Properties'
    },
    dashboard: {
      welcome: 'Welcome back',
      total: 'Total Incidents',
      nuevas: 'New',
      enProceso: 'In Progress',
      resueltas: 'Resolved',
      ultimas: 'Latest Incidents',
      verTodos: 'View all',
      pagos: 'Payments Summary',
      alDia: 'Up to date',
      pendientes: 'Pending',
      vencidos: 'Overdue',
      acciones: 'Quick Actions',
      nuevaInc: '+ New Incident',
      reservar: 'Book Common Area',
      verDocs: 'View Documents',
      anuncios: 'Announcements',
      noIncidencias: 'No incidents registered in this community.',
      cargando: 'Loading data from server...'
    },
    incidencias: {
      titulo: 'Incidents',
      subtitulo: 'Manage community incidents',
      nueva: '+ New Incident',
      estado: 'Status',
      todas: 'All',
      filtroNuevas: 'New',
      enProceso: 'In Progress',
      filtroResueltas: 'Resolved',
      verDetalles: 'View Details',
      noHay: 'No incidents',
      cerrar: 'Close',
      actualizar: 'Update Status'
    },
    anuncios: {
      titulo: 'Notice Board',
      subtitulo: 'Community announcements and notices',
      nuevo: '+ New Announcement',
      prioridad: 'Priority',
      todos: 'All',
      publicar: 'Publish Announcement',
      tituloLabel: 'Title',
      contenido: 'Content',
      noHay: 'No announcements',
      eliminar: 'Delete announcement?',
      eliminarMsg: 'This action cannot be undone.',
      cancelar: 'Cancel'
    },
    modal: {
      titulo: 'New Incident',
      tipo: 'Type',
      detalles: 'Details',
      tituloLabel: 'Title',
      categoria: 'Category',
      prioridad: 'Priority',
      siguiente: 'Next',
      descripcion: 'Description',
      descripcionPh: 'Describe the incident in as much detail as possible...',
      apartamento: 'Your apartment',
      ubicacion: 'Exact location',
      atras: 'Back',
      enviar: 'Submit incident',
      baja: 'Low',
      media: 'Medium',
      alta: 'High'
    },
    auth: {
      login: 'Log In',
      register: 'Sign Up',
      email: 'Email address',
      password: 'Password',
      confirmar: 'Confirm password',
      nombre: 'Full name',
      entrar: 'Log In',
      crearCuenta: 'Create account',
      yaTengo: 'Already have an account?',
      noTengo: "Don't have an account?"
    },
    general: {
      cargando: 'Loading...',
      error: 'Error',
      exito: 'Success',
      guardar: 'Save',
      cancelar: 'Cancel',
      eliminar: 'Delete',
      buscar: 'Search',
      idioma: 'Language'
    }
  }
};

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'es',
  fallbackLocale: 'es',
  messages,
});

export default i18n;