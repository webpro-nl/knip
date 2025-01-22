import type { Scripts } from '../types/package-json.js';
import { join, dirname } from '../util/path.js';
import { _require } from '../util/require.js';
import { isFile } from '../util/fs.js';

let isPnPEnabled: boolean | 'NOT_DETERMINED_YET' = 'NOT_DETERMINED_YET';

type LoadPackageManifestOptions = { dir: string; packageName: string; cwd: string };

const findNearestPnPFile = (startDir: string): string | null => {
  // Find the nearest .pnp.cjs file by traversing up
  let currentDir = startDir;
  while (currentDir !== '/') {
    const pnpPath = join(currentDir, '.pnp.cjs');
    if (isFile(pnpPath)) {
      return pnpPath;
    }
    // Move up one directory
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      break; // Reached root
    }
    currentDir = parentDir;
  }
  return null;
};

const tryLoadManifestWithYarnPnp = (cwd: string, packageName: string) => {
  if (isPnPEnabled === false) {
    return null;
  }
  
  try {
    if (isPnPEnabled === 'NOT_DETERMINED_YET') {
      const pnpPath = findNearestPnPFile(cwd);
      
      if (pnpPath != null) {
        const pnp = _require(pnpPath);
        pnp.setup()
        isPnPEnabled = true;
      } else {
        isPnPEnabled = false;
      }
    }
    
    if (isPnPEnabled) {
      const pnpApi = _require('pnpapi')

      if (pnpApi != null) {
        const resolvedPath = pnpApi.resolveRequest(packageName, cwd);
        
        if (resolvedPath) {
          const packageLocation = pnpApi.findPackageLocator(resolvedPath)
          const packageInformation = pnpApi.getPackageInformation(packageLocation)
          const packageJsonPath = join(packageInformation.packageLocation, 'package.json');
          
          // We need to require fs dynamically here because pnp patches it.
          const _readFileSync = _require('fs').readFileSync
          const manifest = JSON.parse(_readFileSync(packageJsonPath, 'utf8'))
          
          return manifest
        }
      }
    }
  } catch (_error) {
    // Explicitly suppressing errors here
  }

  return null;
};

export const loadPackageManifest = ({ dir, packageName, cwd }: LoadPackageManifestOptions) => {
  // 1. Try Yarn PnP first
  const pnpManifest = tryLoadManifestWithYarnPnp(cwd, packageName);
  if (pnpManifest != null) {
    return pnpManifest;
  };
  
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
}

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
