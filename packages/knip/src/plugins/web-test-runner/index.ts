import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import { toEntry } from '../../util/input.ts';
import { toAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://modern-web.dev/docs/test-runner/cli-and-configuration/
// https://github.com/modernweb-dev/web/blob/ed64db24393a49fadf078829b0b34d3ffcaca7e1/packages/test-runner/src/config/readFileConfig.ts
// https://github.com/modernweb-dev/web/blob/ed64db24393a49fadf078829b0b34d3ffcaca7e1/packages/config-loader/src/index.js

const title = 'Web Test Runner';

const enablers = ['@web/test-runner'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['web-test-runner.config.{js,cjs,mjs}'];

const args: Args = {
  binaries: ['web-test-runner', 'wtr'],
  config: ['config'],
  string: ['files'],
  boolean: [
    'coverage',
    'debug',
    'help',
    'manual',
    'node-resolve',
    'open',
    'playwright',
    'preserve-symlinks',
    'puppeteer',
    'static-logging',
    'update-snapshots',
    'watch',
  ],
  resolveInputs: (parsed, { cwd }) =>
    [...parsed._, ...[parsed.files ?? []].flat()].map(id => {
      const pattern = String(id);
      return toEntry(pattern.startsWith('!') ? `!${toAbsolute(pattern.slice(1), cwd)}` : toAbsolute(pattern, cwd));
    }),
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  args,
};

export default plugin;
