import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin } from '#p/types/plugins.js';
import { hasDependency, toLilconfig } from '#p/util/plugin.js';

// https://github.com/ai/size-limit
// Uses lilconfig but with custom searchPlaces
// https://github.com/ai/size-limit/blob/main/packages/size-limit/get-config.js

const title = 'size-limit';

const enablers: EnablerPatterns = ['size-limit'];

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
