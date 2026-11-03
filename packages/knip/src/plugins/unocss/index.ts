import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.ts';
import { toIgnore } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import { toUnconfig } from '../../util/plugin-config.ts';

// https://unocss.dev/guide/config-file
// https://github.com/unocss/unocss/blob/main/packages/config/src/index.ts

const title = 'UnoCSS';

const enablers = ['unocss'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = [...toUnconfig('uno.config'), ...toUnconfig('unocss.config')];

// `uno.css` is the unprefixed name of the `virtual:uno.css` module https://unocss.dev/integrations/vite
const resolve: Resolve = () => [toIgnore('uno.css', 'dependencies')];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  resolve,
};

export default plugin;
