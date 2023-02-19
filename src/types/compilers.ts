type FileExtension = string;

export type SyncCompilerFn = (source: string) => string;
export type AsyncCompilerFn = (source: string) => Promise<string>;

export type SyncCompilers = Map<FileExtension, SyncCompilerFn>;
export type AsyncCompilers = Map<FileExtension, AsyncCompilerFn>;
