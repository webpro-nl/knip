import type { PlopTypes } from '@turbo/gen';

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator('x', { description: 'workspace config', prompts: [], actions: [] });
}
