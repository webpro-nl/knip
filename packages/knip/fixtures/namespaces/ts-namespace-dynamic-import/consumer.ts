export async function run() {
  const { Helpers } = await import('./dynamic-only');
  return Helpers.used();
}
