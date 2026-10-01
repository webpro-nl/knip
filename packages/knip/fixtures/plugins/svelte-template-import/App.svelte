<script lang="ts">
  import Widget from './Widget.svelte';
  import type { Mode } from './types';

  let mode = $state<Mode>('idle');
  let show = $state(false);

  // import Old from './does-not-exist.svelte';
  const loadScriptLazy = () => import('./ScriptLazy.svelte');
</script>

<!-- Commented-out template import must NOT count: import('./Removed.svelte') -->

<code>import('./Removed.svelte')</code>
<div title="import('./Removed.svelte')">
  {"import('./Removed.svelte')"}
  {`import('./Removed.svelte')`}
</div>

<Widget />
<button onclick={loadScriptLazy}>script</button>
<button onclick={() => import('./Handler.svelte')}>handler</button>
<button onclick={() => import('./data.json', { with: { type: 'json' } })}>data</button>
<button onclick={() => ({ load: () => import('./NestedExpression.svelte') })}>nested</button>
<button onclick={() => `${import('./TemplateInterpolation.svelte')}`}>template interpolation</button>
<button onclick={() => { /* import('./Removed.svelte') */ }}>comment</button>

<p>Click a button to import a component.</p>

{#if show}
  {#await import('./AwaitSingle.svelte') then { default: C }}<C />{/await}
  {#await import("./AwaitDouble.svelte") then { default: C }}<C />{/await}
  {#await import(`./AwaitTemplate.svelte`) then { default: C }}<C />{/await}
  {#await import /* before call */ ('./AwaitCommentBefore.svelte') then { default: C }}<C />{/await}
  {#await import(/* before specifier */ './AwaitCommentAfter.svelte') then { default: C }}<C />{/await}
  {#await import('./Esc\u0061ped.svelte') then { default: C }}<C />{/await}
  {#await import(
    './AwaitSpaced.svelte'
  ) then { default: C }}<C />{/await}
{/if}

{#if mode === 'multi'}
  {#await import('./MultiA.svelte') then { default: A }}<A />{/await}{#await import('./MultiB.svelte') then { default: B }}<B />{/await}
{/if}
