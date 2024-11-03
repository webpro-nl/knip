import type { Scripts } from '../types/package-json.js';
import { join } from '../util/path.js';
import { _require } from '../util/require.js';

type LoadPackageManifestOptions = { dir: string; packageName: string; cwd: string };

export const loadPackageManifest = ({ dir, packageName, cwd }: LoadPackageManifestOptions) => {
  // TODO Not sure what's the most efficient way to get a package.json, but this seems to do the job across package
  // managers (npm, Yarn, pnpm)
  try {
    return _require(join(dir, 'node_modules', packageName, 'package.json'));
  } catch (_error) {
    if (dir !== cwd) {
      try {
        return _require(join(cwd, 'node_modules', packageName, 'package.json'));
      } catch (_error) {
        // Explicitly suppressing errors here
      }
    }
    // Explicitly suppressing errors here
  }
};

export const getFilteredScripts = (scripts: Scripts) => {
  if (!scripts) return [{}, {}];

  const scriptFilter = new Set(['start', 'postinstall']);
  const productionScripts: Scripts = {};
  const developmentScripts: Scripts = {};

  for (const scriptName in scripts) {
    if (scriptFilter.has(scriptName)) productionScripts[scriptName] = scripts[scriptName];
    else developmentScripts[scriptName] = scripts[scriptName];
  }

  return [productionScripts, developmentScripts];
};
