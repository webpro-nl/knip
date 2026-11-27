import type { Args } from '../../types/args.ts';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toEntryPath } from '../../util/input.ts';
import { toAbsolute } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { WranglerConfig } from './types.ts';

// https://developers.cloudflare.com/workers/wrangler/configuration/
// https://developers.cloudflare.com/workers/wrangler/custom-builds/
// https://github.com/cloudflare/workers-sdk/blob/41bacf7ce166b2151c858e06289d1711e41e4ff9/packages/wrangler/src/deployment-bundle/run-custom-build.ts

const title = 'Wrangler';

const enablers = ['wrangler'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['wrangler.{json,jsonc,toml}'];

const resolveConfig: ResolveConfig<WranglerConfig> = async (config, options) => {
  const inputs = (config.main ? [config.main] : []).map(id => toEntryPath(id, { production: true }));
  const build = config.build;
  if (build?.command) {
    const cwd = build.cwd ? toAbsolute(build.cwd, options.cwd) : options.cwd;
    for (const input of options.getInputsFromScripts(build.command, { optionalBinaries: true, cwd }))
      inputs.push({ ...input, dir: input.dir ?? cwd });
  }
  return inputs;
};

const args: Args = {
  config: true,
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  args,
};

export default plugin;
