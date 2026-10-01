import type { IsPluginEnabled, Plugin, ResolveSourceMap, SourceMap } from '../../types/config.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import { DEFAULT_INPUT, DEFAULT_OUTPUT, parseScripts } from './helpers.ts';

// https://svelte.dev/docs/kit/packaging

const title = '@sveltejs/package';

const enablers = ['@sveltejs/package'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const resolveSourceMap: ResolveSourceMap = ({ cwd, manifest }) => {
  const ios = parseScripts(manifest.scripts);
  const effective = ios.length > 0 ? ios : [{ input: DEFAULT_INPUT, output: DEFAULT_OUTPUT }];
  const seen = new Set<string>();
  const pairs: SourceMap[] = [];
  for (const { input, output } of effective) {
    const key = `${input}→${output}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ srcDir: join(cwd, input), outDir: join(cwd, output) });
  }
  return pairs;
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  resolveSourceMap,
};

export default plugin;
