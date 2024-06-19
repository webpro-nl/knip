import type { EnablerPatterns } from '#p/types/config.js';
import type { IsPluginEnabled, Plugin } from '#p/types/plugins.js';
import { hasDependency } from '#p/util/plugin.js';

// https://docs.lost-pixel.com/user-docs/api-reference/lost-pixel.config.js-or-ts

const title = 'Lost Pixel';

const enablers: EnablerPatterns = ['lost-pixel'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['lostpixel.config.{js,ts}'];

export default {
  title,
  enablers,
  isEnabled,
  config,
} satisfies Plugin;
