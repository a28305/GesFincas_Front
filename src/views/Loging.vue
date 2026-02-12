<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AppBrand from '@/components/AppBrand.vue';
import AuthToggle from '@/components/AuthToggle.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import axios from 'axios';

const router = useRouter();

// Variables reactivas para capturar los datos
const email = ref('');
const password = ref('');


const handleLogin = async () => {
  try {
    const response = await axios.post('https://localhost:7152/api/auth/login', {
      Email: email.value,
      Password: password.value
     
    });

    const { token, hasPisos,userId,role:userRole } = response.data; // Recibimos los nuevos datos

    // Guardamos en el navegador
    localStorage.setItem('token', token);
    localStorage.setItem('hasPisos', hasPisos.toString());
    localStorage.setItem('userId', userId.toString()); // Necesario para asignar pisos
    localStorage.setItem('role', userRole); // Necesario para mostrar el botón "+

    // Redirección inteligente
    if (!hasPisos) {
      router.push('/Select_piso'); // Si es nuevo, a elegir piso
    } else {
      router.push('/dashboard'); // Si ya tiene, al inicio
    }
  } catch (error) {
    alert("Error al iniciar sesión");
  }
};
</script>

<template>
  <div class="login-container">
    <AppBrand :width="120" />

    <div class="form-section">
      <input 
        v-model="email" 
        type="email" 
        placeholder="Email" 
        class="custom-input" 
        autofocus
      >
      <input 
        v-model="password" 
        type="password" 
        placeholder="Contraseña" 
        class="custom-input"
      >
      
      <AuthToggle activeMode="login" />

      <PrimaryButton text="Iniciar sesión" @click="handleLogin" />
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.form-section {
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Solo dejamos el CSS del input ya que el resto está en los componentes */
.custom-input {
  width: 100%;
  padding: 15px 20px;
  border-radius: 25px;
  border: none;
  background-color: #e8dab2; /* Color café suave */
  font-size: 16px;
  box-sizing: border-box;
  outline: none;
}
</style>