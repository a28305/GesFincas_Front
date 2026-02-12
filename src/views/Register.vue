
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios'; // Importamos Axios
import AppBrand from '@/components/AppBrand.vue';
import AuthToggle from '@/components/AuthToggle.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';

const router = useRouter();

const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

const handleRegister = async () => {
  // 1. Validaciones de cliente (Frontend)
  if (!username.value || !email.value || !password.value) {
    alert("Por favor, rellena todos los campos.");
    return;
  }
  
  if (password.value !== confirmPassword.value) {
    alert("Las contraseñas no coinciden.");
    return;
  }

  try {
    // 2. Llamada a la API
    const response = await axios.post('https://localhost:7152/api/auth/register', {
      Name: username.value, 
      Email: email.value,
      Password: password.value
    });

    // 3. Respuesta 
    alert("¡Usuario registrado correctamente en GesFincas!");
    router.push('/'); 

  } catch (error: any) {
    // 4. Manejo de errores
    console.error("Error en el registro:", error);
    const mensajeError = error.response?.data || "Error al conectar con el servidor";
    alert(mensajeError);
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