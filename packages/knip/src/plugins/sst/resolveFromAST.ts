import { Visitor } from 'oxc-parser';
import type { ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues, getImportMap } from '../../typescript/ast-helpers.ts';
import { parseFile } from '../../typescript/visitors/helpers.ts';
import { toDeferResolveProductionEntry } from '../../util/input.ts';
import { dirname } from '../../util/path.ts';
import { _resolveSync } from '../../util/resolve.ts';

export const getInputsFromHandlers: ResolveFromAST = (program, options) => {
  const entries = new Set<string>();

  const addHandlers = (values: Set<string>) => {
    for (const specifier of values) entries.add(specifier.substring(0, specifier.lastIndexOf('.')));
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
                  const stackResult = parseFile('stack.ts', stackText);
                  addHandlers(collectPropertyValues(stackResult.program, 'handler'));
                }
              }
            }
          }
        }
        if (propName === 'route' && node.arguments?.length >= 2) {
          const handlerArg = node.arguments[1];
          if (handlerArg?.type === 'Literal' && typeof handlerArg.value === 'string') entries.add(handlerArg.value);
        }
      },
    });
    visitor.visit(program);
  } catch {}

  return Array.from(entries).map(specifier =>
    toDeferResolveProductionEntry(specifier, { containingFilePath: options.configFilePath })
  );
};
