import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://docs.lost-pixel.com/user-docs/api-reference/lost-pixel.config.js-or-ts

const title = 'Lost Pixel';

const enablers = ['lost-pixel'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['lostpixel.config.{js,ts}'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
};

export default plugin;
