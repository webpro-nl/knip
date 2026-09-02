import type { IsPluginEnabled, Plugin, RegisterCompilers } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import compiler from './compiler.ts';

// https://varlock.dev/guides/plugins/

const title = 'Varlock';

const enablers = ['varlock'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['.env.schema'];

const registerCompilers: RegisterCompilers = ({ registerCompiler, hasDependency }) => {
  if (hasDependency('varlock')) registerCompiler({ extension: '.schema', compiler });
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  registerCompilers,
};

export default plugin;
