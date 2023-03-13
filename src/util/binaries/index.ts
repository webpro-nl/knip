import { IGNORED_GLOBAL_BINARIES } from '../../constants.js';
import { compact } from '../array.js';
import { partition } from '../array.js';
import { getPackageNameFromModuleSpecifier, stripBinary } from '../modules.js';
import { isInternal } from '../path.js';
import { timerify } from '../performance.js';
import { getBinariesFromScript } from './bash-parser.js';
import type { GetReferencesFromScripts } from './types.js';

const defaultCwd = process.cwd();

const getReferencesFromScripts: GetReferencesFromScripts = (npmScripts, options = {}) => {
  const { cwd = defaultCwd, manifest = {}, ignore = [], knownGlobalsOnly = false } = options;
  const scripts = [npmScripts].flat();
  const results = scripts.flatMap(script => getBinariesFromScript(script, { cwd, manifest, knownGlobalsOnly }));

  const [entryFiles, binaries] = partition(compact(results), isInternal);

  return {
    entryFiles,
    binaries: binaries
      .map(stripBinary)
      .map(getPackageNameFromModuleSpecifier)
      .filter(binaryName => !IGNORED_GLOBAL_BINARIES.includes(binaryName) && !ignore.includes(binaryName)),
  };
};

export const _getReferencesFromScripts = timerify(getReferencesFromScripts);
