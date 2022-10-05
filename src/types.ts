type LocalConfiguration = {
  entryFiles: string[];
  filePatterns: string[];
};

export type Configuration = LocalConfiguration & {
  cwd: string;
  isShowProgress: boolean;
  isFindUnusedFiles?: boolean;
  isFindUnusedExports?: boolean;
  isFindUnusedTypes?: boolean;
  isFindDuplicateExports?: boolean;
  isFollowSymbols?: boolean;
};

export type ImportedConfiguration = LocalConfiguration | Record<string, LocalConfiguration>;

type FilePath = string;
type Type = 'type' | 'interface' | 'enum';

type UnusedFileIssue = { filePath: FilePath; symbol: string };
type UnusedExportIssue = { filePath: FilePath; symbol: string };
type UnusedTypeIssue = { filePath: FilePath; symbol: string; type: Type };
type DuplicateExportIssue = { filePath: FilePath; symbol: string; symbols: string[] };

type UnusedFileIssues = Map<FilePath, UnusedFileIssue>;
type UnusedExportIssues = Map<string, UnusedExportIssue>;
type UnusedTypeIssues = Map<string, UnusedTypeIssue>;
type DuplicateExportIssues = Map<string, DuplicateExportIssue>;

export type Issue = UnusedFileIssue | UnusedExportIssue | UnusedTypeIssue | DuplicateExportIssue;

export type Issues = {
  file: UnusedFileIssues;
  export: UnusedExportIssues;
  type: UnusedTypeIssues;
  duplicate: DuplicateExportIssues;
};
