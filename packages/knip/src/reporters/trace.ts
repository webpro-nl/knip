import pc from 'picocolors';
import type { GraphExplorer } from '../graph-explorer/explorer.js';
import type { ExportsTreeNode } from '../graph-explorer/operations/build-exports-tree.js';
import type { Export, ExportMember, ModuleGraph } from '../types/module-graph.js';
import type { MainOptions } from '../util/create-options.js';
import { join, toRelative } from '../util/path.js';
import { toRegexOrString } from '../util/regex.js';
import { Table } from '../util/table.js';
import { formatTrace } from '../util/trace.js';

interface TraceReporterOptions {
  graph: ModuleGraph;
  explorer: GraphExplorer;
  options: MainOptions;
  isExportReferencedInFile: (exportedItem: Export | ExportMember) => boolean;
}

export default ({ graph, explorer, options, isExportReferencedInFile }: TraceReporterOptions) => {
  if (options.traceDependency) {
    const pattern = toRegexOrString(options.traceDependency);
    const workspaceDir = options.workspace ? join(options.cwd, options.workspace) : undefined;
    const toRel = (path: string) => toRelative(path, options.cwd);
    const table = new Table({ truncateStart: ['filePath'] });
    const seen = new Set<string>();
    for (const [packageName, { imports }] of explorer.getDependencyUsage(pattern)) {
      const filtered = workspaceDir ? imports.filter(i => i.filePath.startsWith(workspaceDir)) : imports;
      filtered.sort((a, b) => a.filePath.localeCompare(b.filePath) || (a.line ?? 0) - (b.line ?? 0));
      for (const _import of filtered) {
        const pos = _import.line ? `:${_import.line}:${_import.col}` : '';
        const key = `${_import.filePath}${pos}:${packageName}`;
        if (seen.has(key)) continue;
        seen.add(key);
        table.row();
        table.cell('filePath', pc.whiteBright(`${toRel(_import.filePath)}${pos}`));
        table.cell('package', pc.cyanBright(packageName));
      }
    }
    for (const line of table.toRows()) console.log(line);
  } else {
    const nodes = explorer.buildExportsTree({ filePath: options.traceFile, identifier: options.traceExport });
    nodes.sort((a, b) => a.filePath.localeCompare(b.filePath) || a.identifier.localeCompare(b.identifier));
    const toRel = (path: string) => toRelative(path, options.cwd);
    const isReferenced = (node: ExportsTreeNode) => {
      if (explorer.isReferenced(node.filePath, node.identifier, { includeEntryExports: false })[0]) return true;
      if (explorer.hasStrictlyNsReferences(node.filePath, node.identifier)[0]) return true;
      const exportItem = graph.get(node.filePath)?.exports.get(node.identifier);
      return exportItem ? isExportReferencedInFile(exportItem) : false;
    };
    for (const node of nodes) console.log(formatTrace(node, toRel, isReferenced(node)));
  }
};
