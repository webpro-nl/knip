import { Visitor } from 'oxc-parser';
import type { ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues, getImportMap } from '../../typescript/ast-helpers.ts';
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

  const parseImport = (specifier: string) => {
    const filePath = _resolveSync(specifier, dirname(options.configFilePath));
    const text = filePath ? options.readFile(filePath) : undefined;
    return filePath && text ? _parseFile(filePath, text).program : undefined;
  };

  try {
    const importMap = getImportMap(program);
    const dynamicImports: string[] = [];

    addHandlers(collectPropertyValues(program, 'handler'));

    const visitor = new Visitor({
      ImportExpression(node) {
        const source = node.source;
        if (source.type === 'Literal' && typeof source.value === 'string' && source.value.startsWith('.'))
          dynamicImports.push(source.value);
      },
      CallExpression(node) {
        if (node.callee?.type !== 'MemberExpression') return;
        const propName = !node.callee.computed ? node.callee.property?.name : undefined;
        if (propName === 'stack') {
          const arg = node.arguments?.[0];
          const importPath = arg?.type === 'Identifier' ? importMap.get(arg.name) : undefined;
          const stack = importPath ? parseImport(importPath) : undefined;
          if (stack) addHandlers(collectPropertyValues(stack, 'handler'));
        }
        if (propName === 'route' && node.arguments?.length >= 2) {
          const handlerArg = node.arguments[1];
          if (handlerArg?.type === 'Literal' && typeof handlerArg.value === 'string') addHandler(handlerArg.value);
        }
      },
    });
    visitor.visit(program);

    for (const infra of dynamicImports.map(parseImport)) {
      if (!infra) continue;
      addHandlers(collectPropertyValues(infra, 'handler'));
      visitor.visit(infra);
    }
  } catch {}

  return Array.from(entries).map(specifier => toEntryPath(specifier, { production: true }));
};
