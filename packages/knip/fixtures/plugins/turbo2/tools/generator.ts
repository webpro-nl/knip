import type { PlopTypes } from '@turbo/gen';

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator('scaffold', { description: 'custom --config path', prompts: [], actions: [] });
}
