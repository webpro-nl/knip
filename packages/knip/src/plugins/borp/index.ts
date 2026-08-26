import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import type { Input } from '../../util/input.ts';
import { toDeferResolve, toEntry } from '../../util/input.ts';
import type { ParsedArgs } from '../../util/parse-args.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { BorpConfig } from './types.ts';

// https://github.com/mcollina/borp

const title = 'Borp';

const enablers = ['borp'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['.borp.yaml', '.borp.yml'];

const entry = ['**/*.test.{js,mjs,cjs,ts,mts,cts}'];

const builtinReporters = new Set(['spec', 'tap', 'dot', 'junit', 'lcov', 'gh']);

const toReporterInput = (reporter: string) => {
  const separatorIndex = reporter.indexOf(':');
  const name = separatorIndex === -1 ? reporter : reporter.slice(0, separatorIndex);
  if (builtinReporters.has(name)) return;
  return toDeferResolve(name);
};

const resolveConfig: ResolveConfig<BorpConfig> = async localConfig => {
  const inputs: Input[] = [];
  for (const reporter of localConfig.reporters ?? []) {
    const input = toReporterInput(reporter);
    if (input) inputs.push(input);
  }
  for (const id of localConfig.files ?? entry) inputs.push(toEntry(id));
  return inputs;
};

const args = {
  boolean: ['coverage', 'watch', 'only', 'no-timeout', 'expose-gc', 'check-coverage', 'coverage-html'],
  alias: {
    coverage: ['C'],
    watch: ['w'],
    only: ['o'],
    reporter: ['r'],
    pattern: ['p'],
    ignore: ['i'],
    timeout: ['t'],
    concurrency: ['c'],
    'coverage-exclude': ['X'],
  },
  resolveInputs: (parsed: ParsedArgs) => {
    const inputs: Input[] = [];
    for (const reporter of [parsed.reporter ?? []].flat()) {
      const input = toReporterInput(String(reporter));
      if (input) inputs.push(input);
    }
    for (const id of [...parsed._, parsed.pattern ?? []].flat()) inputs.push(toEntry(String(id)));
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
