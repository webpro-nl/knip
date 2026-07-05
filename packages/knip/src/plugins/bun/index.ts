import type { IsPluginEnabled, Plugin, Resolve, ResolveConfig } from '../../types/config.ts';
import { isFile } from '../../util/fs.ts';
import { type Input, toDeferResolve, toEntry, toIgnore } from '../../util/input.ts';
import parseArgs from '../../util/parse-args.ts';
import { getScriptCommands } from '../../util/scripts.ts';
import type { BunfigConfig } from './types.ts';

// https://bun.sh/docs/cli/test

const title = 'Bun';

const enablers =
  'This plugin is enabled when a `bun.lock` or `bun.lockb` file is found or a `bun test` script is configured.';

const patterns = ['**/*.{test,spec}.{js,jsx,ts,tsx}', '**/*_{test,spec}.{js,jsx,ts,tsx}'];

const getBunTest = (script: string) => {
  for (const { binary, args } of getScriptCommands(script)) {
    if (binary !== 'bun') continue;
    const parsed = parseArgs(args, { string: ['timeout', 'rerun-each', 'preload'] });
    if (parsed._[0] === 'test') return parsed;
  }
};

const hasBunTest = (scripts: Record<string, string> | undefined) =>
  scripts && Object.values(scripts).some(script => typeof script === 'string' && getBunTest(script));

const isEnabled: IsPluginEnabled = ({ cwd, manifest }) =>
  isFile(cwd, 'bun.lock') || isFile(cwd, 'bun.lockb') || !!hasBunTest(manifest.scripts);

const config = ['bunfig.toml'];

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
  const inputs: Input[] = [toIgnore('bun', 'dependencies')];
  for (const script of Object.values(scripts)) {
    if (typeof script !== 'string') continue;
    const parsed = getBunTest(script);
    if (!parsed) continue;
    const targets = parsed._.slice(1);
    for (const pattern of targets.length === 0 ? patterns : targets.flatMap(toPatterns)) inputs.push(toEntry(pattern));
    for (const specifier of [parsed.preload ?? []].flat()) inputs.push(toDeferResolve(specifier));
  }
  return inputs;
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
