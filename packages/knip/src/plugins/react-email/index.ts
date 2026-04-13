import parseArgs from 'minimist';
import type { IsPluginEnabled, Plugin, Resolve } from '../../types/config.ts';
import { toDependency, toEntry } from '../../util/input.ts';
import { hasDependency } from '../../util/plugin.ts';

// https://react.email/docs/cli

const title = 'React Email';

const enablers = ['react-email'];

const isEnabled: IsPluginEnabled = ({ dependencies }) =>
  hasDependency(dependencies, enablers);

const scriptPattern = /^email (build|dev|export|start)/;

const resolve: Resolve = ({ rootManifest, manifest }) => {
  const scripts = { ...rootManifest?.scripts, ...manifest.scripts };
  const inputs = [];
  let hasPreviewScript = false;
  const dirs = new Set<string>();

  for (const key in scripts) {
    const script = scripts[key];

    const matches = scriptPattern.exec(script);
    if (!matches) continue;

    if (!hasPreviewScript && matches[1] !== 'export') {
      inputs.push(toDependency('@react-email/preview-server'));
      hasPreviewScript = true;
    }

    const parsed = parseArgs(script.split(' '), { string: ['dir'] });
    if (typeof parsed.dir !== 'string') continue;

    const dir = parsed.dir.replace(/^\.\//, '');
    if (dirs.has(dir)) continue;

    dirs.add(dir);
    inputs.push(toEntry(`${dir}/**/*.tsx`));
  }

  if (dirs.size === 0) inputs.push(toEntry('emails/**/*.tsx'));

  return inputs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  resolve,
};

export default plugin;

export const docs = {
  note: 'Email templates that re-export a component as both a named and default export will trigger a `duplicates` issue. Add a [`@alias` JSDoc tag][1] to the default export to suppress it, or set `ignoreIssues` for the emails directory in your knip config.\n\n[1]: /reference/jsdoc-tsdoc-tags#alias',
};
