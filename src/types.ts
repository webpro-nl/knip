import { SourceFile } from 'ts-morph';

type SymbolType = 'type' | 'interface' | 'enum';

export type Issue = {
  filePath: string;
  symbol: string;
  symbols?: string[];
  symbolType?: SymbolType;
  parentSymbol?: string;
};
export type IssueSet = Set<string>;
export type IssueRecords = Record<string, Record<string, Issue>>;

export type Issues = {
  files: IssueSet;
  dependencies: IssueRecords;
  devDependencies: IssueRecords;
  unlisted: IssueRecords;
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

type BaseLocalConfiguration = {
  entryFiles: string[];
  projectFiles: string[];
};

export type LocalConfiguration = BaseLocalConfiguration & {
  dev?: boolean | BaseLocalConfiguration;
  include?: string[];
  exclude?: string[];
};

export type ImportedConfiguration = LocalConfiguration | Record<string, LocalConfiguration>;

export type UnresolvedConfiguration = {
  cwd: string;
  workingDir: string;
  configFilePath?: string;
  tsConfigFilePath?: string;
  include: string[];
  exclude: string[];
  ignore: string[];
  gitignore: boolean;
  isIncludeEntryFiles: boolean;
  isDev: boolean;
  isShowProgress: boolean;
  debug: {
    isEnabled: boolean;
    level: number;
  };
};

export type Configuration = {
  workingDir: string;
  report: Report;
  projectFiles: SourceFile[];
  productionFiles: SourceFile[];
  entryFiles: SourceFile[];
  isIncludeEntryFiles: boolean;
  manifestPath: string;
  dependencies: string[];
  peerDependencies: string[];
  optionalDependencies: string[];
  devDependencies: string[];
  isDev: boolean;
  tsConfigPathGlobs: string[];
  isShowProgress: boolean;
  debug: {
    isEnabled: boolean;
    level: number;
  };
};

export type Counters = Record<IssueType | 'processed' | 'total', number>;

/**
 * @public
 */
export type ReporterOptions = {
  report: Report;
  issues: Issues;
  cwd: string;
  workingDir: string;
  isDev: boolean;
  options: string;
};

/**
 * @public
 */
export type Reporter = (options: ReporterOptions) => void;
