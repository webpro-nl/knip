// biome-ignore lint: well
let s: (data: any) => Buffer, d: (buffer: Buffer) => any;

if (typeof Bun !== 'undefined') {
  const { serialize, deserialize } = await import('bun:jsc');
  s = serialize;
  d = deserialize;
} else {
  const { serialize, deserialize } = await import('node:v8');
  s = serialize;
  d = deserialize;
}

export { s as serialize, d as deserialize };
