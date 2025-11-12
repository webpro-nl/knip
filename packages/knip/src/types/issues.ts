import type { SYMBOL_TYPE } from '../constants.js';

export type SymbolType = (typeof SYMBOL_TYPE)[keyof typeof SYMBOL_TYPE];

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
  catalog: IssueRecords;
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
  configurationHints: Set<ConfigurationHint>;
  isDisableConfigHints: boolean;
  isTreatConfigHintsAsErrors: boolean;
  cwd: string;
  isProduction: boolean;
  isShowProgress: boolean;
  options: string;
  preprocessorOptions: string;
  includedWorkspaceDirs: string[];
  configFilePath?: string;
  maxShowIssues?: number;
};

export type Reporter = (options: ReporterOptions) => void;

export type Preprocessor = (options: ReporterOptions) => ReporterOptions;

export type IssueSeverity = 'error' | 'warn' | 'off';

export type Rules = Record<IssueType, IssueSeverity>;

export type ConfigurationHints = Map<string, ConfigurationHint>;

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
  | 'top-level-unconfigured'
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
