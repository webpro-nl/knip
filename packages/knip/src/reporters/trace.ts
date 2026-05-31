import type { GraphExplorer } from '../graph-explorer/explorer.ts';
import type { ExportsTreeNode } from '../graph-explorer/operations/build-exports-tree.ts';
import type { Issues } from '../types/issues.ts';
import type { ModuleGraph } from '../types/module-graph.ts';
import st from '../util/colors.ts';
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
  issues: Issues;
}

export default ({ graph, explorer, options, workspaceFilePathFilter, issues }: TraceReporterOptions) => {
  if (options.traceDependency) {
    const pattern = toRegexOrString(options.traceDependency);
    const toRel = (path: string) => toRelative(path, options.cwd);
    const table = new Table({ truncate: { filePath: 'start' } });
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
        table.cell('filePath', st.whiteBright(`${toRel(_import.filePath)}${pos}`));
        table.cell('package', st.cyanBright(packageName));
      }
    }
    const rows = table.toRows();
    if (rows.length === 0) console.log(`No imports found matching ${st.cyanBright(options.traceDependency)}`);
    else for (const line of rows) console.log(line);
  } else {
    let nodes = explorer.buildExportsTree({ filePath: options.traceFile, identifier: options.traceExport });

    // Fallback: resolve dotted name as namespace member (e.g. Fruits.apple → Fruits)
    if (nodes.length === 0 && options.traceExport?.includes('.')) {
      const nsName = options.traceExport.substring(0, options.traceExport.indexOf('.'));
      nodes = explorer.buildExportsTree({ filePath: options.traceFile, identifier: nsName });
    }

    if (nodes.length === 0 && options.traceExport) {
      const query = options.traceExport;
      const member = query.slice(query.lastIndexOf('.') + 1);
      const seen = new Set<string>();
      for (const [filePath, file] of graph) {
        if (options.traceFile && filePath !== options.traceFile) continue;
        for (const [exportId, exp] of file.exports) {
          const key = `${filePath}:${exportId}`;
          if (seen.has(key)) continue;
          if (
            exp.members.some(
              m => m.identifier === query || m.identifier === member || m.identifier.endsWith(`.${member}`)
            )
          ) {
            seen.add(key);
            nodes.push(...explorer.buildExportsTree({ filePath, identifier: exportId }));
          }
        }
      }
    }

    nodes.sort((a, b) => a.filePath.localeCompare(b.filePath) || a.identifier.localeCompare(b.identifier));
    const toRel = (path: string) => toRelative(path, options.cwd);

    if (nodes.length === 0) {
      if (options.traceFile && !graph.has(options.traceFile)) {
        console.log(`File not found in module graph: ${toRel(options.traceFile)}`);
      } else {
        const what = options.traceExport ? `export ${st.cyanBright(options.traceExport)}` : 'exports';
        const where = options.traceFile ? ` in ${toRel(options.traceFile)}` : '';
        console.log(`No ${what} found${where}`);
      }
      return;
    }

    const reportedExports = new Set<string>();
    for (const type of ['exports', 'types', 'nsExports', 'nsTypes'] as const)
      for (const byFile of Object.values(issues[type]))
        for (const issue of Object.values(byFile)) reportedExports.add(`${issue.filePath}:${issue.symbol}`);

    const reportedMembers = new Set<string>();
    for (const type of ['enumMembers', 'namespaceMembers'] as const)
      for (const byFile of Object.values(issues[type]))
        for (const issue of Object.values(byFile))
          reportedMembers.add(`${issue.filePath}:${issue.parentSymbol}.${issue.symbol}`);

    const isReferenced = (node: ExportsTreeNode) => !reportedExports.has(`${node.filePath}:${node.identifier}`);

    for (const node of nodes) {
      const exp = graph.get(node.filePath)?.exports.get(node.identifier);
      let memberStatuses: TraceMemberStatus[] | undefined;
      if (exp && exp.members.length > 0) {
        memberStatuses = [];
        for (const m of exp.members) {
          const referenced = !reportedMembers.has(`${node.filePath}:${node.identifier}.${m.identifier}`);
          memberStatuses.push({ identifier: m.identifier, referenced });
        }
      }
      console.log(formatTrace(node, toRel, isReferenced(node), memberStatuses));
    }
  }
};
