<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import AppBrand from '@/components/AppBrand.vue';
import { useUiStore } from '@/store/Uistore';
import AuthToggle from '@/components/AuthToggle.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import { useUserStore } from '@/store/userstore'; 

const router = useRouter();
const ui = useUiStore();
const userStore = useUserStore();

const email = ref('');
const password = ref('');

const handleLogin = async () => {
  try {
    const response = await axios.post('https://localhost:7152/api/auth/login', {
      Email: email.value,
      Password: password.value
    });

    const data = response.data;

    localStorage.clear();
    userStore.$reset();

    const token = data.token;
    const userId = data.userId;
    const role = data.role || 'vecino';
    const hasPisos = data.hasPisos ?? false;
    const nombre = data.name || (email.value?.split('@')[0] ?? 'Usuario');

    localStorage.setItem('token', token);
    localStorage.setItem('userId', String(userId));
    localStorage.setItem('role', role);
    localStorage.setItem('hasPisos', String(hasPisos));
    localStorage.setItem('userEmail', data.email || email.value || '');

    userStore.setUserData(nombre, role);

    // ── Si ya tiene piso asignado, lo cargamos ──
    if (hasPisos) {
      try {
        const pisoRes = await axios.get(`https://localhost:7152/api/pisos/mi-vivienda/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const piso = pisoRes.data;
        if (piso && piso.nombre) {
          // FIX: usar piso.id_piso en vez de userId
          userStore.setComunidad(String(piso.id_piso), piso.nombre);
        }
      } catch (pisoErr) {
        console.warn('⚠️ No se pudo cargar el piso:', pisoErr);
      }
    }

    // ── Redirección ──
    if (role === 'admin') {
      router.push('/app/dashboard');
    } else if (!hasPisos) {
      router.push('/Select_piso');
    } else {
      router.push('/app/dashboard');
    }

  } catch (error: any) {
    console.error("Error en login:", error);
    ui.error("Error de acceso", "Credenciales incorrectas");
  }
};
</script>

<template>
  <div class="login-container">
    <AppBrand :width="120" />
    <div class="form-section">
      <input v-model="email" type="email" placeholder="Email" class="custom-input" autofocus>
      <input v-model="password" type="password" placeholder="Contraseña" class="custom-input">
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
.custom-input {
  width: 100%;
  padding: 15px 20px;
  border-radius: 25px;
  border: none;
  background-color: #e8dab2;
  font-size: 16px;
  box-sizing: border-box;
  outline: none;
}
</style>