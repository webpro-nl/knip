<script setup lang="ts">
import { ref } from 'vue';
import { greeting } from '~/utils/greeting';

const message = ref(greeting);
</script>

<template>
  <div>{{ message }}</div>
</template>
