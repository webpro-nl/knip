import type { PluginName } from '../types/PluginNames.js';
import { toRelative } from './path.js';

type InputType = 'binary' | 'entry' | 'config' | 'dependency' | 'deferResolve' | 'deferResolveEntry';

export interface Input {
  type: InputType;
  specifier: string;
  production?: boolean;
  dir?: string;
  containingFilePath?: string;
}

export interface ConfigInput extends Input {
  type: 'config';
  containingFilePath: string;
  pluginName: PluginName;
}

type Options = {
  production?: boolean;
  dir?: string;
  containingFilePath?: string;
};

export const fromBinary = (input: Input) => input.specifier;

export const toBinary = (specifier: string, options: Options = {}): Input => ({
  type: 'binary',
  specifier,
  ...options,
});

export const isBinary = (input: Input) => input.type === 'binary';

export const toEntry = (specifier: string): Input => ({ type: 'entry', specifier });

export const isEntry = (input: Input) => input.type === 'entry' && !input.production;

export const toProductionEntry = (specifier: string, options: Options = {}): Input => ({
  type: 'entry',
  specifier,
  production: true,
  ...options,
});

export const isProductionEntry = (input: Input) => input.type === 'entry' && input.production === true;

export const toConfig = (pluginName: PluginName, specifier: string, containingFilePath: string): ConfigInput => ({
  type: 'config',
  specifier,
  pluginName,
  containingFilePath,
});

export const isConfigPattern = (input: Input): input is ConfigInput => input.type === 'config';

export const toDependency = (specifier: string): Input => ({ type: 'dependency', specifier });

export const isDependency = (input: Input) => input.type === 'dependency';

export const toProductionDependency = (specifier: string): Input => ({
  type: 'dependency',
  specifier,
  production: true,
});

export const toDevDependency = (specifier: string): Input => ({ type: 'dependency', specifier });

export const toDeferResolve = (specifier: string): Input => ({ type: 'deferResolve', specifier });

export const toDeferResolveEntry = (specifier: string): Input => ({ type: 'deferResolveEntry', specifier });

export const isDeferResolveEntry = (input: Input) => input.type === 'deferResolveEntry';

export const toDebugString = (input: Input) =>
  `${input.type}:${input.specifier}${input.containingFilePath ? ` (${toRelative(input.containingFilePath)})` : ''}`;
