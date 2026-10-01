import type { PlopTypes } from '@turbo/gen';

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator('root', { description: 'root plopfile', prompts: [], actions: [] });
}
