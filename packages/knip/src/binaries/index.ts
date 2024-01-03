import { IGNORED_FILE_EXTENSIONS } from '../constants.js';
import { compact } from '../util/array.js';
import { getPackageNameFromModuleSpecifier } from '../util/modules.js';
import { extname, isInternal } from '../util/path.js';
import { timerify } from '../util/Performance.js';
import { fromBinary, isBinary } from '../util/protocols.js';
import { getBinariesFromScript } from './bash-parser.js';
import type { GetDependenciesFromScripts } from './types.js';

const defaultCwd = process.cwd();

const getDependenciesFromScripts: GetDependenciesFromScripts = (npmScripts, options = {}) => {
  const { cwd = defaultCwd, manifest = {}, knownGlobalsOnly = false } = options;
  const scripts = typeof npmScripts === 'string' ? [npmScripts] : [...npmScripts];
  const results = scripts.flatMap(script => getBinariesFromScript(script, { cwd, manifest, knownGlobalsOnly }));

  return compact(
    results.map(identifier => {
      if (identifier.startsWith('http')) return;
      if (isBinary(identifier)) {
        if (!/^\b/.test(fromBinary(identifier))) return;
        return identifier;
      }
      if (isInternal(identifier)) {
        const ext = extname(identifier);
        if (ext && IGNORED_FILE_EXTENSIONS.has(ext)) return;
        return identifier;
      }
      return getPackageNameFromModuleSpecifier(identifier);
    })
  );
};

export const _getDependenciesFromScripts = timerify(getDependenciesFromScripts);
