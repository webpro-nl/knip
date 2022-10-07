import micromatch from 'micromatch';
import type { ImportedConfiguration, Configuration, IssueType } from '../types';

export const resolveConfig = (importedConfiguration: ImportedConfiguration, cwdArg?: string) => {
  if (cwdArg && !('filePatterns' in importedConfiguration)) {
    const importedConfigKey = Object.keys(importedConfiguration).find(pattern => micromatch.isMatch(cwdArg, pattern));
    if (importedConfigKey) {
      return importedConfiguration[importedConfigKey];
    }
  }
  if (!cwdArg && !('filePatterns' in importedConfiguration)) {
    console.error('Unable to find `filePatterns` in configuration.');
    console.info('Add it at root level, or use the --cwd argument with a matching configuration.\n');
    return;
  }
  return importedConfiguration as Configuration;
};

export const resolveIncludedFromArgs = (onlyArg: string[], excludeArg: string[]) => {
  const groups: IssueType[] = ['files', 'exports', 'types', 'members', 'duplicates'];
  const only = onlyArg.map(value => value.split(',')).flat() as IssueType[];
  const exclude = excludeArg.map(value => value.split(',')).flat() as IssueType[];
  const includes = (only.length > 0 ? only : groups).filter((group: IssueType) => !exclude.includes(group));
  return groups.reduce((r, group) => ((r[group] = includes.includes(group)), r), {} as Configuration['include']);
};
