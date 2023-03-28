import { compact } from '../util/array.js';
import { partition } from '../util/array.js';
import { getPackageNameFromModuleSpecifier, stripBinary } from '../util/modules.js';
import { isInternal } from '../util/path.js';
import { timerify } from '../util/Performance.js';
import { getBinariesFromScript } from './bash-parser.js';
import type { GetReferencesFromScripts } from './types.js';

const defaultCwd = process.cwd();

const getReferencesFromScripts: GetReferencesFromScripts = (npmScripts, options = {}) => {
  const { cwd = defaultCwd, manifest = {}, knownGlobalsOnly = false } = options;
  const scripts = typeof npmScripts === 'string' ? [npmScripts] : [...npmScripts];
  const results = scripts.flatMap(script => getBinariesFromScript(script, { cwd, manifest, knownGlobalsOnly }));

  const [entryFiles, binaries] = partition(compact(results), isInternal);

  return {
    entryFiles,
    binaries: binaries
      .map(stripBinary)
      .map(getPackageNameFromModuleSpecifier)
      .filter(binaryName => !binaryName.startsWith('.')), // Filter out odd/invalid noise here (e.g. `../node_modules`)
  };
};

export const _getReferencesFromScripts = timerify(getReferencesFromScripts);
