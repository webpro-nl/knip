import micromatch from 'micromatch';
import type { ImportedConfiguration, LocalConfiguration, Configuration, IssueType, Report } from '../types.js';

export const resolveConfig = (
  importedConfiguration: ImportedConfiguration,
  options?: { workingDir?: string; isDev?: boolean }
): LocalConfiguration | undefined => {
  if (!importedConfiguration) return;

  let resolvedConfig = importedConfiguration;
  const { workingDir, isDev } = options ?? {};

  const configKeys = Object.keys(importedConfiguration);

  if (workingDir && !('projectFiles' in importedConfiguration)) {
    const importedConfigKey = configKeys.find(pattern => micromatch.isMatch(workingDir.replace(/\/$/, ''), pattern));
    if (importedConfigKey) {
      resolvedConfig = importedConfiguration[importedConfigKey];
    }
  }

  if (isDev && typeof resolvedConfig.dev === 'object' && 'projectFiles' in resolvedConfig.dev) {
    resolvedConfig = resolvedConfig.dev;
  }

  if (!resolvedConfig.entryFiles || !resolvedConfig.projectFiles) {
    console.info(`Add these properties at root level, or use --dir and match one of: ${configKeys.join(', ')}\n`);
    return;
  }

  resolvedConfig.dev = Boolean(typeof resolvedConfig.dev === 'boolean' ? resolvedConfig.dev : isDev);

  return resolvedConfig as LocalConfiguration;
};

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

export const resolveIncludedIssueTypes = (
  includeArg: string[],
  excludeArg: string[],
  resolvedConfig?: LocalConfiguration
) => {
  // Allow space-separated argument values (--include files,dependencies)
  const normalizedIncludesArg = includeArg.map(value => value.split(',')).flat();
  const normalizedExcludesArg = excludeArg.map(value => value.split(',')).flat();

  // CLI arguments override local options
  const excludes = (resolvedConfig?.exclude ?? []).filter(exclude => !normalizedIncludesArg.includes(exclude));
  const includes = (resolvedConfig?.include ?? []).filter(include => !normalizedExcludesArg.includes(include));

  const include = [normalizedIncludesArg, includes].flat();
  const exclude = [normalizedExcludesArg, excludes].flat();

  include.includes('dependencies') && include.push('devDependencies');
  !resolvedConfig?.dev && exclude.push('devDependencies');

  const included = (include.length > 0 ? include : ISSUE_TYPES).filter(group => !exclude.includes(group));

  return ISSUE_TYPES.reduce((types, group) => ((types[group] = included.includes(group)), types), {} as Report);
};
