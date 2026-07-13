<script>
import { ref } from 'vue';

export default {
  setup() {
    return { count: ref(0) };
  },
};
</script>

<template>
  <div>
    <AppleCard />
  </div>
</template>
