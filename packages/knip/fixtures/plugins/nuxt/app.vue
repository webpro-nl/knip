<script setup lang="ts">
import '#components';
import '#imports';
import { fn } from '~/utils/fn';
fn();
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtWelcome />
  </div>
</template>
