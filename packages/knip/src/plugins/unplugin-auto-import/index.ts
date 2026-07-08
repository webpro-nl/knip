import type { IsPluginEnabled, Plugin, RegisterCompilers } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import { tsAutoImportCompiler, vueAutoImportCompiler } from '../_vue/auto-import.ts';

// https://github.com/unplugin/unplugin-auto-import

const title = 'unplugin-auto-import';

const enablers = ['unplugin-auto-import'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const registerCompilers: RegisterCompilers = ({ hasDependency, registerCompiler }) => {
  if (hasDependency('unplugin-auto-import')) {
    registerCompiler({ extension: '.vue', compiler: vueAutoImportCompiler });
    registerCompiler({ extension: '.ts', compiler: tsAutoImportCompiler });
  }
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  registerCompilers,
};

export default plugin;
