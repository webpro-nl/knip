import type { IsPluginEnabled, Plugin, RegisterCompilers } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { vueAutoImportCompiler } from '../_vue/auto-import.ts';

// https://github.com/unplugin/unplugin-vue-components

const title = 'unplugin-vue-components';

const enablers = ['unplugin-vue-components'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const registerCompilers: RegisterCompilers = ({ hasDependency, registerCompiler }) => {
  if (hasDependency('unplugin-vue-components'))
    registerCompiler({ extension: '.vue', compiler: vueAutoImportCompiler });
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  registerCompilers,
};

export default plugin;
