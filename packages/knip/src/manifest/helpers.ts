import type { Scripts } from '../types/package-json.js';
import { isFile } from '../util/fs.js';
import { dirname, join } from '../util/path.js';
import { _require } from '../util/require.js';

const pnpStatus = {
  dir: '',
  pnpPath: '',
  enabled: false,
};

type LoadPackageManifestOptions = { dir: string; packageName: string; cwd: string };

const findNearestPnPFile = (startDir: string) => {
  // Find the nearest .pnp.cjs file by traversing up
  let currentDir = startDir;
  while (currentDir !== '/') {
    const pnpPath = join(currentDir, '.pnp.cjs');
    if (isFile(pnpPath)) {
      const pnpApi = _require(pnpPath);
      pnpApi.setup();
      pnpStatus.dir = startDir;
      pnpStatus.pnpPath = pnpPath;
      pnpStatus.enabled = true;
      return;
    }
    // Move up one directory
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      break; // Reached root
    }
    currentDir = parentDir;
  }
  pnpStatus.dir = startDir;
  pnpStatus.pnpPath = '';
  pnpStatus.enabled = false;
};

const tryLoadManifestWithYarnPnp = (dir: string, packageName: string) => {
  if (pnpStatus.dir === dir && pnpStatus.enabled === false) {
    return null;
  }

  try {
    if (pnpStatus.dir !== dir) {
      findNearestPnPFile(dir);
    }

    if (pnpStatus.enabled) {
      const pnpApi = _require(pnpStatus.pnpPath);

      if (pnpApi != null) {
        const resolvedPath = pnpApi.resolveRequest(packageName, dir);

        if (resolvedPath) {
          const packageLocation = pnpApi.findPackageLocator(resolvedPath);
          const packageInformation = pnpApi.getPackageInformation(packageLocation);
          const packageJsonPath = join(packageInformation.packageLocation, 'package.json');

          // We need to require fs dynamically here because pnp patches it.
          const _readFileSync = _require('fs').readFileSync;
          const manifest = JSON.parse(_readFileSync(packageJsonPath, 'utf8'));

          return manifest;
        }
      }
    }
  } catch (_error) {
    console.error(_error);
    // Explicitly suppressing errors here
  }

  return null;
};

export const loadPackageManifest = ({ dir, packageName, cwd }: LoadPackageManifestOptions) => {
  // 1. Try Yarn PnP first
  const manifest = tryLoadManifestWithYarnPnp(dir, packageName);

  if (manifest != null) {
    return manifest;
  }

  // 2. Fallback to traditional node_modules resolution
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
