import type { PackageJson, Scripts } from '../types/package-json.ts';
import { resolvePackageManifestPath } from '../util/resolve.ts';
import { _require } from '../util/require.ts';

type LoadPackageManifestOptions = { dir: string; packageName: string; cwd: string };

export const loadPackageManifest = ({ dir, packageName }: LoadPackageManifestOptions): PackageJson | undefined => {
  const manifestPath = resolvePackageManifestPath(packageName, dir);
  if (!manifestPath) return;
  try {
    return _require(manifestPath);
  } catch {}
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
