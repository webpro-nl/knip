import { PackageJson } from 'type-fest';
import { PluginConfiguration } from './config.js';

type IsPluginEnabledCallbackOptions = { manifest: PackageJson; dependencies: Set<string> };

export type IsPluginEnabledCallback = (options: IsPluginEnabledCallbackOptions) => boolean;

export type GenericPluginCallback = (
  configFilePath: string,
  { cwd, manifest }: { cwd: string; manifest: PackageJson; config: PluginConfiguration }
) => Promise<string[]> | string[];
