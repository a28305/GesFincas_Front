<script setup lang="ts">
import { ref } from 'vue';
import { useUiStore } from '@/store/Uistore';
import { useRouter } from 'vue-router';
import axios from 'axios';
import AppBrand from '@/components/AppBrand.vue';
import AuthToggle from '@/components/AuthToggle.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';

const router = useRouter();
const ui = useUiStore();

const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    ui.warn("Atención", "Las contraseñas no coinciden");
    return;
  }

  try {
    await axios.post('https://localhost:7152/api/auth/register', {
      Name: username.value, // Asegúrate de que tu DTO en C# use 'Name'
      Email: email.value,
      Password: password.value
    });

    ui.success("¡Registro exitoso!", "Ahora puedes iniciar sesión");
    router.push('/'); 
  } catch (error: any) {
    ui.error("Error", String(error.response?.data || "Error al registrarse"));
  }
};
</script>

<template>
  <div class="auth-wrapper">
    <AppBrand :width="100" />

    <div class="form-container">
      <input 
        v-model="username" 
        type="text" 
        placeholder="Usuario" 
        class="custom-input" 
        autofocus
      >
      <input 
        v-model="email" 
        type="email" 
        placeholder="Email" 
        class="custom-input"
      >
      <input 
        v-model="password" 
        type="password" 
        placeholder="Contraseña" 
        class="custom-input"
      >
      <input 
        v-model="confirmPassword" 
        type="password" 
        placeholder="Repetir Contraseña" 
        class="custom-input"
      >

      <AuthToggle activeMode="register" />

      <PrimaryButton text="Registrarse" @click="handleRegister" />
    </div>
  </div>
</template>

<style scoped>
/* Estilos estructurales de la página */
.auth-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.form-container {
  display: flex;
  flex-direction: column; 
  width: 100%;
  max-width: 320px;
  gap: 12px; /* Espacio entre inputs */
}

/* Estilo del input (no componente todavía) */
.custom-input {
  width: 100%;
  padding: 16px 20px;
  border-radius: 30px;
  border: none;
  background-color: #e8dab2; /* Color crema suave */
  font-size: 16px;
  box-sizing: border-box;
  outline: none;
}
</style>