<script setup lang="ts">
defineProps<{
  width?: number,
  showTitle?: boolean
}>();
</script>
<template>
  <div class="brand-section">
    <img src="@/assets/logo_gesfincas.png" alt="Logo" class="logo-img" :style="{ width: width + 'px' }">
    <h1 v-if="showTitle" class="brand-title">GESFINCAS</h1>
  </div>
</template>

<style scoped>
.brand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}
.logo-img {
  height: auto;
  display: block;
}
.brand-title {
  color: #ff8c00 !important;
  font-size: 28px;
  margin-top: 10px;
}
</style>