<script setup lang="ts">
const fruits = useBasket();
</script>

<template>
  <FruitCard :fruits="fruits" />
</template>
