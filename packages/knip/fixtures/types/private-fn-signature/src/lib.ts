export type AsParam = { a: string };
export type AsReturn = { b: string };
export type AsGenericArg = { c: string };
export type AsPrivateParam = { d: string };
export type AsLocalAnnotation = { e: string };
export type Unused = { f: string };

export const fnParam = (x: AsParam) => x.a;
export const fnReturn = (): AsReturn => ({ b: 'b' });
export const fnGeneric = (xs: Array<AsGenericArg>) => xs.length;

const privateFn = (y: AsPrivateParam) => y.d;

export const fnLocal = () => {
  const t: AsLocalAnnotation = { e: 'e' };
  return privateFn({ d: t.e });
};
