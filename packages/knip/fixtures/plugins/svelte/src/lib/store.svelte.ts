export function withStore(startCount?: number) {
	let count = $state<number>(startCount || 0);

	return {
		get count() {
			return count;
		},
		increment() {
			count += 1;
		}
	};
}
