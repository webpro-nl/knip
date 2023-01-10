import path from 'node:path';
import { FIRST_ARGUMENT_AS_BINARY_EXCEPTIONS } from '../constants.js';
import { require } from '../util/require.js';

const normalizeBinaries = (command: string) =>
  command.replace(/(\.\/)?node_modules\/\.bin\/(\w+)/, '$2').replace(/\$\(npm bin\)\/(\w+)/, '$1');

const stripEnvironmentVariables = (value: string) => value.replace(/([A-Z][^ ]*)=([^ ])+ /g, '');

const getLoaderArgumentValues = (value: string) => {
  const match = value.match(/ (--(experimental-)?loader|--require|-r)[ =]([^ ]+)/g);
  if (match) return match.map(value => value.trim().split(/[ =]/)[1].trim());
  return [];
};

const getDependenciesFromLoaderArguments = (args: string[]) =>
  getLoaderArgumentValues(' ' + args.join(' '))
    .filter(scripts => !scripts.startsWith('.'))
    .map(script => {
      if (script.startsWith('@')) {
        const [scope, packageName] = script.split('/');
        return [scope, packageName].join('/');
      }
      return script.split('/')[0];
    });

export const getBinariesFromScripts = (npmScripts: string[]) =>
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

          // Bail out for this exception when dependencies don't need to be listed
          if (binary === 'npx' && /-y|--yes/.test(args[0])) return [binary];

          const firstArgument =
            FIRST_ARGUMENT_AS_BINARY_EXCEPTIONS.includes(binary) && args.find(arg => !arg.startsWith('-'));
          const dependenciesFromArguments = getDependenciesFromLoaderArguments(args);
          return [binary, firstArgument, ...dependenciesFromArguments];
        })
        .forEach(binary => binary && binaries.add(binary));
      return binaries;
    }, new Set() as Set<string>)
  );

export const getPackageManifest = async (workingDir: string, packageName: string, isRoot: boolean, cwd: string) => {
  try {
    return require(path.join(workingDir, 'node_modules', packageName, 'package.json'));
  } catch (error) {
    if (!isRoot) {
      try {
        return require(path.join(cwd, 'node_modules', packageName, 'package.json'));
      } catch (error) {
        // TODO: Handle errors properly, perhaps deal with other package managers
        // console.error(error?.toString());
      }
    }
    // TODO: Handle errors properly, perhaps deal with other package managers
    // console.error(error?.toString());
  }
};
