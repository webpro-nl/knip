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

export const getIncludedIssueTypes = (
  cliArgs: CLIArguments,
  { include = [], exclude = [], isProduction = false }: Options = {}
) => {
  [...cliArgs.include, ...cliArgs.exclude, ...include, ...exclude].forEach(type => {
    // @ts-expect-error The point is that we're checking for invalid issue types
    if (!ISSUE_TYPES.includes(type)) throw new ConfigurationError(`Invalid issue type: ${type}`);
  });

  if (cliArgs.dependencies) {
    cliArgs.include = [
      ...cliArgs.include,
      'dependencies',
      'optionalPeerDependencies',
      'unlisted',
      'binaries',
      'unresolved',
    ];
  }
  if (cliArgs.exports) {
    const exports = ['exports', 'nsExports', 'classMembers', 'types', 'nsTypes', 'enumMembers', 'duplicates'];
    cliArgs.include = [...cliArgs.include, ...exports];
  }

  // Allow space-separated argument values (--include files,dependencies)
  const normalizedIncludesArg = cliArgs.include.map(value => value.split(',')).flat();
  const normalizedExcludesArg = cliArgs.exclude.map(value => value.split(',')).flat();

  // CLI arguments override local options
  const excludes = exclude.filter(exclude => !normalizedIncludesArg.includes(exclude));
  const includes = include.filter(include => !normalizedExcludesArg.includes(include));

  const _include = [normalizedIncludesArg, includes].flat();
  const _exclude = [normalizedExcludesArg, excludes].flat();

  if (isProduction) {
    // Ignore devDependencies when analyzing production code
    _exclude.push('devDependencies');
  } else {
    // Auto-add (or remove) `devDependencies` when `dependencies` are included (or excluded)
    if (_include.includes('dependencies')) _include.push('devDependencies', 'optionalPeerDependencies');
    if (_exclude.includes('dependencies')) _exclude.push('devDependencies', 'optionalPeerDependencies');
  }

  const included = (_include.length > 0 ? _include : ISSUE_TYPES).filter(group => !_exclude.includes(group));

  return ISSUE_TYPES.reduce((types, group) => ((types[group] = included.includes(group)), types), {} as Report);
};
