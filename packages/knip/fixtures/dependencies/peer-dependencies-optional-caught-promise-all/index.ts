try {
  const [mod] = await Promise.all([import('pg')]);
  void mod;
} catch {}
