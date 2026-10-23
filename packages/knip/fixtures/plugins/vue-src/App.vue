<template>
  <p class="greeting">{{ message }}</p>
  <style-preview src="night" />
  <style-preview src="dawn"></style-preview>
</template>

<script lang="ts" src="./greeting.ts"></script>

<style src="modern-normalize/modern-normalize.css" />

<style scoped>
.greeting {
  font-weight: bold;
}
</style>
