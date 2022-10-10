import micromatch from 'micromatch';
import type { ImportedConfiguration, LocalConfiguration, Configuration, IssueType, IssueGroup } from '../types';

export const resolveConfig = (importedConfiguration: ImportedConfiguration, cwdArg?: string) => {
  const configKeys = Object.keys(importedConfiguration);
  if (cwdArg && !('projectFiles' in importedConfiguration)) {
    const importedConfigKey = configKeys.find(pattern => micromatch.isMatch(cwdArg.replace(/\/$/, ''), pattern));
    if (importedConfigKey) {
      return importedConfiguration[importedConfigKey];
    }
  }
  if (!cwdArg && (!importedConfiguration.entryFiles || !importedConfiguration.projectFiles)) {
    console.error('Unable to find `entryFiles` and/or `projectFiles` in configuration.');
    console.info(`Add it at root level, or use --cwd and match one of: ${configKeys.join(', ')}\n`);
    return;
  }
  return importedConfiguration as Configuration;
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
