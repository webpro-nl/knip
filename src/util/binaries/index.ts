import { IGNORED_GLOBAL_BINARIES } from '../../constants.js';
import { compact } from '../array.js';
import { getPackageNameFromModuleSpecifier, stripBinary } from '../modules.js';
import { timerify } from '../performance.js';
import { getBinariesFromScript } from './bash-parser.js';
import type { PackageJson } from 'type-fest';

type Options = { manifest?: PackageJson; ignore?: string[]; knownGlobalsOnly?: boolean };

type GetBinariesFromScripts = (npmScripts: string | string[], options?: Options) => string[];

export const getBinariesFromScripts: GetBinariesFromScripts = (npmScripts, options = {}) => {
  const { manifest = {}, ignore = [], knownGlobalsOnly = false } = options;
  return compact([npmScripts].flat().flatMap(script => getBinariesFromScript(script, { manifest, knownGlobalsOnly })))
    .map(stripBinary)
    .map(getPackageNameFromModuleSpecifier)
    .filter(binary => !binary.startsWith('.'))
    .filter(binaryName => !IGNORED_GLOBAL_BINARIES.includes(binaryName) && !ignore.includes(binaryName));
};

export const _getBinariesFromScripts = timerify(getBinariesFromScripts);
