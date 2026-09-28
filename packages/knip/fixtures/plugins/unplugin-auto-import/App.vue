<script setup lang="ts">
import Card from './components/Card.vue';

const counter = useCounter();
</script>

<template>
  <div>{{ counter }}<Card /></div>
</template>
