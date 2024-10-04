import parse, { type Assignment, type ExpansionNode, type Node, type Prefix } from '../../vendor/bash-parser/index.js';
import { debugLogObject } from '../util/debug.js';
import { toBinary } from '../util/protocols.js';
import * as FallbackResolver from './resolvers/fallback.js';
import KnownResolvers from './resolvers/index.js';
import { parseNodeArgs } from './resolvers/node.js';
import type { GetDependenciesFromScriptsOptions } from './types.js';
import { trimBinary } from './util.js';

// https://vorpaljs.github.io/bash-parser-playground/

type KnownResolver = keyof typeof KnownResolvers;

// Binaries that spawn a child process for the binary at first positional arg (and don't have custom resolver already)
const spawningBinaries = ['cross-env', 'retry-cli'];

const isExpansion = (node: Prefix): node is ExpansionNode => 'expansion' in node;

const isAssignment = (node: Prefix): node is Assignment => 'type' in node && node.type === 'AssignmentWord';

export const getBinariesFromScript = (script: string, options: GetDependenciesFromScriptsOptions) => {
  if (!script) return [];

  // Helper for recursive calls
  const fromArgs = (args: string[]) =>
    getBinariesFromScript(args.filter(arg => arg !== '--').join(' '), { ...options, knownGlobalsOnly: false });

  const getBinariesFromNodes = (nodes: Node[]): string[] =>
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
            return commandExpansions.flatMap(expansion => getBinariesFromNodes(expansion.commandAST.commands)) ?? [];
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
              .flatMap(arg => arg.require) ?? [];

          if (binary in KnownResolvers) {
            const resolver = KnownResolvers[binary as KnownResolver];
            return resolver(binary, args, { ...options, fromArgs });
          }

          if (spawningBinaries.includes(binary)) {
            const command = script.replace(new RegExp(`.*${node.name?.text ?? binary}(\\s--\\s)?`), '');
            return [toBinary(binary), ...getBinariesFromScript(command, options)];
          }

          // Before using the fallback resolver, we need a way to bail out for scripts in CI environments like GitHub
          // Actions, which are provisioned with lots of unknown global binaries.
          if (options.knownGlobalsOnly && !text?.startsWith('.')) return [];

          // We apply a kitchen sink fallback resolver for everything else
          return [...FallbackResolver.resolve(binary, args, { ...options, fromArgs }), ...fromNodeOptions];
        }
        case 'LogicalExpression':
          return getBinariesFromNodes([node.left, node.right]);
        case 'If':
          return getBinariesFromNodes([node.clause, node.then, ...(node.else ? [node.else] : [])]);
        case 'For':
          return getBinariesFromNodes(node.do.commands);
        case 'CompoundList':
          return getBinariesFromNodes(node.commands);
        case 'Pipeline':
          return getBinariesFromNodes(node.commands);
        case 'Function':
          return getBinariesFromNodes(node.body.commands);
        default:
          return [];
      }
    });

  try {
    const parsed = parse(script);
    return parsed?.commands ? getBinariesFromNodes(parsed.commands) : [];
  } catch (error) {
    debugLogObject('*', 'Bash parser error', error);
    return [];
  }
};
