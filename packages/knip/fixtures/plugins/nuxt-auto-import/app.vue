<script setup lang="ts">
import { StatusBadge } from '#components';

const { count } = useCounter();
const date = ref(formatDate(new Date()));
const theme = { default: 'system' };
</script>

<template>
  <div>
    <AppHeader :title="date" />
    {{ count }} {{ theme.default }}
  </div>
</template>
