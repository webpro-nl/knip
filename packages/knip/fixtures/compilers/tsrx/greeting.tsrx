import { onMount } from 'octane';
import { formatName } from './format.ts';

type GreetingProps = { name: string };

export function Greeting(props: GreetingProps) @{
	onMount(() => {});
	const label = formatName(props.name);
	<h1>{label}</h1>
}
