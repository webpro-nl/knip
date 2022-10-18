import { SourceFile } from 'ts-morph';

type SymbolType = 'type' | 'interface' | 'enum';

type UnusedFileIssues = Set<string>;
type UnusedExportIssues = Record<string, Record<string, Issue>>;
type UnresolvedDependencyIssues = Record<string, Record<string, Issue>>;
type UnusedDependencyIssues = Set<string>;

export type Issue = { filePath: string; symbol: string; symbols?: string[]; symbolType?: SymbolType };

export type Issues = {
  files: UnusedFileIssues;
  dependencies: UnusedDependencyIssues;
  devDependencies: UnusedDependencyIssues;
  unresolved: UnresolvedDependencyIssues;
  exports: UnusedExportIssues;
  types: UnusedExportIssues;
  nsExports: UnusedExportIssues;
  nsTypes: UnusedExportIssues;
  duplicates: UnusedExportIssues;
};

type IssueType = keyof Issues;
export type ProjectIssueType = Extract<IssueType, 'files' | 'dependencies' | 'devDependencies'>;
export type SymbolIssueType = Exclude<IssueType, ProjectIssueType>;

// Slightly different issue groups for better(?) UX
export type IssueGroup =
  | 'files'
  | 'dependencies'
  | 'unlisted'
  | 'exports'
  | 'nsExports'
  | 'types'
  | 'nsTypes'
  | 'duplicates';

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
  jsDoc: string[];
  debug: {
    isEnabled: boolean;
    level: number;
  };
};

export type Report = {
  [key in IssueGroup]: boolean;
};

export type Configuration = {
  workingDir: string;
  report: Report;
  projectFiles: SourceFile[];
  productionFiles: SourceFile[];
  entryFiles: SourceFile[];
  isIncludeEntryFiles: boolean;
  dependencies: string[];
  peerDependencies: string[];
  optionalDependencies: string[];
  devDependencies: string[];
  isDev: boolean;
  tsConfigPaths: string[];
  isShowProgress: boolean;
  jsDocOptions: {
    isReadPublicTag: boolean;
  };
  debug: {
    isEnabled: boolean;
    level: number;
  };
};

export type Counters = Record<IssueType | 'processed' | 'total', number>;

export type ReporterOptions = {
  report: Report;
  issues: Issues;
  cwd: string;
  workingDir: string;
  isDev: boolean;
  options: string;
};

export type Reporter = (options: ReporterOptions) => void;
