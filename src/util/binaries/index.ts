import { IGNORED_GLOBAL_BINARIES } from '../../constants.js';
import { compact } from '../array.js';
import { getPackageNameFromModuleSpecifier, stripBinary } from '../modules.js';
import { isAbsolute } from '../path.js';
import { timerify } from '../performance.js';
import { getBinariesFromScript } from './bash-parser.js';
import type { GetReferencesFromScripts } from './types.js';

const defaultCwd = process.cwd();

const partition = (values: string[]) =>
  values.reduce(
    (acc, value) => {
      acc[isAbsolute(value) ? 1 : 0].push(value);
      return acc;
    },
    [[], []] as [string[], string[]]
  );

const getReferencesFromScripts: GetReferencesFromScripts = (npmScripts, options = {}) => {
  const { cwd = defaultCwd, manifest = {}, ignore = [], knownGlobalsOnly = false } = options;
  const results = [npmScripts]
    .flat()
    .flatMap(script => getBinariesFromScript(script, { cwd, manifest, knownGlobalsOnly }));

  const [binaries, entryFiles] = partition(compact(results));

  return {
    entryFiles,
    binaries: binaries
      .map(stripBinary)
      .filter(binary => !binary.startsWith('.')) // TODO Find better solution
      .map(getPackageNameFromModuleSpecifier)
      .filter(binaryName => !IGNORED_GLOBAL_BINARIES.includes(binaryName) && !ignore.includes(binaryName)),
  };
};

export const _getReferencesFromScripts = timerify(getReferencesFromScripts);
