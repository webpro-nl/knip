import type { IsLoadConfig, IsPluginEnabled, Plugin, ResolveConfig, ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import { _parseFile } from '../../typescript/ast-nodes.ts';
import { type Input, toEntryPath, toEntry } from '../../util/input.ts';
import type { OpenClawManifest } from './types.ts';

const title = 'OpenClaw';

const enablers = 'This plugin is enabled when `package.json#openclaw` is present.';

const isEnabled: IsPluginEnabled = ({ manifest }) => Object.hasOwn(manifest, 'openclaw');

const config = ['package.json', 'openclaw.plugin.json'];

const isLoadConfig: IsLoadConfig = ({ configFileName }) => configFileName === 'package.json';

const toEntries = (value: unknown, dir: string): Input[] =>
  (Array.isArray(value) ? value : [value]).flatMap(entry =>
    typeof entry === 'string' ? [toEntryPath(entry, { production: true, dir })] : []
  );

const toHookEntries = (value: unknown): Input[] =>
  (Array.isArray(value) ? value : [value]).flatMap(entry => {
    if (typeof entry !== 'string') return [];
    const dir = entry.trim().replace(/\/+$/, '');
    return dir ? [toEntry(`${dir}/{handler,index}.{ts,js}`, { production: true })] : [];
  });

const resolveConfig: ResolveConfig<OpenClawManifest> = (localConfig, options) => {
  if (!localConfig) return [];

  const assetScripts = [localConfig.assetScripts?.build, localConfig.assetScripts?.copy].filter(
    (script): script is string => typeof script === 'string'
  );
  const assetScriptInputs = options
    .getInputsFromScripts(assetScripts)
    .map(input =>
      input.type === 'entry' || input.type === 'deferResolveEntry' ? { ...input, production: true } : input
    );

  return [
    ...toEntries(localConfig.extensions, options.cwd),
    ...toEntries(localConfig.runtimeExtensions, options.cwd),
    ...toEntries(localConfig.setupEntry, options.cwd),
    ...toEntries(localConfig.runtimeSetupEntry, options.cwd),
    ...toEntries(localConfig.providerCatalogEntry, options.cwd),
    ...toEntries(localConfig.channel?.configuredState?.specifier, options.cwd),
    ...toEntries(localConfig.channel?.persistedAuthState?.specifier, options.cwd),
    ...toHookEntries(localConfig.hooks),
    ...(localConfig.build?.staticAssets ?? []).flatMap(asset =>
      typeof asset.source === 'string' ? [toEntry(asset.source, { production: true })] : []
    ),
    ...assetScriptInputs,
  ];
};

const resolveFromAST: ResolveFromAST = (_, options) => {
  if (options.configFileName !== 'openclaw.plugin.json') return [];
  const sourceText = options.readFile(options.configFilePath).replace(/^\uFEFF/, '');
  const { program } = _parseFile(`${options.configFilePath}.ts`, `(${sourceText}\n)`);
  return Array.from(collectPropertyValues(program, 'providerCatalogEntry'), entry =>
    toEntryPath(entry, { production: true, dir: options.cwd })
  );
};

const plugin: Plugin = {
  title,
  enablers,
  isEnabled,
  config,
  isLoadConfig,
  resolveConfig,
  resolveFromAST,
};

export default plugin;
