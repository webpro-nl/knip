import type { Args } from '../../types/args.ts';
import type { IsLoadConfig, IsPluginEnabled, Plugin, ResolveConfig, ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import { toEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { TsupConfig } from './types.ts';

// https://paka.dev/npm/tsup/api
// https://github.com/egoist/tsup/blob/dev/src/load.ts
// https://github.com/egoist/tsup/blob/198479b814f5981032dc0b7cd52c4b9e4b699ac3/src/cli-main.ts

const title = 'tsup';

const enablers = ['tsup'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['tsup.config.{js,ts,cjs,mjs,cts,mts,json}', 'package.json'];

const isLoadConfig: IsLoadConfig = ({ configFileName }) =>
  configFileName === 'package.json' || configFileName.endsWith('.json');

const resolveConfig: ResolveConfig<TsupConfig> = async config => {
  if (typeof config === 'function') config = await config({});

  const entryPatterns = [config]
    .flat()
    .flatMap(config => {
      if (!config.entry) return [];
      if (Array.isArray(config.entry)) return config.entry;
      return Object.values(config.entry);
    })
    .map(id => toEntry(id, { production: true, allowIncludeExports: true }));

  return entryPatterns;
};

const resolveFromAST: ResolveFromAST = program =>
  Array.from(collectPropertyValues(program, 'entry'), id =>
    toEntry(id, { production: true, allowIncludeExports: true })
  );

const args: Args = {
  config: true,
  args: args => args.filter((arg, index) => args[index - 1] !== '--watch' || arg.startsWith('-')),
  boolean: [
    'cjsInterop',
    'clean',
    'dts-only',
    'dts-resolve',
    'inject-style',
    'keep-names',
    'legacy-output',
    'metafile',
    'minify-identifiers',
    'minify-syntax',
    'minify-whitespace',
    'replaceNodeEnv',
    'shims',
    'silent',
  ],
  resolveInputs: parsed => parsed._.map(id => toEntry(id, { production: true, allowIncludeExports: true })),
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  isLoadConfig,
  resolveConfig,
  resolveFromAST,
  args,
};

export default plugin;
