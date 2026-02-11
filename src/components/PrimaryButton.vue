
<script setup lang="ts">
defineProps<{
  text: string
}>();

defineEmits(['click']);
</script>
<template>
  <button class="btn-primary" @click="$emit('click')">
    {{ text }}
  </button>
</template>



<style scoped>
.btn-primary {
  background-color: #ff8c00; /* Naranja corporativo */
  color: white;
  border: none;
  padding: 16px;
  border-radius: 30px;
  font-size: 18px;
  font-weight: bold;
  margin-top: 20px;
  cursor: pointer;
  width: 100%;
  max-width: 320px;
}
</style>