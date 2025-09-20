async function fn() {
  const fruit = await import('./fruits.ts');
  fruit.default;

  const { apple, banana: b } = await import('./fruits.ts');
  apple;
  b;

  const module = await import('./fruits.ts');
  module.cherry;

  const { durian, elderberry: e } = module;
  durian;
  e;
}

await fn();

export {};
