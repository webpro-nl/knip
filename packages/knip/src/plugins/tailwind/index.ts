import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, RegisterCompilers } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';
import compiler from './compiler.ts';

// https://tailwindcss.com/docs/configuration
// Tailwinds lilconfig dependency is only used for postcss

const title = 'Tailwind';

const enablers = ['tailwindcss', '@tailwindcss/vite', '@tailwindcss/postcss', '@tailwindcss/cli'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['tailwind.config.{js,cjs,mjs,ts,cts,mts}'];

const registerCompilers: RegisterCompilers = ({ registerCompiler, hasDependency }) => {
  for (const enabler of enablers) {
    if (!hasDependency(enabler)) continue;
    registerCompiler({ extension: '.css', compiler });
    break;
  }
};

// https://tailwindcss.com/docs/installation/tailwind-cli
const args: Args = {
  binaries: ['tailwindcss'],
  string: ['input'],
  alias: { input: ['i'] },
  resolveInputs: parsed => (parsed.input ? [toProductionEntry(parsed.input)] : []),
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  args,
  registerCompilers,
};

export default plugin;
