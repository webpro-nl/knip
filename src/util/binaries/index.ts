import { IGNORED_GLOBAL_BINARIES } from '../../constants.js';
import { getArgumentValues } from '../plugin.js';
import { toCamelCase } from '../plugin.js';
import * as BinaryResolvers from './binaries/index.js';
import * as GlobalBinaryResolvers from './globals/index.js';
import type { PackageJson } from 'type-fest';

type BinaryNames = keyof typeof BinaryResolvers;
type GlobalBinaryNames = keyof typeof GlobalBinaryResolvers;

const normalizeBinaries = (command: string) =>
  command
    .replace(/(\.\/)?node_modules\/\.bin\/(\w+)/, '$2')
    .replace(/\$\(npm bin\)\/(\w+)/, '$1')
    .replace(/(\S+)@.*/, '$1');

const stripEnvironmentVariables = (value: string) => value.replace(/([A-Z][^ ]*)=([^ ])+ /g, '');

const getLoaderArgumentValues = (value: string) =>
  getArgumentValues(value, / (--(experimental-)?loader|--require|-r)[ =]([^ ]+)/g);

export const getDependenciesFromLoaderArguments = (args: string[]) =>
  getLoaderArgumentValues(' ' + args.join(' '))
    .filter(scripts => !scripts.startsWith('.'))
    .map(script => {
      if (script.startsWith('@')) {
        const [scope, packageName] = script.split('/');
        return [scope, packageName].join('/');
      }
      return script.split('/')[0];
    });

export const getBinariesFromScripts = (
  npmScripts: string[],
  {
    manifest,
    ignore = [],
    knownGlobalsOnly = false,
  }: { manifest: PackageJson; ignore?: string[]; knownGlobalsOnly?: boolean }
) =>
  Array.from(
    npmScripts.reduce((binaries, script) => {
      script
        .split(' && ')
        .flatMap(command => command.split(' -- '))
        .map(normalizeBinaries)
        .filter(command => /^\w/.test(command))
        .map(stripEnvironmentVariables)
        .flatMap(command => {
          const [binary, ...args] = command.trim().split(' ');
          const camelCased = toCamelCase(binary);

          // Plenty of Node.js packages use --loader and --require by convention, but bun and Deno do not. Bail out.
          if (['bun', 'deno'].includes(binary)) return [];

          if (camelCased in GlobalBinaryResolvers) {
            return GlobalBinaryResolvers[camelCased as GlobalBinaryNames].resolve(binary, args, manifest);
          }

          // We need a way to bail out for scripts in environments like GitHub Actions, which are provisioned with lots
          // of unknown global binaries.
          if (knownGlobalsOnly) return [];

          if (camelCased in BinaryResolvers) {
            return BinaryResolvers[camelCased as BinaryNames].resolve(binary, args);
          }

          const dependenciesFromArguments = getDependenciesFromLoaderArguments(args);
          return [binary, ...dependenciesFromArguments];
        })
        .forEach(binary => binary && binaries.add(binary));
      return binaries;
    }, new Set() as Set<string>)
  ).filter(binaryName => !IGNORED_GLOBAL_BINARIES.includes(binaryName) && !ignore.includes(binaryName));
