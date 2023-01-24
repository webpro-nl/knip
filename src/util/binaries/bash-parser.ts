// eslint-disable-next-line import/order -- Modules in @types are handled differently
import parse from 'bash-parser';
import parseArgs from 'minimist';
import * as KnownResolvers from './resolvers/index.js';
import type { Item } from 'bash-parser';
import type { PackageJson } from 'type-fest';

// https://vorpaljs.github.io/bash-parser-playground/

type KnownResolver = keyof typeof KnownResolvers;

// Binaries that spawn a process for another binary
const spawningBinaries = ['cross-env', 'dotenv'];

export const getBinariesFromScript = (
  script: string,
  { cwd, manifest, knownGlobalsOnly = false }: { cwd: string; manifest: PackageJson; knownGlobalsOnly?: boolean }
) => {
  const findBinaries = (items: Item[]): string[] =>
    items.flatMap(item => {
      switch (item.type) {
        case 'Command': {
          const binary = item.name?.text;

          // Bunch of early bail outs for things we can't or don't want to resolve
          if (!binary || binary === '.' || binary === 'source') return [];
          if (binary.startsWith('-') || binary.startsWith('"') || binary.startsWith('..')) return [];
          if (['bun', 'deno'].includes(binary)) return [];

          const args = item.suffix?.map(arg => arg.text) ?? [];

          // Commands that precede other commands, try again with the rest
          if (['!', 'test'].includes(binary)) return findBinaries(parse(args.join(' ')).commands);

          if (binary in KnownResolvers) {
            return KnownResolvers[binary as KnownResolver].resolve(binary, args, cwd, manifest);
          }

          // We need a way to bail out for scripts in environments like GitHub Actions, which are provisioned with lots
          // of unknown global binaries.
          if (knownGlobalsOnly) return [];

          if (spawningBinaries.includes(binary)) {
            const parsedArgs = parseArgs(args);
            const [spawnedBinary] = parsedArgs._;
            if (spawnedBinary) {
              const restArgs = args.slice(args.indexOf(spawnedBinary));
              return [binary, ...findBinaries(parse(restArgs.join(' ')).commands)];
            } else {
              return [];
            }
          }

          // We simply apply the node resolver for packages that also support --require (e.g. nodemon, mocha)
          return [binary, ...KnownResolvers.node.resolve(binary, args, cwd)];
        }
        case 'LogicalExpression':
          return findBinaries([item.left, item.right]);
        case 'If':
          return findBinaries([...item.clause.commands, ...item.then.commands]);
        case 'For':
          return findBinaries(item.do.commands);
        default:
          return [];
      }
    });

  const parsed = parse(script);
  return parsed?.commands ? findBinaries(parsed.commands) : [];
};
