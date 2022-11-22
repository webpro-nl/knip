import type { IssueType, Report } from '../types/issues.js';

const ISSUE_TYPES: IssueType[] = [
  'files',
  'dependencies',
  'devDependencies',
  'unlisted',
  'exports',
  'types',
  'nsExports',
  'nsTypes',
  'classMembers',
  'enumMembers',
  'duplicates',
];

type Options = {
  isProduction?: boolean;
  isStrict?: boolean;
  include?: string[];
  exclude?: string[];
};

export const resolveIncludedIssueTypes = (
  includeArg: string[],
  excludeArg: string[],
  { include = [], exclude = [], isProduction = false }: Options = {}
) => {
  // Allow space-separated argument values (--include files,dependencies)
  const normalizedIncludesArg = includeArg.map(value => value.split(',')).flat();
  const normalizedExcludesArg = excludeArg.map(value => value.split(',')).flat();

  // CLI arguments override local options
  const excludes = exclude.filter(exclude => !normalizedIncludesArg.includes(exclude));
  const includes = include.filter(include => !normalizedExcludesArg.includes(include));

  const _include = [normalizedIncludesArg, includes].flat();
  const _exclude = [normalizedExcludesArg, excludes].flat();

  if (isProduction) {
    // Ignore exported types and devDependencies when analyzing production code
    _exclude.push('types');
    _exclude.push('nsTypes');
    _exclude.push('enumMembers');
    _exclude.push('devDependencies');
  } else {
    // Auto-add `devDependencies` when `dependencies` are included or excluded
    if (_include.includes('dependencies')) _include.push('devDependencies');
    if (_exclude.includes('dependencies')) _exclude.push('devDependencies');
  }

  const included = (_include.length > 0 ? _include : ISSUE_TYPES).filter(group => !_exclude.includes(group));

  return ISSUE_TYPES.reduce((types, group) => ((types[group] = included.includes(group)), types), {} as Report);
};
