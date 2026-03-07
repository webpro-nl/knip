import { createRequire } from 'node:module';
import type { Scripts } from '../types/package-json.ts';
import { join } from '../util/path.ts';

type LoadPackageManifestOptions = { dir: string; packageName: string; cwd: string };

export const loadPackageManifest = ({ dir, packageName, cwd }: LoadPackageManifestOptions) => {
  try {
    const _require = createRequire(join(dir, 'package.json'));
    const manifestPath = _require.resolve(join(packageName, 'package.json'));
    if (manifestPath.startsWith(cwd)) return _require(manifestPath);
  } catch (_error) {
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
