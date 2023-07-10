import parse from '@ericcornelissen/bash-parser';
import parseArgs from 'minimist';
import { debugLogObject } from '../util/debug.js';
import * as FallbackResolver from './resolvers/fallback.js';
import * as KnownResolvers from './resolvers/index.js';
import { stripBinaryPath, toBinary } from './util.js';
import type { Node } from '@ericcornelissen/bash-parser';
import type { PackageJson } from 'type-fest';

// https://vorpaljs.github.io/bash-parser-playground/

type KnownResolver = keyof typeof KnownResolvers;

// Local binaries that spawn a child process for another binary
const spawningBinaries = ['cross-env', 'dotenv'];

export const getBinariesFromScript = (
  script: string,
  { cwd, manifest, knownGlobalsOnly = false }: { cwd: string; manifest: PackageJson; knownGlobalsOnly?: boolean }
) => {
  if (!script) return [];

  // Helper for recursive calls
  const fromArgs = (args: string[]) => getBinariesFromScript(args.join(' '), { cwd, manifest });

  const getBinariesFromNodes = (nodes: Node[]): string[] =>
    nodes.flatMap(node => {
      switch (node.type) {
        case 'Command': {
          const binary = node.name?.text ? stripBinaryPath(node.name.text) : node.name?.text;

          const commandExpansions =
            node.prefix?.flatMap(
              prefix => prefix.expansion?.filter(expansion => expansion.type === 'CommandExpansion') ?? []
            ) ?? [];

          if (commandExpansions.length > 0) {
            return commandExpansions.flatMap(expansion => getBinariesFromNodes(expansion.commandAST.commands)) ?? [];
          }

          // Bunch of early bail outs for things we can't or don't want to resolve
          if (!binary || binary === '.' || binary === 'source') return [];
          if (binary.startsWith('-') || binary.startsWith('"') || binary.startsWith('..')) return [];
          if (['bun', 'deno'].includes(binary)) return [];

          const args = node.suffix?.map(arg => arg.text) ?? [];

          // Commands that precede other commands, try again with the rest
          if (['!', 'test'].includes(binary)) return fromArgs(args);

          if (binary in KnownResolvers) {
            return KnownResolvers[binary as KnownResolver].resolve(binary, args, { cwd, manifest, fromArgs });
          }

          // We need a way to bail out for scripts in environments like GitHub Actions, which are provisioned with lots
          // of unknown global binaries.
          if (knownGlobalsOnly) return [];

          if (spawningBinaries.includes(binary)) {
            const parsedArgs = parseArgs(args);
            const [spawnedBinary] = parsedArgs._;
            if (spawnedBinary) {
              const restArgs = args.slice(args.indexOf(spawnedBinary));
              return [toBinary(binary), ...fromArgs(restArgs)];
            } else {
              return [];
            }
          }

          // We apply a kitchen sink fallback resolver for everything else
          return FallbackResolver.resolve(binary, args, { cwd, manifest, fromArgs });
        }
        case 'LogicalExpression':
          return getBinariesFromNodes([node.left, node.right]);
        case 'If':
          return getBinariesFromNodes([...node.clause.commands, ...node.then.commands]);
        case 'For':
          return getBinariesFromNodes(node.do.commands);
        default:
          return [];
      }
    });

  try {
    const parsed = parse(script);
    return parsed?.commands ? getBinariesFromNodes(parsed.commands) : [];
  } catch (error) {
    debugLogObject('Bash parser error', error);
    return [];
  }
};
