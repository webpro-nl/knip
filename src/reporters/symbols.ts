import type { Issue, ReporterOptions } from '../types';
import { relative } from '../util/path';

const TRUNCATE_WIDTH = 40;

const logIssueLine = (issue: Issue, maxWidth: number) => {
  const symbols = issue.symbols ? issue.symbols.join(', ') : issue.symbol;
  const truncatedSymbol = symbols.length > maxWidth ? symbols.slice(0, maxWidth - 3) + '...' : symbols;
  const filePath = relative(issue.filePath);
  console.log(`${truncatedSymbol.padEnd(maxWidth + 2)}${issue.symbolType?.padEnd(11) || ''}${filePath}`);
};

const logIssueSet = (issues: string[], title: false | string) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    issues.sort().forEach(value => console.log(value.startsWith('/') ? relative(value) : value));
  } else {
    console.log('Not found');
  }
};

const logIssueRecord = (issues: Issue[], title: false | string, isTruncate = false) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    const sortedByFilePath = issues.sort((a, b) => (a.filePath > b.filePath ? 1 : -1));
    const maxWidth = isTruncate ? TRUNCATE_WIDTH : issues.reduce((max, issue) => Math.max(issue.symbol.length, max), 0);
    sortedByFilePath.forEach(issue => logIssueLine(issue, maxWidth));
  } else {
    console.log('Not found');
  }
};

export default ({ report, issues }: ReporterOptions) => {
  const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;

  if (report.files) {
    const unreferencedFiles = Array.from(issues.files);
    logIssueGroupResult(unreferencedFiles, workingDir, reportMultipleGroups && 'UNUSED FILES');
  }

  if (report.dependencies) {
    const unreferencedDependencies = Array.from(issues.dependencies);
    logIssueGroupResult(unreferencedDependencies, workingDir, reportMultipleGroups && 'UNUSED DEPENDENCIES');
  }

  if (report.dependencies && isDev) {
    const unreferencedDevDependencies = Array.from(issues.devDependencies);
    logIssueGroupResult(unreferencedDevDependencies, workingDir, 'UNUSED DEV DEPENDENCIES');
  }

  if (report.unlisted) {
    const unresolvedDependencies = Object.values(issues.unresolved).map(Object.values).flat();
    logIssueGroupResults(unresolvedDependencies, workingDir, reportMultipleGroups && 'UNLISTED DEPENDENCIES');
  }

  if (report.exports) {
    const unreferencedExports = Object.values(issues.exports).map(Object.values).flat();
    logIssueGroupResults(unreferencedExports, workingDir, reportMultipleGroups && 'UNUSED EXPORTS');
  }

  if (report.nsExports) {
    const unreferencedNsExports = Object.values(issues.nsExports).map(Object.values).flat();
    logIssueGroupResults(unreferencedNsExports, workingDir, reportMultipleGroups && 'UNUSED EXPORTS IN NAMESPACE');
  }

  if (report.types) {
    const unreferencedTypes = Object.values(issues.types).map(Object.values).flat();
    logIssueGroupResults(unreferencedTypes, workingDir, reportMultipleGroups && 'UNUSED TYPES');
  }

  if (report.nsTypes) {
    const unreferencedNsTypes = Object.values(issues.nsTypes).map(Object.values).flat();
    logIssueGroupResults(unreferencedNsTypes, workingDir, reportMultipleGroups && 'UNUSED TYPES IN NAMESPACE');
  }

  if (report.duplicates) {
    const unreferencedDuplicates = Object.values(issues.duplicates).map(Object.values).flat();
    logIssueGroupResults(unreferencedDuplicates, workingDir, reportMultipleGroups && 'DUPLICATE EXPORTS', true);
  }
};
