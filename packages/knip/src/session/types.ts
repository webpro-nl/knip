import type { RE_EXPORT_KIND } from '../graph-explorer/constants.js';
import type { Import, Position } from '../types/module-graph.js';

export interface SourceLocation extends Position {
  filePath: string;
  identifier: string;
}

export interface InternalImport extends SourceLocation {
  importLine: number;
  importCol: number;
}

export interface Export extends SourceLocation {
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
