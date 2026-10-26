try {
  const [mod] = await Promise.all([import('pg')]);
  void mod;
  await Promise.all([import('pg')]);
} catch {}
