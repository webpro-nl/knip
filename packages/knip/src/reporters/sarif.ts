import { ISSUE_TYPE_TITLE } from '../constants.ts';
import type { Entries } from '../types/entries.ts';
import type { Issue, IssueSeverity, IssueType, Report, ReporterOptions } from '../types/issues.ts';
import { toPosix, toRelative } from '../util/path.ts';
import { version } from '../version.ts';
import { flattenIssues, getIssueDescription } from './util/util.ts';

const schema = 'https://docs.oasis-open.org/sarif/sarif/v2.1.0/errata01/os/schemas/sarif-schema-2.1.0.json';

type Level = 'error' | 'warning' | 'note';
type ProblemSeverity = 'error' | 'warning' | 'recommendation';

const getLevel = (severity?: IssueSeverity): Level =>
  severity === 'error' ? 'error' : severity === 'warn' ? 'warning' : 'note';

const getProblemSeverity = (severity?: IssueSeverity): ProblemSeverity =>
  severity === 'error' ? 'error' : severity === 'warn' ? 'warning' : 'recommendation';

const getRuleId = (type: IssueType) => `knip/${type}`;

const getUri = (filePath: string, cwd: string) =>
  toPosix(toRelative(filePath, cwd))
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');

const getLogicalLocation = ({ type, symbol }: Issue) =>
  type === 'files' ? [] : [{ name: symbol, fullyQualifiedName: symbol }];

const getLocation = (issue: Issue, cwd: string) => {
  const { filePath, line, col, symbol } = issue;
  const logicalLocations = getLogicalLocation(issue);
  return {
    physicalLocation: {
      artifactLocation: { uri: getUri(filePath, cwd) },
      ...(line !== undefined && {
        region: {
          startLine: Math.max(line, 1),
          ...(col !== undefined && {
            startColumn: Math.max(col, 1),
            endColumn: Math.max(col, 1) + Math.max(symbol.length, 1),
          }),
        },
      }),
    },
    ...(logicalLocations.length > 0 && { logicalLocations }),
  };
};

const sortByLocation = (a: Issue, b: Issue) =>
  a.filePath.localeCompare(b.filePath) ||
  (a.line ?? 0) - (b.line ?? 0) ||
  (a.col ?? 0) - (b.col ?? 0) ||
  a.symbol.localeCompare(b.symbol);

export default ({ report, issues, cwd }: ReporterOptions) => {
  const groups: { type: IssueType; issues: Issue[] }[] = [];

  for (const [type, isReportType] of Object.entries(report) as Entries<Report>) {
    if (!isReportType) continue;
    const issuesForType = flattenIssues(issues[type]).sort(sortByLocation);
    if (issuesForType.length > 0) groups.push({ type, issues: issuesForType });
  }

  const rules = groups.map(({ type, issues }) => {
    const severity = issues[0].severity;
    const title = ISSUE_TYPE_TITLE[type];
    return {
      id: getRuleId(type),
      name: type,
      shortDescription: { text: title },
      helpUri: 'https://knip.dev/reference/issue-types',
      defaultConfiguration: { level: getLevel(severity) },
      properties: { 'problem.severity': getProblemSeverity(severity) },
    };
  });

  const results = groups.flatMap(({ type, issues }, ruleIndex) =>
    issues.map(issue => ({
      ruleId: getRuleId(type),
      ruleIndex,
      level: getLevel(issue.severity),
      message: { text: getIssueDescription(issue) },
      locations: [getLocation(issue, cwd)],
    }))
  );

  const output = JSON.stringify({
    $schema: schema,
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'knip',
            version,
            semanticVersion: version,
            informationUri: 'https://knip.dev',
            rules,
          },
        },
        results,
      },
    ],
  });

  // See: https://github.com/nodejs/node/issues/6379
  // @ts-expect-error _handle is private
  process.stdout._handle?.setBlocking?.(true);
  process.stdout.write(`${output}\n`);
};
