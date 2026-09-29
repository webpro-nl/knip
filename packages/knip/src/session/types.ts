import type { RE_EXPORT_KIND } from '../graph-explorer/constants.ts';
import type { Import, Position } from '../types/module-graph.ts';

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

export type ContentionKind = 'ambiguous' | 'shadowed' | 'converged';

export interface ContentionOrigin {
  /** Defining module. A bare package specifier for an external origin. */
  filePath: string;
  /** Local binding in filePath, or '*' for an `export * as` target. */
  identifier: string;
  /** Position of the export entry in filePath. Absent for '*' and non-graph origins. */
  line?: number;
  col?: number;
}

export interface ContentionSite {
  kind: ContentionKind;
  /** File whose export statements combine the paths. */
  filePath: string;
  /** Exported name at filePath; differs from the described name after `export { a as b }`. */
  identifier: string;
  line?: number;
  col?: number;
  /** ambiguous: competing origins. shadowed: hidden origins. converged: the single origin. */
  origins: ContentionOrigin[];
  /** shadowed only: the binding selected by the explicit export. */
  winner?: ContentionOrigin;
  /** Direct sources at filePath that delivered the origins, or hid the candidates. */
  sources: string[];
}

export interface ContentionDetails {
  /** Legacy summary: file paths of converged sites. */
  branching: string[];
  /** Legacy summary: file paths of origins and winners of ambiguous and shadowed sites. */
  conflict: string[];
  /** Own site first when the described file has one, then by severity, then by path. */
  sites: ContentionSite[];
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
