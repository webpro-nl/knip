<script setup lang="ts">
import { ref } from 'vue';
const title = ref('Home');
</script>

<template>
  <div>
    <AppButton :label="title" />
  </div>
</template>
