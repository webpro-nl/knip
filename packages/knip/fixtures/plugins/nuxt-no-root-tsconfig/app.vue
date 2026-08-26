<script setup lang="ts">
import '#build/runtime-config';
import '#internal/runtime-config';
import '#spa-template';
import { ref } from 'vue';
import { greeting } from '~/utils/greeting';

const message = ref(greeting);
</script>

<template>
  <div>{{ message }}</div>
</template>
