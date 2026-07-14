<script>
import { ref } from 'vue';

export default {
  setup() {
    return { count: ref(1), form: { name: '' } };
  },
};
</script>

<template>
  <main>
    <span v-if="count">Growing</span>
    <AppleCard v-else :label="formatApple(count)" />
    <input v-model="form.name" />
  </main>
</template>
