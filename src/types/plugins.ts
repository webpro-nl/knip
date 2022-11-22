import { PackageJson } from 'type-fest';

type IsPluginEnabledCallbackOptions = { manifest: PackageJson; dependencies: Set<string> };

export type IsPluginEnabledCallback = (options: IsPluginEnabledCallbackOptions) => boolean;

export type GenericPluginCallback = (
  configFilePath: string,
  { cwd, manifest }: { cwd: string; manifest: PackageJson }
) => Promise<string[]> | string[];
