import type { PlopTypes } from '@turbo/gen';

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator('component', {
    description: 'Adds a new React component',
    prompts: [{ type: 'input', name: 'name', message: 'Component name' }],
    actions: [
      {
        type: 'add',
        path: 'src/components/{{pascalCase name}}.tsx',
        templateFile: 'templates/component.hbs',
      },
    ],
  });
}
