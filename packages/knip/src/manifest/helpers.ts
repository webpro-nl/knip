import { createRequire } from 'node:module';
import type { Scripts } from '../types/package-json.ts';
import { join } from '../util/path.ts';

type LoadPackageManifestOptions = { dir: string; packageName: string; cwd: string };

export const loadPackageManifest = ({ dir, packageName, cwd }: LoadPackageManifestOptions) => {
  // TODO Not sure what's the most efficient way to get a package.json, but this seems to do the job across package
  // managers (npm, Yarn, pnpm)
  try {
    return createRequire(join(dir, 'package.json'))(join(packageName, 'package.json'));
  } catch (_error) {
    if (dir !== cwd) {
      try {
        return createRequire(join(cwd, 'package.json'))(join(packageName, 'package.json'));
      } catch (_error) {
        // Explicitly suppressing errors here
      }
    }
    // Explicitly suppressing errors here
  }
};

export const getFilteredScripts = (scripts: Scripts) => {
  if (!scripts) return [{}, {}];

  const productionScripts: Scripts = {};
  const developmentScripts: Scripts = {};

  for (const scriptName in scripts) {
    if (!/^\w/.test(scriptName)) continue;
    if (scriptName === 'start') productionScripts[scriptName] = scripts[scriptName];
    else developmentScripts[scriptName] = scripts[scriptName];
  }

  return [productionScripts, developmentScripts];
};
