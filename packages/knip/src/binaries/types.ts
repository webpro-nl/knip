import type { BaseOptions } from '../types/plugins.js';

export interface GetDependenciesFromScriptsOptions extends BaseOptions {
  knownGlobalsOnly?: boolean;
}

export type GetDependenciesFromScripts = (
  npmScripts: string | string[] | Set<string>,
  options: GetDependenciesFromScriptsOptions
) => string[];

type FromArgs = (args: string[]) => string[];

interface BinaryResolverOptions extends GetDependenciesFromScriptsOptions {
  fromArgs: FromArgs;
}

export type Resolver = (binary: string, args: string[], options: BinaryResolverOptions) => string[];
