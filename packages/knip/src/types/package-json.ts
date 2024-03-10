import type { PluginMap } from './config.js';
import type { LiteralUnion } from './util.js';

type Dependency = Record<string, string>;
type ExportCondition = LiteralUnion<
  'import' | 'require' | 'node' | 'node-addons' | 'deno' | 'browser' | 'electron' | 'react-native' | 'default',
  string
>;
type Exports = null | string | string[] | { [key in ExportCondition]: Exports } | { [key: string]: Exports };

type PackageJsonPath<T> = T extends { packageJsonPath: infer P } ? (P extends string ? P : never) : never;

type WithPackageJsonPathAsKey<T> = {
  [K in keyof T]: PackageJsonPath<T[K]> extends never ? K : PackageJsonPath<T[K]>;
};

type PluginConfigs<P> = {
  [K in keyof P as WithPackageJsonPathAsKey<P>[K]]: unknown;
};

type Plugins = PluginConfigs<PluginMap> & { plugin: unknown };

export type Scripts = Record<string, string>;

export type PackageJson = {
  name?: string;
  main?: string;
  bin?: string | Record<string, string>;
  version?: string;
  workspaces?: string[] | { packages?: string[] };
  exports?: Exports;
  scripts?: Scripts;
  dependencies?: Dependency;
  devDependencies?: Dependency;
  peerDependencies?: Dependency;
  optionalDependencies?: Dependency;
  peerDependenciesMeta?: Record<string, { optional: true }>;
} & Plugins;
