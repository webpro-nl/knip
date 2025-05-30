import parseArgs from 'minimist';
import type { Plugin, ResolveConfig } from '../../types/config.js';
import type { PackageJson } from '../../types/package-json.js';
import { toEntry } from '../../util/input.js';

// https://bun.sh/docs/cli/test

const title = 'Bun';

const enablers = ['bun'];

const isEnabled = () => true;

const config = ['package.json'];

const packageJsonPath = (id: PackageJson) => id;

const resolveConfig: ResolveConfig<PackageJson> = localConfig => {
  const scripts = localConfig.scripts;

  if (scripts) {
    const testScripts = Object.keys(scripts).filter(script => /(?<=^|\s)bun test/.test(scripts[script]));
    for (const script of testScripts) {
      const parsed = parseArgs(scripts[script].split(' '));
      if (parsed._.filter(id => id !== 'bun' && id !== 'test').length === 0) {
        return ['**/*.{test,spec}.{js,jsx,ts,tsx}', '**/*_{test,spec}.{js,jsx,ts,tsx}'].map(toEntry);
      }
    }
  }

  return [];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  packageJsonPath,
  resolveConfig,
} satisfies Plugin;
