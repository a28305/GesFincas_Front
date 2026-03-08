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
      Name: username.value,
      Email: email.value,
      Password: password.value
    });

    ui.success("¡Registro exitoso!", "Ahora puedes iniciar sesión");
    router.push('/login');
  } catch (error: any) {
    ui.error("Error", String(error.response?.data || "Error al registrarse"));
  }
};
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <div class="brand-wrap">
        <AppBrand :width="140" />
      </div>
      <div class="form-section">
        <input v-model="username" type="text" placeholder="Usuario" class="custom-input" autofocus />
        <input v-model="email" type="email" placeholder="Email" class="custom-input" />
        <input v-model="password" type="password" placeholder="Contraseña" class="custom-input" />
        <input v-model="confirmPassword" type="password" placeholder="Repetir Contraseña" class="custom-input" @keyup.enter="handleRegister" />
        <AuthToggle activeMode="register" />
        <PrimaryButton text="Registrarse" @click="handleRegister" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #FFF7ED; /* Mismo fondo que Login — cámbialo aquí */
  box-sizing: border-box;
}

.register-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 340px;
  gap: 24px;
}

.brand-wrap {
  pointer-events: none;
  user-select: none;
}

.form-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.custom-input {
  width: 100%;
  padding: 16px 20px;
  border-radius: 30px;
  border: none;
  background-color: #e8dab2;
  font-size: 16px;
  box-sizing: border-box;
  outline: none;
  color: #1a1a2e;
  font-family: inherit;
}

.custom-input::placeholder { color: #8a7a5a; }
.custom-input:focus { background-color: #ddd0a0; box-shadow: 0 0 0 3px rgba(255,140,0,0.15); }
</style>