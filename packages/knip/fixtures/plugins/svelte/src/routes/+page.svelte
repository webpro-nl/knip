<script>
	import Counter from './Counter.svelte';
	import Component from '$lib/component.svelte';
	import store from '$lib/store.svelte.ts';
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<h1>
		Welcome to your new SvelteKit app
	</h1>

	<Counter />

	<Component />

	<pre>
		{store}
	</pre>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}
</style>
