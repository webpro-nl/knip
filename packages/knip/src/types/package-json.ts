import type { PluginMap, WorkspaceConfiguration } from './config.js';

type Primitive = null | undefined | string | number | boolean | symbol | bigint;

type LiteralUnion<LiteralType, BaseType extends Primitive> = LiteralType | (BaseType & Record<never, never>);

type Dependencies = Record<string, string>;

type C = 'import' | 'require' | 'node' | 'node-addons' | 'deno' | 'browser' | 'electron' | 'react-native' | 'default';
type ExportCondition = LiteralUnion<C, string>;
type Exports = null | string | string[] | { [key in ExportCondition]: Exports } | { [key: string]: Exports };

type Imports = {
  [key: `#${string}`]: Exports;
};

type PackageJsonPath<T> = T extends { packageJsonPath: infer P } ? (P extends string ? P : never) : never;

type WithPackageJsonPathAsKey<T> = {
  [K in keyof T]: PackageJsonPath<T[K]> extends never ? K : PackageJsonPath<T[K]>;
};

type PluginConfig<P> = {
  [K in keyof P as WithPackageJsonPathAsKey<P>[K]]: unknown;
};

type Plugins = PluginConfig<PluginMap>;

export type Scripts = Record<string, string>;

export type Catalog = Record<string, string>;
export type Catalogs = Record<string, Catalog>;

export type PackageJson = {
  name?: string;
  main?: string;
  bin?: string | Record<string, string>;
  version?: string;
  workspaces?: string[] | { packages?: string[]; catalog?: Catalog; catalogs?: Catalogs };
  exports?: Exports;
  imports?: Imports;
  scripts?: Scripts;
  dependencies?: Dependencies;
  devDependencies?: Dependencies;
  peerDependencies?: Dependencies;
  optionalDependencies?: Dependencies;
  peerDependenciesMeta?: Record<string, { optional: true }>;
  resolutions?: Dependencies;
  module?: string;
  browser?: string;
  types?: string;
  typings?: string;
  catalog?: Catalog;
  catalogs?: Catalogs;
  packageManager?: string;
  pnpm?: {
    overrides?: Dependencies;
  };
  knip?: WorkspaceConfiguration;
} & Plugins;

export type WorkspacePackage = {
  dir: string;
  name: string;
  pkgName: string | undefined;
  manifest: PackageJson;
  manifestPath: string;
  manifestStr: string;
};
