import micromatch from 'micromatch';
import type { ImportedConfiguration, LocalConfiguration, Configuration, IssueGroup } from '../types';

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

  return resolvedConfig as LocalConfiguration;
};

export const resolveIncludedIssueGroups = (
  includeArg: string[],
  excludeArg: string[],
  resolvedConfig?: LocalConfiguration
) => {
  const groups: IssueGroup[] = [
    'files',
    'dependencies',
    'unlisted',
    'exports',
    'types',
    'nsExports',
    'nsTypes',
    'duplicates',
  ];
  const include = [includeArg, resolvedConfig?.include ?? []]
    .flat()
    .map(value => value.split(','))
    .flat() as IssueGroup[];
  const exclude = [excludeArg, resolvedConfig?.exclude ?? []]
    .flat()
    .map(value => value.split(','))
    .flat() as IssueGroup[];
  const includes = (include.length > 0 ? include : groups).filter((group: IssueGroup) => !exclude.includes(group));
  return groups.reduce((r, group) => ((r[group] = includes.includes(group)), r), {} as Configuration['report']);
};
