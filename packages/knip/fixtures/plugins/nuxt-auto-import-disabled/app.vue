<script setup lang="ts">
import { ref } from 'vue';
import { useCounter } from '~/composables/useCounter';
import { formatDate } from '~/utils/format';

const { count } = useCounter();
const date = ref(formatDate(new Date()));
</script>

<template>
  <div>
    <AppHeader :title="date" />
    {{ count }}
  </div>
</template>
