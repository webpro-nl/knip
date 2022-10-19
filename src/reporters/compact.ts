import type { Issue, ReporterOptions } from '../types';
import { relative } from '../util/path';

const logIssueLine = (filePath: string, symbols?: string[]) => {
  console.log(`${relative(filePath)}${symbols ? `: ${symbols.join(', ')}` : ''}`);
};

const logIssueSet = (issues: string[], title: false | string) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    issues.sort().forEach(value => console.log(value.startsWith('/') ? relative(value) : value));
  } else {
    console.log('Not found');
  }
};

const logIssueRecord = (issues: Issue[], title: false | string) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    const sortedByFilePath = issues.sort((a, b) => (a.filePath > b.filePath ? 1 : -1));
    sortedByFilePath.forEach(({ filePath, symbols }) => logIssueLine(filePath, symbols));
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
    const unreferencedDependencies = Object.values(issues.unresolved).map(issues => {
      const items = Object.values(issues);
      return { ...items[0], symbols: items.map(i => i.symbol) };
    });
    logIssueGroupResults(unreferencedDependencies, workingDir, reportMultipleGroups && 'UNLISTED DEPENDENCIES');
  }

  if (report.exports) {
    const unreferencedExports = Object.values(issues.exports).map(issues => {
      const items = Object.values(issues);
      return { ...items[0], symbols: items.map(i => i.symbol) };
    });
    logIssueGroupResults(unreferencedExports, workingDir, reportMultipleGroups && 'UNUSED EXPORTS');
  }

  if (report.nsExports) {
    const unreferencedNsExports = Object.values(issues.nsExports).map(issues => {
      const items = Object.values(issues);
      return { ...items[0], symbols: items.map(i => i.symbol) };
    });
    logIssueGroupResults(unreferencedNsExports, workingDir, reportMultipleGroups && 'UNUSED EXPORTS IN NAMESPACE');
  }

  if (report.types) {
    const unreferencedTypes = Object.values(issues.types).map(issues => {
      const items = Object.values(issues);
      return { ...items[0], symbols: items.map(i => i.symbol) };
    });
    logIssueGroupResults(unreferencedTypes, workingDir, reportMultipleGroups && 'UNUSED TYPES');
  }

  if (report.nsTypes) {
    const unreferencedNsTypes = Object.values(issues.nsTypes).map(issues => {
      const items = Object.values(issues);
      return { ...items[0], symbols: items.map(i => i.symbol) };
    });
    logIssueGroupResults(unreferencedNsTypes, workingDir, reportMultipleGroups && 'UNUSED TYPES IN NAMESPACE');
  }

  if (report.duplicates) {
    const unreferencedDuplicates = Object.values(issues.duplicates)
      .map(issues => Object.values(issues))
      .flat();
    logIssueGroupResults(unreferencedDuplicates, workingDir, reportMultipleGroups && 'DUPLICATE EXPORTS');
  }
};
