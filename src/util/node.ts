import { getPackageNameFromModuleSpecifier } from './modules.js';

export function findNodeArgumentDependencies(nodeArgs: string[]) {
  const argPrefixes = ['--loader=', '--experimental-loader=', '--import=', '--require', '-r'];

  const deps: string[] = [];

  for (let i = 0; i < nodeArgs.length; i++) {
    const prefix = argPrefixes.find(prefix => nodeArgs[i].startsWith(prefix));
    if (prefix === undefined) {
      continue;
    }

    if (prefix.endsWith('=')) {
      deps.push(getPackageNameFromModuleSpecifier(nodeArgs[i].substring(prefix.length)));
      continue;
    }

    i += 1;
    deps.push(getPackageNameFromModuleSpecifier(nodeArgs[i].substring(prefix.length)));
  }

  return deps;
}
