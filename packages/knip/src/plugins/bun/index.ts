import type { Plugin, ResolveEntryPaths } from '../../types/config.js';
import type { PackageJson } from '../../types/package-json.js';
import { toEntry } from '../../util/input.js';

const title = 'Bun';

const enablers = ['bun'];

const isEnabled = () => true;

const config = ['package.json'];

const packageJsonPath = (id: PackageJson) => id;

const resolveEntryPaths: ResolveEntryPaths<PackageJson> = localConfig => {
  const scripts = localConfig.scripts;

  if (scripts && Object.keys(scripts).some(script => /(?<=^|\s)bun test/.test(scripts[script]))) {
    const patterns = ['**/*.{test,spec}.{js,jsx,ts,tsx}', '**/*_{test,spec}.{js,jsx,ts,tsx}'];
    return patterns.map(id => toEntry(id));
  }

  return [];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  packageJsonPath,
  resolveEntryPaths,
} satisfies Plugin;
