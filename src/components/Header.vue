<script setup lang="ts">
import { computed } from 'vue';
import { useUserStore } from '@/store/userstore';

const userStore = useUserStore();

const nombreUsuario = computed(() => userStore.userName || 'Usuario');
const nombreVivienda = computed(() => userStore.viviendaNombre || 'Mi Comunidad');

const getInitials = (name: string) => {
  if (!name || name === 'Usuario') return 'U';
  return name.trim().substring(0, 2).toUpperCase();
};
</script>

<template>
  <header class="main-header">
    <div class="welcome-section">
      <h1>{{ nombreVivienda }}</h1>
      <p>Bienvenido de nuevo, <strong>{{ nombreUsuario }}</strong></p>
    </div>

    <div class="profile-pill">
      <div class="user-text">
        <span class="u-name">{{ nombreUsuario }}</span>
        <small class="vivienda-tag">{{ nombreVivienda }}</small>
          
      </div>
      <span class="avatar">{{ getInitials(nombreUsuario) }}</span>
    </div>
  </header>
</template>

<style scoped>
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: transparent;
  margin-bottom: 20px;
}

.welcome-section h1 {
  font-size: 1.5rem;
  color: #1a1a2e;
  margin: 0;
}

.welcome-section p {
  color: #7f8c8d;
  margin: 5px 0 0 0;
  font-size: 0.9rem;
}

.profile-pill {
  background: white;
  padding: 8px 20px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}

.user-text {
  display: flex;
  flex-direction: column;
  text-align: right;
}

.u-name { font-weight: 700; font-size: 0.9rem; color: #2c3e50; }
.u-role { font-size: 0.75rem; color: #95a5a6; }

.avatar {
  width: 40px;
  height: 40px;
  background: #ff8c00;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .main-header { padding: 15px; flex-direction: column; align-items: flex-start; gap: 15px; }
  .profile-pill { align-self: flex-end; }
}
</style>