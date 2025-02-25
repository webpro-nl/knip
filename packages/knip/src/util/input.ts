import type { PluginName } from '../types/PluginNames.js';
import { isAbsolute, toRelative } from './path.js';

type InputType = 'binary' | 'entry' | 'config' | 'dependency' | 'deferResolve' | 'deferResolveEntry';

export interface Input {
  type: InputType;
  specifier: string;
  production?: boolean;
  optional?: boolean;
  dir?: string;
  containingFilePath?: string;
}

export interface ConfigInput extends Input {
  type: 'config';
  containingFilePath?: string;
  pluginName: PluginName;
}

type Options = {
  optional?: boolean;
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

export const toConfig = (pluginName: PluginName, specifier: string, options: Options = {}): ConfigInput => ({
  type: 'config',
  specifier,
  pluginName,
  ...options,
});

export const isConfig = (input: Input): input is ConfigInput => input.type === 'config';

export const toDependency = (specifier: string, options: Options = {}): Input => ({
  type: 'dependency',
  specifier,
  ...options,
});

export const isDependency = (input: Input) => input.type === 'dependency';

export const toProductionDependency = (specifier: string): Input => ({
  type: 'dependency',
  specifier,
  production: true,
});

export const toDevDependency = (specifier: string): Input => ({ type: 'dependency', specifier });

export const toDeferResolve = (specifier: string): Input => ({ type: 'deferResolve', specifier });

export const isDeferResolve = (input: Input) => input.type === 'deferResolve';

export const toDeferResolveProductionEntry = (specifier: string): Input => ({
  type: 'deferResolveEntry',
  specifier,
  production: true,
});

export const isDeferResolveProductionEntry = (input: Input) =>
  input.type === 'deferResolveEntry' && input.production === true;

export const toDeferResolveEntry = (specifier: string): Input => ({ type: 'deferResolveEntry', specifier });

export const isDeferResolveEntry = (input: Input) => input.type === 'deferResolveEntry';

export const toDebugString = (input: Input) =>
  `${input.type}:${isAbsolute(input.specifier) ? toRelative(input.specifier) : input.specifier}${input.containingFilePath ? ` (${toRelative(input.containingFilePath)})` : ''}`;
