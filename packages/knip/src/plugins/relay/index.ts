import path from 'path';
import type { IsPluginEnabled, Plugin, ResolveEntryPaths } from '../../types/config.js';
import { toDeferResolve, toEntry } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { RelayConfig } from './types.js';

// https://relay.dev/docs/next/guides/compiler/#configuration
// https://github.com/facebook/relay/blob/main/compiler/crates/relay-compiler/relay-compiler-config-schema.json

const title = 'Relay';

const enablers = ['relay-compiler'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config: string[] = ['relay.config.json', 'relay.config.js'];

const resolveEntryPaths: ResolveEntryPaths<RelayConfig> = async config => {
  const projects = 'projects' in config ? Object.values(config.projects) : [config];

  return projects.flatMap(project => {
    const artifactDirectory = project.artifactDirectory;

    if (artifactDirectory == null) return [];

    const scalars = project.customScalarTypes
      ? Object.values(project.customScalarTypes).flatMap(customScalarType =>
          typeof customScalarType !== 'string' ? [path.join(artifactDirectory, customScalarType.path)] : []
        )
      : [];

    return [toEntry(path.join(artifactDirectory, '**'))].concat(scalars.map(toDeferResolve));
  });
};

const args = {
  binaries: ['relay-compiler'],
  // config: // first positional argument is config file
  // (eg. relay-compiler ./myconfig.js)
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveEntryPaths,
  args,
} satisfies Plugin;
