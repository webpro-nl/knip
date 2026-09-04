<script setup lang="ts">
import type { VirtualOnly } from '#components';

const { count } = useCounter();
const date = ref(formatDate(new Date()));
const theme = { default: 'system' };
const badge = ref<InstanceType<typeof VirtualOnly>>();
</script>

<template>
  <div>
    <AppHeader :title="date" />
    {{ count }} {{ theme.default }}
  </div>
</template>
