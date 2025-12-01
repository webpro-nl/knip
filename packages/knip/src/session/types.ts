import type { RE_EXPORT_KIND } from '../graph-explorer/constants.js';
import type { Import, SourceLocation } from '../types/module-graph.js';

interface SymbolRef extends SourceLocation {
  filePath: string;
  identifier: string;
}

export interface InternalImport extends SymbolRef {
  importLine: number;
  importCol: number;
}

export interface Export extends SymbolRef {
  importLocations: SourceLocation[];
  entryPaths: Set<string>;
  exports: Export[] | undefined;
}

export interface ContentionDetails {
  branching: string[];
  conflict: string[];
}

export interface FileMetrics {
  imports: number;
  exports: number;
  cycles: number;
  contention: number;
}

export interface File {
  exports: Export[];
  internalImports: InternalImport[];
  cycles: Cycle[];
  contention: Record<string, ContentionDetails>;
  metrics: FileMetrics;
}

export type ImportLookup = Map<string, Map<string, Import[]>>;

export type Cycle = string[];

export type ReExportKind = (typeof RE_EXPORT_KIND)[keyof typeof RE_EXPORT_KIND];
