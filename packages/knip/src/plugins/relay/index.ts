import parseArgs from 'minimist';
import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { toProductionEntry } from '../../util/input.ts';
import { join } from '../../util/path.ts';
import { hasDependency } from '../../util/plugin.ts';
import type { RelayConfig } from './types.ts';

// https://relay.dev/docs/next/guides/compiler/#configuration
// https://github.com/facebook/relay/blob/main/compiler/crates/relay-compiler/relay-compiler-config-schema.json

const title = 'Relay';

const enablers = ['vite-plugin-relay', '@swc/plugin-relay', 'babel-plugin-relay'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['relay.config.json', 'relay.config.js'];

const resolveConfig: ResolveConfig<RelayConfig> = async config => {
  const projects = 'projects' in config ? Object.values(config.projects) : [config];

  return projects.map(project => {
    const artifactDirectory = project.artifactDirectory;

    if (artifactDirectory == null) {
      return toProductionEntry('**/__generated__/*');
    }

    return toProductionEntry(join(artifactDirectory, '**'));
  });
};

const args = {
  binaries: ['relay-compiler'],
  args: (args: string[]) => ['-c', parseArgs(args)._[0]], // first positional argument is config file
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
