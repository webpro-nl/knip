import path from 'node:path';
import type { Issue, ReporterOptions } from '../types';

const logIssueLine = ({ issue, workingDir, padding }: { issue: Issue; workingDir: string; padding: number }) => {
  const symbols = issue.symbols ? issue.symbols.join(', ') : issue.symbol;
  console.log(
    `${symbols.padEnd(padding + 2)}${issue.symbolType?.padEnd(11) || ''}${path.relative(workingDir, issue.filePath)}`
  );
};

const logIssueGroupResult = (issues: string[], workingDir: string, title: false | string) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    issues.sort().forEach(value => console.log(value.startsWith('/') ? path.relative(workingDir, value) : value));
  } else {
    console.log('Not found');
  }
};

const logIssueGroupResults = (issues: Issue[], workingDir: string, title: false | string) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    const sortedByFilePath = issues.sort((a, b) => (a.filePath > b.filePath ? 1 : -1));
    const padding = [...issues].sort((a, b) => b.symbol.length - a.symbol.length)[0].symbol.length;
    sortedByFilePath.forEach(issue => logIssueLine({ issue, workingDir, padding }));
  } else {
    console.log('Not found');
  }
};

export default ({ report, issues, workingDir, isDev }: ReporterOptions) => {
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
    logIssueGroupResults(unreferencedDuplicates, workingDir, reportMultipleGroups && 'DUPLICATE EXPORTS');
  }
};
