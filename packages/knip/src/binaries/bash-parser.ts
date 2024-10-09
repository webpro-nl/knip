import parse, { type Assignment, type ExpansionNode, type Node, type Prefix } from '../../vendor/bash-parser/index.js';
import { pluginArgsMap } from '../plugins.js';
import type { GetDependenciesFromScriptsOptions } from '../types/config.js';
import { debugLogObject } from '../util/debug.js';
import { type Dependency, toBinary, toDeferResolve } from '../util/protocols.js';
import { resolve as fallbackResolve } from './fallback.js';
import PackageManagerResolvers from './package-manager/index.js';
import { parseNodeArgs } from './package-manager/node.js';
import { resolve as resolverFromPlugins } from './plugins.js';
import { trimBinary } from './util.js';

// https://vorpaljs.github.io/bash-parser-playground/

type KnownResolver = keyof typeof PackageManagerResolvers;

// Binaries that spawn a child process for the binary at first positional arg (and don't have custom resolver already)
const spawningBinaries = ['cross-env', 'retry-cli'];

const isExpansion = (node: Prefix): node is ExpansionNode => 'expansion' in node;

const isAssignment = (node: Prefix): node is Assignment => 'type' in node && node.type === 'AssignmentWord';

export const getDependenciesFromScript = (script: string, options: GetDependenciesFromScriptsOptions): Dependency[] => {
  if (!script) return [];

  // Helper for recursive calls
  const fromArgs = (args: string[]) => {
    return getDependenciesFromScript(args.filter(arg => arg !== '--').join(' '), {
      ...options,
      knownGlobalsOnly: false,
    });
  };

  const getDependenciesFromNodes = (nodes: Node[]): Dependency[] =>
    nodes.flatMap(node => {
      switch (node.type) {
        case 'Command': {
          const text = node.name?.text;
          const binary = text ? trimBinary(text) : text;

          const commandExpansions =
            node.prefix
              ?.filter(isExpansion)
              .map(prefix => prefix.expansion)
              .flatMap(expansion => expansion.filter(expansion => expansion.type === 'CommandExpansion') ?? []) ?? [];

          if (commandExpansions.length > 0) {
            return (
              commandExpansions.flatMap(expansion => getDependenciesFromNodes(expansion.commandAST.commands)) ?? []
            );
          }

          // Bunch of early bail outs for things we can't or don't want to resolve
          if (!binary || binary === '.' || binary === 'source' || binary === '[') return [];
          if (binary.startsWith('-') || binary.startsWith('"') || binary.startsWith('..')) return [];

          const args = node.suffix?.map(arg => arg.text) ?? [];

          // Commands that precede other commands, try again with the rest
          if (['!', 'test'].includes(binary)) return fromArgs(args);

          const fromNodeOptions =
            node.prefix
              ?.filter(isAssignment)
              .filter(node => node.text.startsWith('NODE_OPTIONS='))
              .flatMap(node => node.text.split('=')[1])
              .map(arg => parseNodeArgs(arg.split(' ')))
              .filter(args => args.require)
              .flatMap(arg => arg.require)
              .map(toDeferResolve) ?? [];

          if (binary in PackageManagerResolvers) {
            const resolver = PackageManagerResolvers[binary as KnownResolver];
            return resolver(binary, args, { ...options, fromArgs });
          }

          if (pluginArgsMap.has(binary)) {
            return [...resolverFromPlugins(binary, args, { ...options, fromArgs }), ...fromNodeOptions];
          }

          if (spawningBinaries.includes(binary)) {
            // Run again with everything behind `binary -- ` (bash-parser AST is lacking)
            const command = script.replace(new RegExp(`.*${text ?? binary}(\\s--\\s)?`), '');
            return [toBinary(binary), ...getDependenciesFromScript(command, options)];
          }

          // Before using the fallback resolver, we need a way to bail out for scripts in CI environments like GitHub
          // Actions, which are provisioned with lots of unknown global binaries.
          if (options.knownGlobalsOnly && !text?.startsWith('.')) return [];

          return [...fallbackResolve(binary, args, { ...options, fromArgs }), ...fromNodeOptions];
        }
        case 'LogicalExpression':
          return getDependenciesFromNodes([node.left, node.right]);
        case 'If':
          return getDependenciesFromNodes([node.clause, node.then, ...(node.else ? [node.else] : [])]);
        case 'For':
          return getDependenciesFromNodes(node.do.commands);
        case 'CompoundList':
          return getDependenciesFromNodes(node.commands);
        case 'Pipeline':
          return getDependenciesFromNodes(node.commands);
        case 'Function':
          return getDependenciesFromNodes(node.body.commands);
        default:
          return [];
      }
    });

  try {
    const parsed = parse(script);
    return parsed?.commands ? getDependenciesFromNodes(parsed.commands) : [];
  } catch (error) {
    debugLogObject('*', 'Bash parser error', error);
    return [];
  }
};
