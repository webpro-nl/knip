import type { ManifestCatalog } from '../ConfigurationChief.js';
import type { PackageJson } from '../types/package-json.js';

export const DEFAULT_CATALOG = 'default';

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

export const parseCatalog = (manifest: ManifestCatalog) => {
  const entries = new Set<string>();
  if ('catalog' in manifest) for (const id of extractEntries(manifest.catalog)) entries.add(id);
  if ('catalogs' in manifest) for (const id of extractNamedEntries(manifest.catalogs)) entries.add(id);
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

  return catalogReferences;
};
