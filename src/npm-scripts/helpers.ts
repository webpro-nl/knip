import { createRequire } from 'node:module';
import path from 'node:path';
import { FIRST_ARGUMENT_AS_BINARY_EXCEPTIONS } from '../constants.js';

const require = createRequire(process.cwd());

const normalizeBinaries = (command: string) =>
  command.replace(/(\.\/)?node_modules\/\.bin\/(\w+)/, '$2').replace(/\$\(npm bin\)\/(\w+)/, '$1');

const stripEnvironmentVariables = (value: string) => value.replace(/([A-Z][^ ]*)=([^ ])+ /g, '');

const getLoaderArgumentValues = (value: string) => {
  const match = value.match(/ (--loader|--require|-r) ([^ ]+)/g);
  if (match) return match.map(value => value.trim().split(' ')[1].trim());
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
          const [binary, argumentOrBinary, ...args] = command.trim().split(' ');
          if (FIRST_ARGUMENT_AS_BINARY_EXCEPTIONS.includes(binary)) {
            const dependenciesFromArguments = getDependenciesFromLoaderArguments(args);
            return [binary, argumentOrBinary, ...dependenciesFromArguments];
          }
          const dependenciesFromArguments = getDependenciesFromLoaderArguments([argumentOrBinary, ...args]);
          return [binary, ...dependenciesFromArguments];
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
        // console.error(error?.toString());
      }
    }
    // console.error(error?.toString());
  }
};
