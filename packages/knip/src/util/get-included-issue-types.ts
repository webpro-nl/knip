import { ISSUE_TYPES } from '../constants.js';
import type { Report } from '../types/issues.js';
import { ConfigurationError } from './errors.js';

type GetIncludedIssueTypesOptions = {
  isProduction?: boolean;
  include: string[];
  exclude: string[];
  includeOverrides?: string[];
  excludeOverrides?: string[];
};

/** @internal */
export const defaultExcludedIssueTypes = ['classMembers', 'nsExports', 'nsTypes'];
const defaultIssueTypes = ISSUE_TYPES.filter(type => !defaultExcludedIssueTypes.includes(type));

const normalize = (values: string[]) => values.flatMap(value => value.split(','));

export const shorthandDeps = ['dependencies', 'unlisted', 'binaries', 'unresolved', 'catalog'];
export const shorthandExports = ['exports', 'types', 'enumMembers', 'duplicates'];
export const shorthandFiles = ['files'];

export const getIncludedIssueTypes = (options: GetIncludedIssueTypesOptions) => {
  // Allow space-separated argument values (--include files,dependencies)
  const incl = normalize(options.includeOverrides ?? []);
  const excl = normalize(options.excludeOverrides ?? []);

  // Naming is hard...
  for (const type of [...incl, ...excl, ...options.include, ...options.exclude]) {
    // @ts-expect-error The point is that we're checking for invalid issue types
    if (!ISSUE_TYPES.includes(type)) throw new ConfigurationError(`Invalid issue type: ${type}`);
  }

  // CLI arguments override local options
  const excludes = options.exclude.filter(exclude => !incl.includes(exclude));
  const includes = options.include.filter(include => !excl.includes(include));

  const _include = [...incl, ...includes];
  const _exclude = [...excl, ...excludes];

  if (options.isProduction) {
    // Ignore devDependencies when analyzing production code
    _exclude.push('devDependencies');
    _exclude.push('catalog');
  } else {
    // Auto-add (or remove) `devDependencies` when `dependencies` are included (or excluded)
    if (_include.includes('dependencies')) _include.push('devDependencies', 'optionalPeerDependencies');
    if (_exclude.includes('dependencies')) _exclude.push('devDependencies', 'optionalPeerDependencies');
  }

  const included = (
    _include.length > 0
      ? _include.some(type => !defaultExcludedIssueTypes.includes(type))
        ? _include
        : [..._include, ...defaultIssueTypes]
      : defaultIssueTypes
  ).filter(group => !_exclude.includes(group));

  return Object.fromEntries(ISSUE_TYPES.map(group => [group, included.includes(group)])) as Report;
};
