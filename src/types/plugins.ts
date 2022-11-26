import { PackageJson } from 'type-fest';
import { PluginConfiguration } from './config.js';

type IsPluginEnabledCallbackOptions = { manifest: PackageJson; dependencies: Set<string> };

export type IsPluginEnabledCallback = (options: IsPluginEnabledCallbackOptions) => boolean;

type GenericPluginCallbackOptions = { cwd: string; manifest: PackageJson; config: PluginConfiguration };

export type GenericPluginCallback = (
  configFilePath: string,
  { cwd, manifest, config }: GenericPluginCallbackOptions
) => Promise<string[]> | string[];
