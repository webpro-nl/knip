<script lang="ts">
  /**
   * Component rules:
   *   1. NEVER import from outside this directory
   *   2. Keep it simple
   */

  // import Old from './does-not-exist.svelte';
  import type { WidgetOptions } from './types';
  import Widget from './Widget.svelte';

  const options: WidgetOptions = { eager: true };
  const LazyWidget = options.eager ? Widget : await import('./LazyWidget.svelte');
  const settings = await import('remote-config/settings.json', { with: { type: 'json' } });
</script>

<Widget />
<svelte:component this={LazyWidget} />
