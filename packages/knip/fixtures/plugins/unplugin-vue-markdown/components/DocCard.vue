<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<template>
  <div class="card">{{ title }}</div>
</template>
