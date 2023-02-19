export type SymbolType = 'type' | 'interface' | 'enum' | 'function' | 'class' | 'unknown';

export type Issue = {
  type: SymbolIssueType;
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
  cwd: string;
  workingDir: string;
  isProduction: boolean;
  options: string;
};

export type Reporter = (options: ReporterOptions) => void;
