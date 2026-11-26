import { Util } from './util';

export async function main() {
  const { Util: Aliased } = await import('./util');
  const inline = (await import('./util')).Util.inlineUsed();
  const thened = await import('./util').then(({ Util }) => Util.thenUsed());
  const fromNs = await import('./util').then(m => m.Util.nsUsed());
  return Util.staticallyUsed() + Aliased.dynamicallyUsed() + inline + thened + fromNs;
}
