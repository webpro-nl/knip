const Two = 2;
const Three = 3;
const Four = 4;
const Five = 5;

export { Two, Three };

export { Four as Fourth, Five as Fifth };

export { Four as Rectangle, Five as Pentagon };

type Six = any;
type Seven = unknown;
const Eight = 8;
const Nine = 9;
type Ten = unknown[];

export type { Six };

export { type Seven, Eight, Nine, type Ten };

export const One = 1;

const fn = () => ({ get: () => 1, set: () => 1 });

export const { get: getter, set: setter } = fn();
