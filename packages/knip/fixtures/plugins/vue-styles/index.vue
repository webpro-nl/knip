<script setup lang="ts">
import { defineComponent } from 'vue';

defineComponent({});
</script>

<template>
  <div class="card">
    <h1>Hello</h1>
  </div>
</template>

<style lang="scss">
@use './styles/variables' as vars;

.card {
  color: vars.$primary;
}
</style>

<style lang="less">
@import './styles/theme';

.card {
  background: @accent;
}
</style>

<style lang="stylus">
@require './styles/animations'

.card
  fade-in()
</style>
