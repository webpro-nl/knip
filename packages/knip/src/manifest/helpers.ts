import { existsSync, readFileSync } from 'node:fs';
import type { Scripts } from '../types/package-json.ts';
import { dirname, join } from '../util/path.ts';
import { _require } from '../util/require.ts';

type LoadPackageManifestOptions = { dir: string; packageName: string; cwd: string };

const monorepoRootCache = new Map<string, string | undefined>();

const findMonorepoRootAbove = (startDir: string): string | undefined => {
  if (monorepoRootCache.has(startDir)) return monorepoRootCache.get(startDir);
  let current = dirname(startDir);
  let result: string | undefined;
  while (current !== dirname(current)) {
    if (existsSync(join(current, 'pnpm-workspace.yaml'))) {
      result = current;
      break;
    }
    try {
      const pkg = JSON.parse(readFileSync(join(current, 'package.json'), 'utf8'));
      if (pkg.workspaces) {
        result = current;
        break;
      }
    } catch {}
    current = dirname(current);
  }
  monorepoRootCache.set(startDir, result);
  return result;
};

export const loadPackageManifest = ({ dir, packageName, cwd }: LoadPackageManifestOptions) => {
  try {
    return _require(join(dir, 'node_modules', packageName, 'package.json'));
  } catch {}
  if (dir !== cwd) {
    try {
      return _require(join(cwd, 'node_modules', packageName, 'package.json'));
    } catch {}
    return;
  }
  const root = findMonorepoRootAbove(cwd);
  if (root) {
    try {
      return _require(join(root, 'node_modules', packageName, 'package.json'));
    } catch {}
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
