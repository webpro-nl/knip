import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { RstestConfig } from './types.js';

// https://rstest.rs/

const title = 'Rstest';

const enablers = ['@rstest/core'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

// https://rstest.rs/guide/basic/configure-rstest#configuration-file
const config: string[] = ['rstest.config.{js,cjs,mjs,ts,cts,mts}'];

// https://rstest.rs/api/rstest/mockModules#rsmock
const mocks = ['**/__mocks__/**/*.?(c|m)[jt]s?(x)'];

// https://rstest.rs/config/test/include
const entry = ['**/*.{test,spec}.?(c|m)[jt]s?(x)', ...mocks];

const resolveConfig: ResolveConfig<RstestConfig> = async config => {
  const environments = config.testEnvironment === 'node' ? [] : [config.testEnvironment];

  return [...environments].map(id => (typeof id === 'string' ? toDeferResolve(id) : id));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  entry,
  resolveConfig,
} satisfies Plugin;
