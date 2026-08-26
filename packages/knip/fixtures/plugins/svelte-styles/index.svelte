<script lang="ts">
  import { onMount } from 'svelte';

  let title = 'Hello';

  onMount(() => {
    title = 'Mounted';
  });
</script>

<h1>{title}</h1>

<style lang="scss">
  @use './styles/variables' as vars;

  h1 {
    color: vars.$primary;
  }
</style>

<style lang="less">
  @import './styles/theme';

  h1 {
    background: @accent;
  }
</style>

<style lang="stylus">
  @require './styles/animations'

  h1
    fade-in()
</style>
