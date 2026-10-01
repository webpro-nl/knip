import { createStart } from '@tanstack/react-start';
import { routeTree } from './routeTree.gen.ts';

export const start = createStart(() => ({}));

export function createRouter() {
  return { routeTree };
}
