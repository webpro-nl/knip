import type { PluginName } from '../types/PluginNames.js';
import { toRelative } from './path.js';

type Type = 'binary' | 'entry' | 'config' | 'dependency' | 'deferResolve' | 'deferResolveEntry';

export interface Dependency {
  type: Type;
  specifier: string;
  production?: boolean;
  dir?: string;
  containingFilePath?: string;
}

export interface ConfigDependency extends Dependency {
  pluginName: PluginName;
}

export interface ConfigDependencyW extends ConfigDependency {
  containingFilePath: string;
}

type Options = {
  production?: boolean;
  dir?: string;
  containingFilePath?: string;
};

export const fromBinary = (dependency: Dependency) => dependency.specifier;

export const toBinary = (specifier: string, options: Options = {}): Dependency => ({
  type: 'binary',
  specifier,
  ...options,
});

export const isBinary = (dependency: Dependency) => dependency.type === 'binary';

export const toEntry = (specifier: string): Dependency => ({ type: 'entry', specifier });

export const isEntry = (dependency: Dependency) => dependency.type === 'entry' && !dependency.production;

export const toProductionEntry = (specifier: string, options: Options = {}): Dependency => ({
  type: 'entry',
  specifier,
  production: true,
  ...options,
});

export const isProductionEntry = (dependency: Dependency) =>
  dependency.type === 'entry' && dependency.production === true;

export const toConfig = (pluginName: PluginName, specifier: string): ConfigDependency => ({
  type: 'config',
  pluginName,
  specifier,
});

export const isConfigPattern = (dependency: Dependency): dependency is ConfigDependency => dependency.type === 'config';

export const toDependency = (specifier: string): Dependency => ({ type: 'dependency', specifier });

export const isDependency = (dependency: Dependency) => dependency.type === 'dependency';

export const toProductionDependency = (specifier: string): Dependency => ({
  type: 'dependency',
  specifier,
  production: true,
});

export const isProductionDependency = (dependency: Dependency) =>
  dependency.type === 'dependency' && dependency.production === true;

export const toDevDependency = (specifier: string): Dependency => ({ type: 'dependency', specifier });

export const toDeferResolve = (specifier: string): Dependency => ({ type: 'deferResolve', specifier });

export const isDeferResolve = (dependency: Dependency) => dependency.type === 'deferResolve';

export const toDeferResolveEntry = (specifier: string): Dependency => ({ type: 'deferResolveEntry', specifier });

export const isDeferResolveEntry = (dependency: Dependency) => dependency.type === 'deferResolveEntry';

export const toDebugString = (dependency: Dependency) =>
  `${dependency.type}:${dependency.specifier} ${dependency.containingFilePath ? `(${toRelative(dependency.containingFilePath)})` : ''}`;
