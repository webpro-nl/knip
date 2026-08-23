import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toDeferResolve, toEntry } from '../../util/input.ts';
import type { ParsedArgs } from '../../util/parse-args.ts';
import { isDirectory } from '../../util/fs.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { MochaConfig } from './types.ts';

// https://mochajs.org/#configuring-mocha-nodejs

const title = 'Mocha';

const enablers = ['mocha'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.mocharc.{js,cjs,json,jsonc,yml,yaml}', 'package.json'];

const entry = ['**/test/*.{js,cjs,mjs}'];

const defaultExtensions = ['js', 'cjs', 'mjs'];

const resolveConfig: ResolveConfig<MochaConfig> = localConfig => {
  const entryPatterns = localConfig.spec ? [localConfig.spec].flat() : entry;
  const require = localConfig.require ? [localConfig.require].flat() : [];

  const inputs: Input[] = [];
  inputs.push(...entryPatterns.map(id => toEntry(id)));
  inputs.push(...require.map(id => toDeferResolve(id)));
  return inputs;
};

const args = {
  nodeImportArgs: true,
  boolean: [
    'allow-uncaught',
    'async-only',
    'bail',
    'check-leaks',
    'colors',
    'delay',
    'diff',
    'dry-run',
    'exit',
    'forbid-only',
    'forbid-pending',
    'inline-diffs',
    'invert',
    'parallel',
    'recursive',
    'sort',
    'watch',
  ],
  alias: {
    'async-only': ['A'],
    bail: ['b'],
    colors: ['c'],
    fgrep: ['f'],
    grep: ['g'],
    invert: ['i'],
    jobs: ['j'],
    'node-option': ['n'],
    parallel: ['p'],
    reporter: ['R'],
    'reporter-option': ['O'],
    slow: ['s'],
    sort: ['S'],
    timeout: ['t'],
    ui: ['u'],
    watch: ['w'],
  },
  string: ['config', 'extension', 'fgrep', 'file', 'grep', 'ignore', 'package', 'reporter', 'spec', 'ui'],
  config: ['config'],
  resolveInputs: (parsed: ParsedArgs, { cwd }: { cwd: string }) => {
    const extensions = [parsed.extension ?? []]
      .flat()
      .flatMap(value => String(value).split(','))
      .map(extension => extension.replace(/^\./, ''));
    const list = extensions.length > 0 ? extensions : defaultExtensions;
    const suffix = list.length === 1 ? `*.${list[0]}` : `*.{${list.join(',')}}`;
    const inputs: Input[] = [];
    for (const value of [...parsed._, ...[parsed.spec ?? []].flat(), ...[parsed.file ?? []].flat()].map(String)) {
      if (isDirectory(cwd, value))
        inputs.push(toEntry(`${value.replace(/\/$/, '')}/${parsed.recursive ? '**/' : ''}${suffix}`));
      else inputs.push(toEntry(value));
    }
    for (const value of [parsed.ignore ?? []].flat()) inputs.push(toEntry(`!${String(value)}`));
    return inputs;
  },
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
  args,
};

export default plugin;
