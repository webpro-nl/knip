export const x = 1;
export const y = 2;

// biome-ignore lint/suspicious/noEmptyInterface:  fixture festa
export interface McInterFace {}
// biome-ignore lint/complexity/noBannedTypes:  fixture festa
export type McType = {};
export enum McEnum {}

export const z = x + y;

export const { a, b } = { a: 1, b: 1 };

export const [c, d] = [3, 4];

export const [e, f] = [5, 6];

export const [g, h, i] = [7, 8, 9];

export default class MyClass {}

/** @lintignore */
export type U = number;
