import type { GetDependenciesFromScripts } from '../types/config.js';
import { timerify } from '../util/Performance.js';
import { type Dependency, fromBinary, isBinary } from '../util/dependencies.js';
import { getDependenciesFromScript } from './bash-parser.js';

const getDependenciesFromScripts: GetDependenciesFromScripts = (npmScripts, options) => {
  const scripts = typeof npmScripts === 'string' ? [npmScripts] : [...npmScripts];
  const results = scripts.flatMap(script => getDependenciesFromScript(script, options));
  const dependencies = new Set<Dependency>();

  for (const dependency of results) {
    if (!dependency.specifier || dependency.specifier.startsWith('http')) continue;
    if (isBinary(dependency) && !/^\b/.test(fromBinary(dependency))) continue;
    dependencies.add(dependency);
  }

  return Array.from(dependencies);
};

export const _getDependenciesFromScripts = timerify(getDependenciesFromScripts);
