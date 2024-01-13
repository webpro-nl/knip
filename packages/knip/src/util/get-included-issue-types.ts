import { ISSUE_TYPES } from '../constants.js';
import { ConfigurationError } from './errors.js';
import type { Report } from '../types/issues.js';

type CLIArguments = {
  include: string[];
  exclude: string[];
  dependencies: boolean;
  exports: boolean;
};

type Options = {
  isProduction?: boolean;
  include?: string[];
  exclude?: string[];
  dependencies?: boolean;
  exports?: boolean;
};

const defaultExcludedIssueTypes = ['classMembers'];
const defaultIssueTypes = ISSUE_TYPES.filter(type => !defaultExcludedIssueTypes.includes(type));

const normalize = (values: string[]) => values.map(value => value.split(',')).flat();

export const getIncludedIssueTypes = (
  cliArgs: CLIArguments,
  { include = [], exclude = [], isProduction = false }: Options = {}
) => {
  // Allow space-separated argument values (--include files,dependencies)
  let incl = normalize(cliArgs.include);
  let excl = normalize(cliArgs.exclude);

  // Naming is hard...
  [...incl, ...excl, ...include, ...exclude].forEach(type => {
    // @ts-expect-error The point is that we're checking for invalid issue types
    if (!ISSUE_TYPES.includes(type)) throw new ConfigurationError(`Invalid issue type: ${type}`);
  });

  // CLI arguments override local options
  const excludes = exclude.filter(exclude => !incl.includes(exclude));
  const includes = include.filter(include => !excl.includes(include));

  if (cliArgs.dependencies) {
    incl = [...incl, 'dependencies', 'optionalPeerDependencies', 'unlisted', 'binaries', 'unresolved'];
  }
  if (cliArgs.exports) {
    const exports = ['exports', 'nsExports', 'classMembers', 'types', 'nsTypes', 'enumMembers', 'duplicates'];
    incl = [...incl, ...exports];
  }

  const _include = [...incl, ...includes];
  const _exclude = [...excl, ...excludes];

  if (isProduction) {
    // Ignore devDependencies when analyzing production code
    _exclude.push('devDependencies');
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

  return ISSUE_TYPES.reduce((types, group) => ((types[group] = included.includes(group)), types), {} as Report);
};
