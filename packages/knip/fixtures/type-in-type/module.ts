import type { Union, Wrapped, Mapped, Tuple, Intersection, Conditional, Nested } from './types.js';

export const create = (): Union => ({
  foo: 'bar',
});

const list: Wrapped = [];

const map: Mapped = new Map();

const tuple: Tuple = [{} as any, {} as any];

const both: Intersection = {} as any;

const cond: Conditional = {} as any;

const nested: Nested = new Set();
