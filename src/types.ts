type LocalConfiguration = {
  entryFiles: string[];
  filePatterns: string[];
};

export type Configuration = LocalConfiguration & {
  cwd: string;
  isOnlyFiles: boolean;
  isOnlyExports: boolean;
  isOnlyTypes: boolean;
  isOnlyDuplicates: boolean;
  isFindUnusedFiles: boolean;
  isFindUnusedExports: boolean;
  isFindUnusedTypes: boolean;
  isFindDuplicateExports: boolean;
  isFollowSymbols: boolean;
  isShowProgress: boolean;
};

export type ImportedConfiguration = LocalConfiguration | Record<string, LocalConfiguration>;

type FilePath = string;
export type SymbolType = 'type' | 'interface' | 'enum';

type UnusedFileIssues = Set<FilePath>;
type UnusedExportIssues = Record<string, Record<string, Issue>>;
type UnusedTypeIssues = Record<string, Record<string, Issue>>;
type DuplicateExportIssues = Record<string, Record<string, Issue>>;

export type Issue = { filePath: FilePath; symbol: string; symbols?: string[]; symbolType?: SymbolType };

export type Issues = {
  file: UnusedFileIssues;
  export: UnusedExportIssues;
  type: UnusedTypeIssues;
  duplicate: DuplicateExportIssues;
};
