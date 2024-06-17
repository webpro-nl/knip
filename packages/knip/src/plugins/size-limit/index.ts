import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';

// https://github.com/ai/size-limit

const title = 'size-limit';

const enablers: EnablerPatterns = ['size-limit'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['.size-limit.{json,js,cjs,ts}', 'package.json'];

export default {
  title,
  enablers,
  isEnabled,
  config,
} satisfies Plugin;
