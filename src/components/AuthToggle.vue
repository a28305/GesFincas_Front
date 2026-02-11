<script setup lang="ts">
defineProps<{
  activeMode: 'login' | 'register'
}>();
</script>
<template>
  <div class="toggle-bar">
    <div 
      class="toggle-option" 
      :class="{ active: activeMode === 'login' }"
      @click="$router.push('/')"
    >
      Iniciar sesión
    </div>
    <div 
      class="toggle-option" 
      :class="{ active: activeMode === 'register' }"
      @click="$router.push('/register')"
    >
      Registrarse
    </div>
  </div>
</template>

<style scoped>
.toggle-bar {
  display: flex;
  background-color: #e8dab2;
  border-radius: 30px;
  padding: 4px;
  margin-top: 10px;
  width: 100%;
}
.toggle-option {
  flex: 1;
  text-align: center;
  padding: 10px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 25px;
  color: #555;
  transition: all 0.3s ease;
}
.active {
  background-color: white;
  color: black;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>