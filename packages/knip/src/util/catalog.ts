import type { CatalogContainer } from '../CatalogCounselor.ts';
import type { PackageJson } from '../types/package-json.ts';
import { isFile } from './fs.ts';
import { _load } from './loader.ts';
import { getPackageNameFromModuleSpecifier } from './modules.ts';
import { basename, join } from './path.ts';

export const DEFAULT_CATALOG = 'default';

export type CatalogReference = {
  catalogName: string;
  packageName: string;
  selector?: string;
};

export type OverrideCatalogReference = CatalogReference & { selector: string };

const CATALOG_PROTOCOL = '@catalog:';

export const getCatalogReference = (specifier: string): CatalogReference | undefined => {
  const protocolIndex = specifier.lastIndexOf(CATALOG_PROTOCOL);
  if (protocolIndex <= 0) return;

  const packageName = specifier.slice(0, protocolIndex);
  if (getPackageNameFromModuleSpecifier(packageName) !== packageName) return;

  return {
    catalogName: specifier.slice(protocolIndex + CATALOG_PROTOCOL.length) || DEFAULT_CATALOG,
    packageName,
  };
};

export const getCatalogContainer = async (
  cwd: string,
  manifest: PackageJson,
  manifestPath: string,
  pnpmWorkspacePath?: string,
  pnpmWorkspace?: any
): Promise<CatalogContainer> => {
  const filePath = pnpmWorkspacePath ?? (isFile(cwd, '.yarnrc.yml') ? join(cwd, '.yarnrc.yml') : manifestPath);

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

  return { filePath, catalog, catalogs, overrides: pnpmWorkspace?.overrides };
};

const extractEntries = (catalog: unknown): string[] => {
  if (catalog && typeof catalog === 'object') return Object.keys(catalog).map(entry => `${DEFAULT_CATALOG}:${entry}`);
  return [];
};

const extractNamedEntries = (catalogs: unknown) => {
  const entries = new Set<string>();
  if (catalogs && typeof catalogs === 'object') {
    for (const [catalogName, catalog] of Object.entries(catalogs)) {
      if (catalog && typeof catalog === 'object') {
        for (const name of Object.keys(catalog)) entries.add(`${catalogName}:${name}`);
      }
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

const OVERRIDE_DELIMITER = /[^ |@]>/;

const toCatalogReference = (packageName: string, version: unknown): CatalogReference | undefined => {
  if (typeof version !== 'string' || !version.startsWith('catalog:')) return;
  return { catalogName: version.slice('catalog:'.length) || DEFAULT_CATALOG, packageName };
};

const collectCatalogReferences = (
  dependencies: Record<string, string> | undefined,
  catalogReferences: CatalogReference[]
) => {
  if (!dependencies) return;

  for (const [packageName, version] of Object.entries(dependencies)) {
    const reference = toCatalogReference(packageName, version);
    if (reference) catalogReferences.push(reference);
  }
};

export const getOverrideCatalogReferences = (overrides: Record<string, string> | undefined) => {
  const catalogReferences: OverrideCatalogReference[] = [];
  if (!overrides) return catalogReferences;

  for (const [selector, version] of Object.entries(overrides)) {
    const delimiterIndex = selector.search(OVERRIDE_DELIMITER);
    const target = delimiterIndex === -1 ? selector : selector.slice(delimiterIndex + 2);
    const packageName = getPackageNameFromModuleSpecifier(target);
    if (!packageName) continue;
    const reference = toCatalogReference(packageName, version);
    if (reference) catalogReferences.push({ ...reference, selector });
  }
  return catalogReferences;
};

export const extractCatalogReferences = (manifest: PackageJson): CatalogReference[] => {
  const catalogReferences: CatalogReference[] = [];

  collectCatalogReferences(manifest.dependencies, catalogReferences);
  collectCatalogReferences(manifest.devDependencies, catalogReferences);
  collectCatalogReferences(manifest.peerDependencies, catalogReferences);
  collectCatalogReferences(manifest.optionalDependencies, catalogReferences);
  collectCatalogReferences(manifest.resolutions, catalogReferences);

  return catalogReferences;
};
