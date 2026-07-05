import parseArgs from 'minimist';
import type { IsPluginEnabled, Plugin, Resolve, ResolveConfig } from '../../types/config.ts';
import { isFile } from '../../util/fs.ts';
import { toDeferResolve, toEntry, toIgnore } from '../../util/input.ts';
import type { BunfigConfig } from './types.ts';

// https://bun.sh/docs/cli/test

const title = 'Bun';

const enablers =
  'This plugin is enabled when a `bun.lock` or `bun.lockb` file is found or a `bun test` script is configured.';

const getBunTestArgs = (script: string) => {
  const args = script.split(/\s+/);
  const bunIndex = args.indexOf('bun');
  const testIndex = bunIndex === -1 ? -1 : args.indexOf('test', bunIndex + 1);
  if (args.slice(bunIndex + 1, testIndex).includes('run')) return;
  return testIndex === -1 ? undefined : args.slice(testIndex + 1);
};

const hasBunTest = (scripts: Record<string, string> | undefined) =>
  scripts && Object.values(scripts).some(script => typeof script === 'string' && getBunTestArgs(script));

const isEnabled: IsPluginEnabled = ({ cwd, manifest }) =>
  isFile(cwd, 'bun.lock') || isFile(cwd, 'bun.lockb') || !!hasBunTest(manifest.scripts);

const config = ['bunfig.toml'];

const patterns = ['**/*.{test,spec}.{js,jsx,ts,tsx}', '**/*_{test,spec}.{js,jsx,ts,tsx}'];

const resolveConfig: ResolveConfig<BunfigConfig> = localConfig => {
  const preload = localConfig.test?.preload ?? [];
  return preload.map(specifier => toDeferResolve(specifier));
};

const toPatterns = (arg: string) => {
  if (/[*{?]/.test(arg)) return [arg];
  if (/\.\w+$/.test(arg)) return [arg];
  const dir = arg.replace(/\/+$/, '');
  return patterns.map(pattern => `${dir}/${pattern}`);
};

const resolve: Resolve = options => {
  const scripts = { ...options.rootManifest?.scripts, ...options.manifest.scripts };
  for (const script of Object.values(scripts)) {
    const bunTestArgs = getBunTestArgs(script);
    if (bunTestArgs) {
      const parsed = parseArgs(bunTestArgs, { string: ['timeout', 'rerun-each', 'preload'] });
      const args = parsed._;
      const inputs = [
        toIgnore('bun', 'dependencies'),
        ...(args.length === 0 ? patterns : args.flatMap(toPatterns)).map(toEntry),
      ];
      for (const specifier of [parsed.preload ?? []].flat()) inputs.push(toDeferResolve(specifier));
      return inputs;
    }
  }
  return [toIgnore('bun', 'dependencies'), ...patterns.map(toEntry)];
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
