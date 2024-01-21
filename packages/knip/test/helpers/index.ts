import { platform } from 'node:os';
import { join } from '../../src/util/path.js';
import { _require } from '../../src/util/require.js';
import type { PackageJson } from '../../src/types/package-json.js';

export const getManifest = (cwd: string): PackageJson => _require(join(cwd, 'package.json'));

export const buildOptions = (cwd: string) => {
  const manifest = getManifest(cwd);
  return {
    cwd,
    isProduction: false,
    config: { config: null, entry: null, project: null },
    enabledPlugins: [],
    manifest,
    manifestScriptNames: new Set(Object.keys(manifest.scripts ?? {})),
    dependencies: new Set([
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {}),
    ]),
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updatePos = (obj: any) => {
  // Add line - 1 to every pos (each EOL is one more char)
  if (platform() === 'win32') {
    if (Array.isArray(obj)) {
      obj.forEach(item => updatePos(item));
    } else if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (key === 'pos' && 'line' in obj) obj[key] += obj['line'] - 1;
        else updatePos(obj[key]);
      }
    }
  }
  return obj;
};
