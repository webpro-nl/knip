<script module>
import { external } from 'svelte';
export function detectBanner() {
  return external();
}
export function dismissBanner() {
  return null;
}
</script>

<script>
const value = detectBanner();
</script>

<p>{value}</p>
