import { Visitor } from 'oxc-parser';
import type { ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues, findProperty, getImportMap } from '../../typescript/ast-helpers.ts';
import { _parseFile } from '../../typescript/ast-nodes.ts';
import { toEntryPath } from '../../util/input.ts';
import { dirname } from '../../util/path.ts';
import { _resolveSync } from '../../util/resolve.ts';

export const resolveFromAST: ResolveFromAST = (program, options) => {
  const entries = new Set<string>();

  const addHandler = (specifier: string) => entries.add(specifier.substring(0, specifier.lastIndexOf('.')));

  const addHandlers = (values: Set<string>) => {
    for (const specifier of values) addHandler(specifier);
  };

  try {
    const importMap = getImportMap(program);

    addHandlers(collectPropertyValues(program, 'handler'));

    const visitor = new Visitor({
      CallExpression(node) {
        if (node.callee?.type !== 'MemberExpression') return;
        const propName = !node.callee.computed ? node.callee.property?.name : undefined;
        if (propName === 'stack') {
          const arg = node.arguments?.[0];
          if (arg?.type === 'Identifier') {
            const importPath = importMap.get(arg.name);
            if (importPath) {
              const resolvedPath = _resolveSync(importPath, dirname(options.configFilePath));
              if (resolvedPath) {
                const stackText = options.readFile(resolvedPath);
                if (stackText) {
                  const stackResult = _parseFile('stack.ts', stackText);
                  addHandlers(collectPropertyValues(stackResult.program, 'handler'));
                }
              }
            }
          }
        }
        if (propName === 'route' && node.arguments?.length >= 2) {
          const handlerArg = node.arguments[1];
          if (handlerArg?.type === 'Literal' && typeof handlerArg.value === 'string') addHandler(handlerArg.value);
        }
        if (propName === 'subscribe') {
          const [first, second] = node.arguments;
          const subscriber =
            second?.type === 'Literal'
              ? second
              : !second || (second.type === 'ObjectExpression' && !findProperty(second, 'handler'))
                ? first
                : undefined;
          if (subscriber?.type === 'Literal' && typeof subscriber.value === 'string' && subscriber.value.includes('.'))
            addHandler(subscriber.value);
        }
      },
    });
    visitor.visit(program);
  } catch {}

  return Array.from(entries).map(specifier => toEntryPath(specifier, { production: true }));
};
