<script lang="ts">
  let show = $state(false);
</script>

{#if show}
  {#await import('./Lazy.svelte') then { default: Lazy }}
    <Lazy name="lazy" />
  {/await}
{/if}
