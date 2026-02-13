import parseArgs from 'minimist';
import type { IsPluginEnabled, Plugin, ResolveConfig, Resolve } from '../../types/config.js';
import { toDeferResolve, toEntry } from '../../util/input.js';
import type { BunfigConfig } from './types.js';

// https://bun.sh/docs/cli/test

const title = 'Bun';

const enablers = ['bun'];

const hasBunTest = (scripts: Record<string, string> | undefined) =>
  scripts && Object.values(scripts).some(script => /(?<=^|\s)bun test/.test(script));

const isEnabled: IsPluginEnabled = ({ manifest }) => !!hasBunTest(manifest.scripts);

const config = ['bunfig.toml'];

const patterns = ['**/*.{test,spec}.{js,jsx,ts,tsx}', '**/*_{test,spec}.{js,jsx,ts,tsx}'];

const resolveConfig: ResolveConfig<BunfigConfig> = localConfig => {
  const preload = localConfig.test?.preload ?? [];
  return preload.map(specifier => toDeferResolve(specifier));
};

const resolve: Resolve = options => {
  const scripts = { ...options.rootManifest?.scripts, ...options.manifest.scripts };
  for (const script of Object.values(scripts)) {
    if (/(?<=^|\s)bun test/.test(script)) {
      const parsed = parseArgs(script.split(' '), { string: ['timeout', 'rerun-each', 'preload'] });
      const args = parsed._.filter(id => id !== 'bun' && id !== 'test');
      const inputs = (args.length === 0 ? patterns : args).map(toEntry);
      for (const specifier of [parsed.preload ?? []].flat()) inputs.push(toDeferResolve(specifier));
      return inputs;
    }
  }
  return [];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolve,
  resolveConfig,
};

export default plugin;
