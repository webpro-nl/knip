export function used() {}

export function serialize(data: unknown) {
  return JSON.stringify(data);
}

function inner() {
  const serialize = (v: string) => v.trim();
  return serialize('  shadowed  ');
}

function paramShadow(serialize: (v: string) => string) {
  return serialize('  param  ');
}

inner();
paramShadow((v) => v.trim());
