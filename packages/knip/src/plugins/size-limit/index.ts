import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.js';
import { toDependency } from '../../util/input.js';
import { toLilconfig } from '../../util/plugin-config.js';
import { hasDependency } from '../../util/plugin.js';

// https://github.com/ai/size-limit
// Uses lilconfig but with custom searchPlaces
// https://github.com/ai/size-limit/blob/main/packages/size-limit/get-config.js

const title = 'size-limit';

const enablers = ['size-limit'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = [
  'package.json',
  ...toLilconfig('size-limit', { configDir: false, additionalExtensions: ['ts', 'mts', 'cts'], rcSuffix: '' }),
];

const resolve: Resolve = options => {
  const allDeps = [
    ...Object.keys(options.manifest.dependencies || {}),
    ...Object.keys(options.manifest.devDependencies || {}),
  ];

  const sizeLimitDeps = allDeps.filter(dep => dep.startsWith('@size-limit/'));

  return sizeLimitDeps.map(dep => toDependency(dep));
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolve,
} satisfies Plugin;
