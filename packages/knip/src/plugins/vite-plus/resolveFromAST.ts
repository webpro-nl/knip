import { Visitor } from 'oxc-parser';
import type { ResolveFromAST } from '../../types/config.ts';
import { findProperty, getPropertyValues } from '../../typescript/ast-helpers.ts';
import { getStringValue } from '../../typescript/ast-nodes.ts';
import type { Input } from '../../util/input.ts';

export const resolveFromAST: ResolveFromAST = (program, options) => {
  const commands: string[] = [];

  const visitor = new Visitor({
    ObjectExpression(node) {
      const run = findProperty(node, 'run');
      const tasks = run?.type === 'ObjectExpression' ? findProperty(run, 'tasks') : undefined;
      if (tasks?.type === 'ObjectExpression') {
        for (const task of tasks.properties ?? []) {
          if (task.type === 'Property' && task.value?.type === 'ObjectExpression') {
            for (const command of getPropertyValues(task.value, 'command')) commands.push(command);
          }
        }
      }

      const staged = findProperty(node, 'staged');
      if (staged?.type === 'ObjectExpression') {
        for (const prop of staged.properties ?? []) {
          if (prop.type === 'Property') {
            const command = getStringValue(prop.value);
            if (command) commands.push(command);
          }
        }
      }
    },
  });
  visitor.visit(program);

  const inputs: Input[] = [];
  for (const command of commands) {
    for (const input of options.getInputsFromScripts(command, { knownBinsOnly: true })) inputs.push(input);
  }
  return inputs;
};
