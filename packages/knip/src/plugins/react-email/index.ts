import { readFileSync } from 'node:fs';
import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin } from '../../types/config.ts';
import type { PackageJson } from '../../types/package-json.ts';
import { toDependency, toEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://react.email/docs/cli

const title = 'React Email';

const enablers = ['react-email'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const entry = ['emails/**/*.tsx'];

const previewCommands = new Set(['build', 'dev', 'start']);

const getPreviewDependency = (cwd: string): string => {
  try {
    const manifest: PackageJson = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'));
    const range = manifest.dependencies?.['react-email'] ?? manifest.devDependencies?.['react-email'];
    const major = range?.match(/\d+/)?.[0];
    if (major && Number.parseInt(major, 10) >= 6) return '@react-email/ui';
  } catch {}
  return '@react-email/preview-server';
};

const args: Args = {
  binaries: ['email'],
  resolveInputs: (parsed, { cwd }) => {
    const inputs = [];
    if (previewCommands.has(parsed._[0])) inputs.push(toDependency(getPreviewDependency(cwd)));
    if (parsed.dir) inputs.push(toEntry(`${parsed.dir}/**/*.tsx`));
    return inputs;
  },
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  entry,
  args,
};

export default plugin;
