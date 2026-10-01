import type { IsPluginEnabled, Plugin, RegisterCompilers } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { markdownAutoImportCompiler } from '../_vue/auto-import.ts';

// https://github.com/unplugin/unplugin-vue-markdown

const title = 'unplugin-vue-markdown';

const enablers = ['unplugin-vue-markdown'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const registerCompilers: RegisterCompilers = ({ hasDependency, registerCompiler }) => {
  if (hasDependency('unplugin-vue-markdown'))
    registerCompiler({ extension: '.md', compiler: markdownAutoImportCompiler });
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  registerCompilers,
};

export default plugin;
