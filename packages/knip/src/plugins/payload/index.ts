import type { IsPluginEnabled, Plugin, ResolveConfig } from '../../types/config.js';
import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { PayloadConfig } from './types.js';

// https://payloadcms.com/docs/configuration/overview

const title = 'Payload CMS';

const enablers = ['payload'];

const isEnabled: IsPluginEnabled = ({ dependencies }) => hasDependency(dependencies, enablers);

const config = ['payload.config.ts', 'src/payload.config.ts'];

const resolveConfig: ResolveConfig<PayloadConfig> = async config => {
  const awaitedConfig = await config;

  const importMapFile = awaitedConfig?.admin?.importMap?.importMapFile;
  if (importMapFile) {
    return [toDeferResolve(importMapFile, { optional: true })];
  }

  const adminRoute = awaitedConfig?.routes?.admin ?? '/admin';
  // Payload searches for these paths by default if the `importMapFile` is not explicitly specified
  // Ref: https://github.com/payloadcms/payload/blob/677596c503e8c0977b89b4579ac6b6d8a294b329/packages/payload/src/bin/generateImportMap/utilities/resolveImportMapFilePath.ts#L39-L40
  const possibleImportMapPaths = [
    `app/(payload)${adminRoute}/importMap.js`,
    `src/app/(payload)${adminRoute}/importMap.js`,
  ];

  return possibleImportMapPaths.map(id => toDeferResolve(id, { optional: true }));
};

const project = ['!migrations/**', '!src/migrations/**', '!payload-types.ts', '!src/payload-types.ts'];

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
  project,
};

export default plugin;
