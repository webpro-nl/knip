import type { IsLoadConfig, IsPluginEnabled, Plugin, ResolveConfig, ResolveFromAST } from '../../types/config.ts';
import { collectPropertyValues } from '../../typescript/ast-helpers.ts';
import { _parseFile } from '../../typescript/ast-nodes.ts';
import { type Input, toProductionEntry } from '../../util/input.ts';
import type { OpenClawManifest } from './types.ts';

const title = 'OpenClaw';

const enablers = 'This plugin is enabled when `package.json#openclaw` is present.';

const isEnabled: IsPluginEnabled = ({ manifest }) => Object.hasOwn(manifest, 'openclaw');

const config = ['package.json', 'openclaw.plugin.json'];

const isLoadConfig: IsLoadConfig = ({ configFileName }) => configFileName === 'package.json';

const toEntries = (value: unknown): Input[] =>
  (Array.isArray(value) ? value : [value]).flatMap(entry =>
    typeof entry === 'string' ? [toProductionEntry(entry)] : []
  );

const toHookEntries = (value: unknown): Input[] =>
  (Array.isArray(value) ? value : [value]).flatMap(entry => {
    if (typeof entry !== 'string') return [];
    const dir = entry.trim().replace(/\/+$/, '');
    return dir ? [toProductionEntry(`${dir}/{handler,index}.{ts,js}`)] : [];
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
    ...toEntries(localConfig.extensions),
    ...toEntries(localConfig.runtimeExtensions),
    ...toEntries(localConfig.setupEntry),
    ...toEntries(localConfig.runtimeSetupEntry),
    ...toEntries(localConfig.providerCatalogEntry),
    ...toEntries(localConfig.channel?.configuredState?.specifier),
    ...toEntries(localConfig.channel?.persistedAuthState?.specifier),
    ...toHookEntries(localConfig.hooks),
    ...toEntries(localConfig.build?.staticAssets?.map(asset => asset.source)),
    ...assetScriptInputs,
  ];
};

const resolveFromAST: ResolveFromAST = (_, options) => {
  if (options.configFileName !== 'openclaw.plugin.json') return [];
  const sourceText = options.readFile(options.configFilePath).replace(/^\uFEFF/, '');
  const { program } = _parseFile(`${options.configFilePath}.ts`, `(${sourceText}\n)`);
  return [...collectPropertyValues(program, 'providerCatalogEntry')].map(entry => toProductionEntry(entry));
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
