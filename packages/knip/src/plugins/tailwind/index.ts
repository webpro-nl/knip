import type { IsPluginEnabled, Plugin, RegisterCompilers } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';
import compiler from './compiler.js';

// https://tailwindcss.com/docs/configuration
// Tailwinds lilconfig dependency is only used for postcss

const title = 'Tailwind';

const enablers = ['tailwindcss'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['tailwind.config.{js,cjs,mjs,ts}'];

const registerCompilers: RegisterCompilers = async ({ registerCompiler, hasDependency }) => {
  if (hasDependency('tailwindcss')) await registerCompiler({ extension: '.css', compiler });
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  registerCompilers,
};

export default plugin;
