<script setup lang="ts">
const { count } = useCounter();
const date = ref(formatDate(new Date()));
</script>

<template>
  <div>
    <AppHeader :title="date" />
    {{ count }}
  </div>
</template>
