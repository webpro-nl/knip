import type { Greeting } from './types';

export const greet = (name: string): Greeting => ({ name });

export const internalUnused = 1;
