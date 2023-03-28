import { compact } from '../util/array.js';
import { getPackageNameFromModuleSpecifier, stripBinary } from '../util/modules.js';
import { isInternal } from '../util/path.js';
import { timerify } from '../util/Performance.js';
import { getBinariesFromScript } from './bash-parser.js';
import type { GetDependenciesFromScripts } from './types.js';

const defaultCwd = process.cwd();

const getDependenciesFromScripts: GetDependenciesFromScripts = (npmScripts, options = {}) => {
  const { cwd = defaultCwd, manifest = {}, knownGlobalsOnly = false } = options;
  const scripts = typeof npmScripts === 'string' ? [npmScripts] : [...npmScripts];
  const results = scripts.flatMap(script => getBinariesFromScript(script, { cwd, manifest, knownGlobalsOnly }));

  return compact(
    results.map(identifier => {
      if (isInternal(identifier)) return identifier;
      const packageName = getPackageNameFromModuleSpecifier(stripBinary(identifier));
      if (!packageName.startsWith('.')) return packageName;
    })
  );
};

export const _getDependenciesFromScripts = timerify(getDependenciesFromScripts);
