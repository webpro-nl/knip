<script>
	import { withStore } from '$lib/store.svelte';
	let store = withStore(0);
</script>

<button onclick={store.increment}>
	clicks: {store.count}
</button>
