try {
  await import('optional-peer').then(() => {});
} catch {}

try {
  await Promise.resolve(import('optional-peer'));
} catch {}

try {
  await consume(import('optional-peer'));
} catch {}

try {
  const load = async () => await import('optional-peer');
} catch {}
