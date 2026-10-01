import { add } from './math.ts';

export const total = (values: number[]) => values.reduce(add, 0);
