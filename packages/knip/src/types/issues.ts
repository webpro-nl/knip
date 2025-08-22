import type { Workspace } from '../ConfigurationChief.js';

export enum SymbolType {
  VARIABLE = 'variable',
  TYPE = 'type',
  INTERFACE = 'interface',
  ENUM = 'enum',
  FUNCTION = 'function',
  CLASS = 'class',
  MEMBER = 'member',
  UNKNOWN = 'unknown',
}

export type IssueSymbol = { symbol: string; pos?: number; line?: number; col?: number };

export type Issue = {
  type: SymbolIssueType;
  filePath: string;
  workspace: string;
  symbol: string;
  symbols?: IssueSymbol[];
  symbolType?: SymbolType;
  parentSymbol?: string;
  specifier?: string;
  severity?: IssueSeverity;
  pos?: number;
  line?: number;
  col?: number;
  isFixed?: boolean;
};

export type IssueSet = Set<string>;

export type IssueRecords = Record<string, Record<string, Issue>>;

export type Issues = {
  files: IssueSet;
  _files: IssueRecords;
  dependencies: IssueRecords;
  devDependencies: IssueRecords;
  optionalPeerDependencies: IssueRecords;
  unlisted: IssueRecords;
  binaries: IssueRecords;
  unresolved: IssueRecords;
  exports: IssueRecords;
  types: IssueRecords;
  nsExports: IssueRecords;
  nsTypes: IssueRecords;
  duplicates: IssueRecords;
  enumMembers: IssueRecords;
  classMembers: IssueRecords;
};

export type IssueType = keyof Issues;

export type SymbolIssueType = Exclude<IssueType, 'files'>;

export type Report = {
  [key in keyof Issues]: boolean;
};

export type Counters = Record<IssueType | 'processed' | 'total', number>;

export type ReporterOptions = {
  report: Report;
  issues: Issues;
  counters: Counters;
  tagHints: TagHints;
  configurationHints: ConfigurationHints;
  isDisableConfigHints: boolean;
  isTreatConfigHintsAsErrors: boolean;
  cwd: string;
  isProduction: boolean;
  isShowProgress: boolean;
  options: string;
  preprocessorOptions: string;
  includedWorkspaces: Workspace[];
  configFilePath?: string;
};

export type Reporter = (options: ReporterOptions) => void;

export type Preprocessor = (options: ReporterOptions) => ReporterOptions;

export type IssueSeverity = 'error' | 'warn' | 'off';

export type Rules = Record<IssueType, IssueSeverity>;

export type ConfigurationHints = Set<ConfigurationHint>;

export type ConfigurationHintType =
  | 'ignoreBinaries'
  | 'ignoreDependencies'
  | 'ignoreUnresolved'
  | 'ignoreWorkspaces'
  | 'entry-redundant'
  | 'project-redundant'
  | 'entry-top-level'
  | 'project-top-level'
  | 'entry-empty'
  | 'project-empty'
  | 'package-entry'
  | 'workspace-unconfigured';

export type ConfigurationHint = {
  type: ConfigurationHintType;
  identifier: string | RegExp;
  filePath?: string;
  workspaceName?: string;
  size?: number;
};

type TagHints = Set<TagHint>;

export type TagHint = {
  type: 'tag';
  filePath: string;
  identifier: string;
  tagName: string;
};
