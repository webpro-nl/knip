import { type Input, toEntryPath, toModule } from '../../util/input.ts';
import { isObject } from '../../util/validation.ts';

type EntriesByOption = Map<string, string[]>;

interface BuilderTarget {
  options?: unknown;
  configurations?: unknown;
}

const PRODUCTION_CONFIG_NAME = 'production';
const BUILD_TARGET_NAME = 'build';

const isPath = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

const getBundleInput = (value: unknown) => (isObject(value) ? value.input : value);

const getReplacementPath = (value: unknown) => (isObject(value) ? (value.with ?? value.replaceWith) : undefined);

const toPaths = (value: unknown, getPath: (item: unknown) => unknown = item => item): string[] => {
  const paths: string[] = [];
  for (const item of Array.isArray(value) ? value : [value]) {
    const path = getPath(item);
    if (isPath(path)) paths.push(path);
  }
  return paths;
};

const entriesByOption = (opts: Record<string, unknown>): EntriesByOption =>
  new Map([
    ['main', toPaths(opts.main)],
    ['scripts', toPaths(opts.scripts, getBundleInput)],
    ['styles', toPaths(opts.styles, getBundleInput)],
    ['polyfills', toPaths(opts.polyfills)],
    ['fileReplacements', toPaths(opts.fileReplacements, getReplacementPath)],
    ['browser', toPaths(opts.browser)],
    ['server', toPaths(opts.server)],
    ['ssrEntry', toPaths(isObject(opts.ssr) ? opts.ssr.entry : undefined)],
  ]);

export const getBuilderEntries = (
  targetName: string,
  target: BuilderTarget,
  dir: string,
  toSpecifier: (specifier: string) => string = specifier => specifier
): Input[] => {
  const { options: opts, configurations: configs } = target;
  const defaultEntriesByOption: EntriesByOption = isObject(opts) ? entriesByOption(opts) : new Map();
  const entriesByOptionByConfig: Map<string, EntriesByOption> = new Map();
  if (isObject(configs)) {
    for (const [configName, configOpts] of Object.entries(configs)) {
      if (isObject(configOpts)) entriesByOptionByConfig.set(configName, entriesByOption(configOpts));
    }
  }
  const productionEntriesByOption: EntriesByOption = entriesByOptionByConfig.get(PRODUCTION_CONFIG_NAME) ?? new Map();
  const isBuildTarget = targetName === BUILD_TARGET_NAME;
  const toInput = (option: string, entry: string, isProduction: boolean): Input => {
    const specifier = toSpecifier(entry);
    const opts = { dir, production: isProduction };
    return option === 'polyfills' ? toModule(specifier, opts) : toEntryPath(specifier, opts);
  };
  const inputs: Input[] = [];
  for (const [configName, entriesByOption] of entriesByOptionByConfig) {
    for (const [option, entries] of entriesByOption) {
      for (const entry of entries) {
        inputs.push(toInput(option, entry, isBuildTarget && configName === PRODUCTION_CONFIG_NAME));
      }
    }
  }
  for (const [option, entries] of defaultEntriesByOption) {
    for (const entry of entries) {
      inputs.push(toInput(option, entry, isBuildTarget && !productionEntriesByOption.get(option)?.length));
    }
  }
  return inputs;
};
