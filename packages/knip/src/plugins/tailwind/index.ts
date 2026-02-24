import type { IsPluginEnabled, Plugin, RegisterCompilers } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import compiler from './compiler.ts';

// https://tailwindcss.com/docs/configuration
// Tailwinds lilconfig dependency is only used for postcss

const title = 'Tailwind';

const enablers = ['tailwindcss'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['tailwind.config.{js,cjs,mjs,ts}', '*.css'];

const registerCompilers: RegisterCompilers = ({ registerCompiler, hasDependency }) => {
  if (hasDependency('tailwindcss')) registerCompiler({ extension: '.css', compiler });
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  registerCompilers,
};

export default plugin;
