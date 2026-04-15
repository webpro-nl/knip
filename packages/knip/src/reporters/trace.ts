import pc from 'picocolors';
import type { GraphExplorer } from '../graph-explorer/explorer.ts';
import type { ExportsTreeNode } from '../graph-explorer/operations/build-exports-tree.ts';
import type { ModuleGraph } from '../types/module-graph.ts';
import type { MainOptions } from '../util/create-options.ts';
import { toRelative } from '../util/path.ts';
import { toRegexOrString } from '../util/regex.ts';
import { Table } from '../util/table.ts';
import { formatTrace, type TraceMemberStatus } from '../util/trace.ts';
import type { WorkspaceFilePathFilter } from '../util/workspace-file-filter.ts';

interface TraceReporterOptions {
  graph: ModuleGraph;
  explorer: GraphExplorer;
  options: MainOptions;
  workspaceFilePathFilter: WorkspaceFilePathFilter;
}

export default ({ graph, explorer, options, workspaceFilePathFilter }: TraceReporterOptions) => {
  if (options.traceDependency) {
    const pattern = toRegexOrString(options.traceDependency);
    const toRel = (path: string) => toRelative(path, options.cwd);
    const table = new Table({ truncateStart: ['filePath'] });
    const seen = new Set<string>();
    for (const [packageName, { imports }] of explorer.getDependencyUsage(pattern)) {
      const filtered = imports.filter(i => workspaceFilePathFilter(i.filePath));
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
    let nodes = explorer.buildExportsTree({ filePath: options.traceFile, identifier: options.traceExport });

    // Fallback: resolve dotted name as namespace member (e.g. Fruits.apple → Fruits)
    if (nodes.length === 0 && options.traceExport?.includes('.')) {
      const nsName = options.traceExport.substring(0, options.traceExport.indexOf('.'));
      nodes = explorer.buildExportsTree({ filePath: options.traceFile, identifier: nsName });
    }
    nodes.sort((a, b) => a.filePath.localeCompare(b.filePath) || a.identifier.localeCompare(b.identifier));
    const toRel = (path: string) => toRelative(path, options.cwd);
    const isReferenced = (node: ExportsTreeNode) => {
      if (explorer.isReferenced(node.filePath, node.identifier, { includeEntryExports: false })[0]) return true;
      if (explorer.hasStrictlyNsReferences(node.filePath, node.identifier)[0]) return true;
      return !!graph.get(node.filePath)?.exports.get(node.identifier)?.hasRefsInFile;
    };
    for (const node of nodes) {
      const exp = graph.get(node.filePath)?.exports.get(node.identifier);
      let memberStatuses: TraceMemberStatus[] | undefined;
      if (exp && exp.members.length > 0) {
        memberStatuses = [];
        for (const m of exp.members) {
          const id = `${node.identifier}.${m.identifier}`;
          const referenced =
            m.hasRefsInFile || explorer.isReferenced(node.filePath, id, { includeEntryExports: true })[0];
          memberStatuses.push({ identifier: m.identifier, referenced });
        }
      }
      console.log(formatTrace(node, toRel, isReferenced(node), memberStatuses));
    }
  }
};
