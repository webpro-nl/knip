import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

// https://docs.lost-pixel.com/user-docs/api-reference/lost-pixel.config.js-or-ts

const title = 'Lost Pixel';

const enablers = ['lost-pixel'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['lostpixel.config.{js,ts}'];

export default {
  title,
  enablers,
  isEnabled,
  config,
} satisfies Plugin;
