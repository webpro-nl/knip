import type { Scripts } from '../types/package-json.js';
import { join } from '../util/path.js';
import { _require } from '../util/require.js';

type LoadPackageManifestOptions = { dir: string; packageName: string; cwd: string };

export const loadPackageManifest = ({ dir, packageName, cwd }: LoadPackageManifestOptions) => {
  // TODO Not sure what's the most efficient way to get a package.json, but this seems to do the job across package
  // managers (npm, Yarn, pnpm)
  try {
    return _require(join(dir, 'node_modules', packageName, 'package.json'));
  } catch (error) {
    if (dir !== cwd) {
      try {
        return _require(join(cwd, 'node_modules', packageName, 'package.json'));
      } catch (error) {
        // Explicitly suppressing errors here
      }
    }
    // Explicitly suppressing errors here
  }
};

type GetFilteredScriptsOptions = {
  isProduction: boolean;
  scripts?: Scripts;
};

export const getFilteredScripts = ({ isProduction, scripts }: GetFilteredScriptsOptions) => {
  if (!scripts) return {};
  if (!isProduction) return scripts;

  const scriptFilter = new Set(['start', 'postinstall']);
  const filteredScripts: Scripts = {};

  for (const scriptName in scripts) {
    if (scriptFilter.has(scriptName)) filteredScripts[scriptName] = scripts[scriptName];
  }

  return filteredScripts;
};
