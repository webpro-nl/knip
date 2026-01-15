import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { arrayify } from '../../util/array.js';
import { type Input, toDeferResolve, toEntry } from '../../util/input.js';
import { join, relative } from '../../util/path.js';
import { hasDependency } from '../../util/plugin.js';
import type { PlaywrightTestConfig } from './types.js';

// https://playwright.dev/docs/test-configuration

const title = 'Playwright';

const enablers = ['@playwright/test'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['playwright.config.{js,ts,mjs}'];

export const entry = ['**/*.@(spec|test).?(c|m)[jt]s?(x)'];

const toEntryPatterns = (
  testMatch: string | RegExp | Array<string | RegExp>,
  cwd: string,
  configDir: string,
  localConfig: PlaywrightTestConfig,
  rootConfig: PlaywrightTestConfig
) => {
  const testDir = localConfig.testDir ?? rootConfig.testDir;
  const dir = relative(cwd, testDir ? join(configDir, testDir) : configDir);
  const patterns = [testMatch].flat().filter((p): p is string => typeof p === 'string');
  return patterns.map(pattern => toEntry(join(dir, pattern)));
};

const builtinReporters = ['dot', 'line', 'list', 'junit', 'html', 'blob', 'json', 'github'];

export const resolveConfig: ResolveConfig<PlaywrightTestConfig> = async (localConfig, options) => {
  const { cwd, configFileDir } = options;

  const inputs: Input[] = [];
  for (const id of arrayify(localConfig.globalSetup)) inputs.push(toEntry(id));
  for (const id of arrayify(localConfig.globalTeardown)) inputs.push(toEntry(id));

  const projects = localConfig.projects ? [localConfig, ...localConfig.projects] : [localConfig];

  const reporters = [localConfig.reporter].flat().flatMap(reporter => {
    const name = typeof reporter === 'string' ? reporter : reporter?.[0];
    if (!name || builtinReporters.includes(name)) return [];
    return [name];
  });

  return projects
    .flatMap(config => toEntryPatterns(config.testMatch ?? entry, cwd, configFileDir, config, localConfig))
    .concat(reporters.map(id => toDeferResolve(id)))
    .concat(inputs);
};

const args = {
  positional: true,
  args: (args: string[]) => args.filter(arg => arg !== 'install' && arg !== 'test'),
  config: true,
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
