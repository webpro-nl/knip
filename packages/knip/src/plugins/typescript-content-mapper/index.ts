import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.ts';
import { get } from '../../util/object.ts';
import { toShellCommand } from '../../util/scripts.ts';
import type { ContentMapperManifest } from './types.ts';

const title = 'TypeScript Content Mapper';

const enablers = 'This plugin is enabled when `package.json#typescript.contentMapper` is present.';

const isEnabled: IsPluginEnabled = ({ manifest }) => Boolean(get(manifest, 'typescript.contentMapper'));

const packageJsonPath = 'typescript.contentMapper';

const config = ['package.json'];

const resolveConfig: ResolveConfig<ContentMapperManifest> = ({ exec }, options) => {
  if (!Array.isArray(exec) || exec.some(arg => typeof arg !== 'string')) return [];
  return options
    .getInputsFromScripts(toShellCommand(exec))
    .map(input =>
      input.type === 'entry' || input.type === 'deferResolveEntry' ? { ...input, production: true } : input
    );
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  packageJsonPath,
  config,
  resolveConfig,
};

export default plugin;
