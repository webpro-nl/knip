/* oxlint-disable no-console */
import type { Issue, IssueSymbol, ReporterOptions } from '../types/issues.ts';
import st from '../util/colors.ts';
import { relative } from '../util/path.ts';
import { flattenIssues, getColoredTitle, getIssueTypeTitle } from './util/util.ts';

const kindLabels: Record<string, string> = {
  import: 'import',
  importAs: 'aliased import',
  importNS: 'namespace import',
  reExport: 're-export',
  reExportAs: 'aliased re-export',
  reExportNS: 'namespace re-export',
  reExportStar: 'star re-export',
  dynamicImport: 'dynamic import',
  sideEffectImport: 'side-effect import',
};

const formatEdge = (edge: IssueSymbol) => {
  const kind = kindLabels[edge.kind ?? 'import'] ?? edge.kind ?? 'import';
  const specifier = edge.specifier ? `${st.dim(' ')}${st.cyanBright(edge.specifier)}` : '';
  return `${st.cyan(kind)}${specifier}${st.dim(' → ')}`;
};

const getLocation = (file: IssueSymbol) => {
  const location = file.line === undefined ? '' : `:${file.line}${file.col === undefined ? '' : `:${file.col}`}`;
  return `${file.symbol}${location}`;
};

const formatFile = (file: IssueSymbol) => st.white(getLocation(file));

const getIssueRootLocation = (issue: Issue, cwd: string) => {
  const root = issue.symbols?.[0];
  return root ? getLocation(root) : relative(cwd, issue.filePath);
};

const sortByFilePath = (cwd: string) => (a: Issue, b: Issue) => {
  const aFilePath = relative(cwd, a.filePath);
  const bFilePath = relative(cwd, b.filePath);
  const filePath = aFilePath.localeCompare(bFilePath);
  if (filePath !== 0) return filePath;
  const rootLocation = getIssueRootLocation(a, cwd).localeCompare(getIssueRootLocation(b, cwd));
  return rootLocation === 0 ? a.symbol.localeCompare(b.symbol) : rootLocation;
};

export default ({ cwd, issues, isShowProgress }: ReporterOptions) => {
  const cycles = flattenIssues(issues.cycles).sort(sortByFilePath(cwd));

  if (cycles.length === 0) {
    if (isShowProgress) console.log('✂️  No circular dependencies found.');
    return;
  }

  console.log(getColoredTitle(getIssueTypeTitle('cycles'), cycles.length));

  const rootCounts = new Map<string, number>();
  for (const issue of cycles) {
    const files = issue.symbols ?? issue.symbol.split(' → ').map(symbol => ({ symbol }));
    const root = files[0];
    if (root) {
      const rootLocation = getLocation(root);
      rootCounts.set(rootLocation, (rootCounts.get(rootLocation) ?? 0) + 1);
    }
  }

  let previousRoot = '';

  for (const issue of cycles) {
    const files = issue.symbols ?? issue.symbol.split(' → ').map(symbol => ({ symbol }));
    const root = files[0];
    if (!root) continue;

    const rootLocation = getLocation(root);
    if (rootLocation !== previousRoot) {
      const count = rootCounts.get(rootLocation) ?? 0;
      const countLabel = count > 1 ? st.dim(` (${count} cycles)`) : '';
      console.log(`\n${formatFile(root)}${countLabel}`);
      previousRoot = rootLocation;
    } else {
      console.log('');
    }
    for (let depth = 1; depth <= files.length; depth++) {
      const isClose = depth === files.length;
      const edge = files[depth - 1];
      const file = isClose ? root : files[depth];
      const connector = st.dim(`${'    '.repeat(depth - 1)}└── `);
      console.log(`${connector}${formatEdge(edge)}${formatFile(file)}${isClose ? st.dim(' ↩') : ''}`);
    }
  }
};
