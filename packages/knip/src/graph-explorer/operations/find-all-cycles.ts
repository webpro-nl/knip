import type { Cycle } from '../../session/types.ts';
import type { ModuleGraph } from '../../types/module-graph.ts';
import { getRuntimeSuccessors } from '../utils.ts';

const UNVISITED = undefined;
const ON_STACK = 1;
const DONE = 2;

/**
 * Find circular dependencies across the entire module graph in a single pass.
 *
 * Iterative depth-first search emitting one cycle per back-edge to a node on the current
 * recursion stack. O(V+E), no depth cap, follows synchronous runtime edges only.
 */
export const findAllCycles = (graph: ModuleGraph, ignoredFlags?: number): Cycle[] => {
  const cycles: Cycle[] = [];
  const state = new Map<string, typeof ON_STACK | typeof DONE>();

  for (const root of graph.keys()) {
    if (state.get(root) !== UNVISITED) continue;

    const path: string[] = [];
    const indexOnPath = new Map<string, number>();
    const successorsStack: Array<Iterator<string>> = [];

    const push = (filePath: string) => {
      state.set(filePath, ON_STACK);
      indexOnPath.set(filePath, path.length);
      path.push(filePath);
      const node = graph.get(filePath);
      successorsStack.push((node ? getRuntimeSuccessors(node, ignoredFlags) : new Set<string>()).values());
    };

    push(root);

    while (path.length > 0) {
      const current = path[path.length - 1];
      const next = successorsStack[successorsStack.length - 1].next();

      if (next.done) {
        state.set(current, DONE);
        indexOnPath.delete(current);
        path.pop();
        successorsStack.pop();
        continue;
      }

      const successor = next.value;
      const successorState = state.get(successor);
      if (successorState === ON_STACK) {
        cycles.push([...path.slice(indexOnPath.get(successor)), successor]);
      } else if (successorState === UNVISITED) {
        push(successor);
      }
    }
  }

  return cycles;
};
