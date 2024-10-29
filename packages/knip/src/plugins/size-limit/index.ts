import type { IsPluginEnabled, Plugin } from '../../types/config.js';
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

export default {
  title,
  enablers,
  isEnabled,
  config,
} satisfies Plugin;
