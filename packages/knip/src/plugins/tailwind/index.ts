import type { IsPluginEnabled, Plugin, RegisterCompilers } from '../../types/config.ts';
import { hasDependency } from '../../util/plugin.ts';
import compiler from './compiler.ts';

// https://tailwindcss.com/docs/configuration
// Tailwinds lilconfig dependency is only used for postcss

const title = 'Tailwind';

const enablers = ['tailwindcss', '@tailwindcss/vite', '@tailwindcss/postcss', '@tailwindcss/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['tailwind.config.{js,cjs,mjs,ts}'];

const registerCompilers: RegisterCompilers = ({ registerCompiler, hasDependency }) => {
  if (enablers.some(enabler => hasDependency(enabler))) registerCompiler({ extension: '.css', compiler });
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  registerCompilers,
};

export default plugin;
