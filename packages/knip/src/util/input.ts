import type { PluginName } from '../types/PluginNames.js';
import type { IssueType } from '../types/issues.js';
import { isAbsolute, toRelative } from './path.js';

type InputType =
  | 'binary'
  | 'entry'
  | 'project'
  | 'config'
  | 'dependency'
  | 'deferResolve'
  | 'deferResolveEntry'
  | 'alias'
  | 'ignore';

export interface Input {
  type: InputType;
  specifier: string;
  production?: boolean;
  optional?: boolean;
  dir?: string;
  containingFilePath?: string;
  allowIncludeExports?: boolean;
  skipExportsAnalysis?: boolean;
}

export interface ConfigInput extends Input {
  type: 'config';
  containingFilePath?: string;
  pluginName: PluginName;
}

interface AliasInput extends Input {
  type: 'alias';
  prefixes: string[];
}

interface IgnoreInput extends Input {
  type: 'ignore';
  issueType: IssueType;
}

type Options = {
  optional?: boolean;
  dir?: string;
  containingFilePath?: string;
  allowIncludeExports?: boolean;
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

export const toProject = (specifier: string): Input => ({ type: 'project', specifier });

export const isProject = (input: Input) => input.type === 'project';

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

export const toDeferResolve = (specifier: string): Input => ({ type: 'deferResolve', specifier });

export const isDeferResolve = (input: Input) => input.type === 'deferResolve';

export const toDeferResolveProductionEntry = (specifier: string, options: Options = {}): Input => ({
  type: 'deferResolveEntry',
  specifier,
  production: true,
  ...options,
});

export const isDeferResolveProductionEntry = (input: Input) =>
  input.type === 'deferResolveEntry' && input.production === true;

export const toDeferResolveEntry = (specifier: string, options: Options = {}): Input => ({
  type: 'deferResolveEntry',
  specifier,
  ...options,
});

export const isDeferResolveEntry = (input: Input) => input.type === 'deferResolveEntry';

export const toAlias = (specifier: string, prefix: string | string[], options: Options = {}): AliasInput => ({
  type: 'alias',
  specifier,
  prefixes: Array.isArray(prefix) ? prefix : [prefix],
  ...options,
});

export const isAlias = (input: Input): input is AliasInput => input.type === 'alias';

/** @public not used yet */
export const toIgnore = (specifier: string, issueType: IssueType): IgnoreInput => ({
  type: 'ignore',
  specifier,
  issueType,
});

export const isIgnore = (input: Input): input is IgnoreInput => input.type === 'ignore';

export const toDebugString = (input: Input) =>
  `${input.type}:${isAbsolute(input.specifier) ? toRelative(input.specifier) : input.specifier}${input.containingFilePath ? ` (${toRelative(input.containingFilePath)})` : ''}`;
