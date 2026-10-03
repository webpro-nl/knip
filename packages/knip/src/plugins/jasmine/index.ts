import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { type Input, toDeferResolve, toEntry } from '../../util/input.ts';
import type { ParsedArgs } from '../../util/parse-args.ts';
import { isAbsolute, join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { JasmineConfig } from './types.ts';

// https://jasmine.github.io/setup/nodejs.html

const title = 'Jasmine';

const enablers = ['jasmine'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['spec/support/jasmine.{json,jsonc,js,cjs,mjs}'];

const defaultSpecFiles = 'spec/**/*[sS]pec.{js,mjs}';

const entry = [defaultSpecFiles, 'spec/helpers/**/*.{js,mjs}'];

const toSpecDirPattern = (specDir: string, pattern: string) => {
  const isNegated = pattern.startsWith('!');
  const id = isNegated ? pattern.slice(1) : pattern;
  const resolved = isAbsolute(id) ? id : join(specDir, id);
  return isNegated ? `!${resolved}` : resolved;
};

const resolveConfig: ResolveConfig<JasmineConfig> = (localConfig, options) => {
  const specDir = localConfig.spec_dir ?? '';
  const specFiles = localConfig.spec_files?.map(pattern => toSpecDirPattern(specDir, pattern)) ?? [defaultSpecFiles];
  const helpers = localConfig.helpers?.map(pattern => toSpecDirPattern(specDir, pattern)) ?? [];
  const requires = localConfig.requires ?? [];

  const inputs: Input[] = [];
  for (const id of [...specFiles, ...helpers]) inputs.push(toEntry(id));
  // `requires` and `loader` are resolved from the working directory, not from the config file, and may be a package name
  for (const id of requires) inputs.push(toDeferResolve(id, { dir: options.cwd }));
  if (localConfig.loader) inputs.push(toDeferResolve(localConfig.loader, { dir: options.cwd }));
  return inputs;
};

const commands = new Set(['init', 'examples', 'help', 'version']);

const args = {
  boolean: ['color', 'fail-fast', 'list-not-applicable', 'no-color'],
  string: ['config', 'reporter', 'require'],
  config: ['config'],
  resolve: ['require', 'reporter'],
  resolveInputs: (parsed: ParsedArgs) => {
    const inputs: Input[] = [];
    for (const value of parsed._) {
      if (commands.has(value) || /^\w+=/.test(value)) continue;
      inputs.push(toEntry(value));
    }
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
