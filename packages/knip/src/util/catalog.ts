import type { CatalogContainer } from '../CatalogCounselor.js';
import type { PackageJson } from '../types/package-json.js';
import { isFile } from './fs.js';
import { _load } from './loader.js';
import { basename, join } from './path.js';

export const DEFAULT_CATALOG = 'default';

export const getCatalogContainer = async (
  cwd: string,
  manifest: PackageJson,
  manifestPath: string,
  pnpmWorkspacePath?: string,
  pnpmWorkspace?: any
): Promise<CatalogContainer> => {
  const filePath = pnpmWorkspacePath ?? (isFile(join(cwd, '.yarnrc.yml')) ? join(cwd, '.yarnrc.yml') : manifestPath);

  const yarnWorkspace = basename(filePath) === '.yarnrc.yml' ? await _load(filePath) : undefined;

  const catalog =
    pnpmWorkspace?.catalog ??
    yarnWorkspace?.catalog ??
    manifest.catalog ??
    ((!Array.isArray(manifest.workspaces) && manifest.workspaces?.catalog) || {});

  const catalogs =
    pnpmWorkspace?.catalogs ??
    yarnWorkspace?.catalogs ??
    manifest.catalogs ??
    ((!Array.isArray(manifest.workspaces) && manifest.workspaces?.catalogs) || {});

  return { filePath, catalog, catalogs };
};

const extractEntries = (catalog: unknown): string[] => {
  if (catalog && typeof catalog === 'object') return Object.keys(catalog).map(entry => `${DEFAULT_CATALOG}:${entry}`);
  return [];
};

const extractNamedEntries = (catalogs: unknown) => {
  const entries = new Set<string>();
  if (catalogs && typeof catalogs === 'object') {
    for (const [catalogName, catalog] of Object.entries(catalogs)) {
      for (const name of Object.keys(catalog)) entries.add(`${catalogName}:${name}`);
    }
  }
  return entries;
};

export const parseCatalog = (container: CatalogContainer) => {
  const entries = new Set<string>();
  if ('catalog' in container) for (const id of extractEntries(container.catalog)) entries.add(id);
  if ('catalogs' in container) for (const id of extractNamedEntries(container.catalogs)) entries.add(id);
  return entries;
};

export const extractCatalogReferences = (manifest: PackageJson): Set<string> => {
  const catalogReferences = new Set<string>();

  const checkDependencies = (dependencies: Record<string, string> | undefined) => {
    if (!dependencies) return;

    for (const [name, version] of Object.entries(dependencies)) {
      if (typeof version === 'string' && version.startsWith('catalog:')) {
        const catalogName = version.slice('catalog:'.length) || DEFAULT_CATALOG;
        catalogReferences.add([catalogName, name].join(':'));
      }
    }
  };

  checkDependencies(manifest.dependencies);
  checkDependencies(manifest.devDependencies);
  checkDependencies(manifest.peerDependencies);
  checkDependencies(manifest.optionalDependencies);
  checkDependencies(manifest.resolutions);
  checkDependencies(manifest.pnpm?.overrides);

  return catalogReferences;
};
