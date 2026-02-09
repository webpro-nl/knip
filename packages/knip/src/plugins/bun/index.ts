import parseArgs from 'minimist';
import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.js';
import { toEntry } from '../../util/input.js';

// https://bun.sh/docs/cli/test

const title = 'Bun';

const enablers = ['bun'];

const hasBunTest = (scripts: Record<string, string> | undefined) =>
  scripts && Object.values(scripts).some(script => /(?<=^|\s)bun test/.test(script));

const isEnabled: IsPluginEnabled = ({ manifest }) => !!hasBunTest(manifest.scripts);

const patterns = ['**/*.{test,spec}.{js,jsx,ts,tsx}', '**/*_{test,spec}.{js,jsx,ts,tsx}'];

const resolve: Resolve = options => {
  const scripts = { ...options.rootManifest?.scripts, ...options.manifest.scripts };
  for (const script of Object.values(scripts)) {
    if (/(?<=^|\s)bun test/.test(script)) {
      const parsed = parseArgs(script.split(' '), { string: ['timeout', 'rerun-each', 'preload'] });
      const args = parsed._.filter(id => id !== 'bun' && id !== 'test');
      return (args.length === 0 ? patterns : args).map(toEntry);
    }
  }
  return [];
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  resolve,
};

export default plugin;
