import path from 'node:path';
import { OwnershipEngine } from '@snyk/github-codeowners/dist/lib/ownership';
import type { Issue, ReporterOptions } from '../types';

type OwnedIssue = Issue & { owner: string };

type ExtraReporterOptions = {
  path?: string;
};

const logIssueLine = (owner: string, cwd: string, filePath: string, symbols?: string[]) => {
  console.log(`${owner} ${path.relative(cwd, filePath)}${symbols ? `: ${symbols.join(', ')}` : ''}`);
};

const logIssueGroupResult = (issues: { symbol: string; owner: string }[], cwd: string, title: false | string) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    issues
      .sort((a, b) => (a.owner < b.owner ? -1 : 1))
      .forEach(issue =>
        console.log(issue.owner, issue.symbol.startsWith('/') ? path.relative(cwd, issue.symbol) : issue.symbol)
      );
  } else {
    console.log('Not found');
  }
};

const logIssueGroupResults = (issues: OwnedIssue[], cwd: string, title: false | string) => {
  title && console.log(`--- ${title} (${issues.length})`);
  if (issues.length) {
    const sortedByFilePath = issues.sort((a, b) => (a.owner < b.owner ? -1 : 1));
    sortedByFilePath.forEach(({ filePath, symbols, owner }) => logIssueLine(owner, cwd, filePath, symbols));
  } else {
    console.log('Not found');
  }
};

export default ({ report, issues, cwd, isDev, options }: ReporterOptions) => {
  let opts: ExtraReporterOptions = {};
  try {
    opts = JSON.parse(options);
  } catch (error) {
    console.error(error);
  }
  const codeownersFilePath = path.resolve(opts.path ?? '.github/CODEOWNERS');
  const codeownersEngine = OwnershipEngine.FromCodeownersFile(codeownersFilePath);
  const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;
  const [dependenciesOwner = '[no-owner]'] = codeownersEngine.calcFileOwnership('package.json');
  const fallbackOwner = dependenciesOwner;
  const calcFileOwnership = (filePath: string) =>
    codeownersEngine.calcFileOwnership(path.relative(cwd, filePath))[0] ?? fallbackOwner;

  const toIssueWithOwner = (issues: Record<string, Issue>) => {
    const items = Object.values(issues);
    return { ...items[0], symbols: items.map(i => i.symbol), owner: calcFileOwnership(items[0].filePath) };
  };

  if (report.files) {
    const unreferencedFilesByOwner = Array.from(issues.files).map(filePath => ({
      symbol: filePath,
      owner: calcFileOwnership(filePath),
    }));
    logIssueGroupResult(unreferencedFilesByOwner, cwd, reportMultipleGroups && 'UNUSED FILES');
  }

  if (report.dependencies) {
    const unreferencedDependencies = Array.from(issues.dependencies).map(dependency => ({
      symbol: dependency,
      owner: dependenciesOwner,
    }));
    logIssueGroupResult(unreferencedDependencies, cwd, reportMultipleGroups && 'UNUSED DEPENDENCIES');
  }

  if (report.dependencies && isDev) {
    const unreferencedDevDependencies = Array.from(issues.devDependencies).map(dependency => ({
      symbol: dependency,
      owner: dependenciesOwner,
    }));
    logIssueGroupResult(unreferencedDevDependencies, cwd, 'UNUSED DEV DEPENDENCIES');
  }

  if (report.unlisted) {
    const unreferencedDependencies = Object.values(issues.unresolved).map(toIssueWithOwner);
    logIssueGroupResults(unreferencedDependencies, cwd, reportMultipleGroups && 'UNLISTED DEPENDENCIES');
  }

  if (report.exports) {
    const unreferencedExports = Object.values(issues.exports).map(toIssueWithOwner);
    logIssueGroupResults(unreferencedExports, cwd, reportMultipleGroups && 'UNUSED EXPORTS');
  }

  if (report.nsExports) {
    const unreferencedNsExports = Object.values(issues.nsExports).map(toIssueWithOwner);
    logIssueGroupResults(unreferencedNsExports, cwd, reportMultipleGroups && 'UNUSED EXPORTS IN NAMESPACE');
  }

  if (report.types) {
    const unreferencedTypes = Object.values(issues.types).map(toIssueWithOwner);
    logIssueGroupResults(unreferencedTypes, cwd, reportMultipleGroups && 'UNUSED TYPES');
  }

  if (report.nsTypes) {
    const unreferencedNsTypes = Object.values(issues.nsTypes).map(toIssueWithOwner);
    logIssueGroupResults(unreferencedNsTypes, cwd, reportMultipleGroups && 'UNUSED TYPES IN NAMESPACE');
  }

  if (report.duplicates) {
    const unreferencedDuplicates = Object.values(issues.duplicates)
      .map(issues => Object.values(issues))
      .flat()
      .map(issue => ({ ...issue, owner: calcFileOwnership(issue.filePath) }));
    logIssueGroupResults(unreferencedDuplicates, cwd, reportMultipleGroups && 'DUPLICATE EXPORTS');
  }
};
