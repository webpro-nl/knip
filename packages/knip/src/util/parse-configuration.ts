import type { Compiler } from '../compilers/types.ts';
import { ISSUE_TYPES, SYMBOL_TYPE } from '../constants.ts';
import type { IgnoreExportsUsedInFile } from '../types/config.ts';
import type { RawConfiguration, RawPluginConfiguration, WorkspaceProjectConfig } from '../types/configuration.ts';
import type { IssueSeverity, IssueType } from '../types/issues.ts';
import type { PluginName } from '../types/PluginNames.ts';
import { ConfigurationValidationError } from './errors.ts';
import { isPluginName } from './is-plugin-name.ts';
import {
  type Check,
  type Fields,
  checkArray,
  checkBoolean,
  checkObject,
  checkRecord,
  checkString,
  invalid,
  isObject,
} from './validation.ts';

const checkStrings = checkArray(checkString);
const checkGlob: Check<string | string[]> = (value, path, errors): value is string | string[] =>
  typeof value === 'string' || checkStrings(value, path, errors);
const checkPattern: Check<string | RegExp> = (value, path, errors): value is string | RegExp =>
  typeof value === 'string' || value instanceof RegExp || invalid(path, errors);
const issueTypes = new Set<string>(ISSUE_TYPES);
const isIssueType = (value: unknown): value is IssueType => typeof value === 'string' && issueTypes.has(value);
const checkIssueType: Check<IssueType> = (value, path, errors): value is IssueType =>
  isIssueType(value) || invalid(path, errors);
const checkSeverity: Check<IssueSeverity> = (value, path, errors): value is IssueSeverity =>
  value === 'error' || value === 'warn' || value === 'off' || invalid(path, errors);

const symbolFields: Partial<Fields<Exclude<IgnoreExportsUsedInFile, boolean>>> = {};
for (const type of Object.values(SYMBOL_TYPE)) if (type !== 'unknown') symbolFields[type] = checkBoolean;
const checkIgnoreExports: Check<IgnoreExportsUsedInFile> = (value, path, errors): value is IgnoreExportsUsedInFile =>
  typeof value === 'boolean' || checkObject(value, path, errors, symbolFields);

const pluginFields = { config: checkGlob, entry: checkGlob, project: checkGlob } satisfies Fields<
  Exclude<RawPluginConfiguration, boolean | string | string[]>
>;
const checkPlugin: Check<RawPluginConfiguration> = (value, path, errors): value is RawPluginConfiguration =>
  typeof value === 'boolean' ||
  (isObject(value) ? checkObject(value, path, errors, pluginFields, 'ignore') : checkGlob(value, path, errors));

const getPluginCheck = (key: string) => (isPluginName(key) ? checkPlugin : undefined);

const checkPatterns = checkArray(checkPattern);
const checkIssueTypes = checkArray(checkIssueType);
const workspaceFields = {
  entry: checkGlob,
  project: checkGlob,
  paths: checkRecord(checkStrings),
  ignore: checkGlob,
  ignoreFiles: checkGlob,
  ignoreBinaries: checkPatterns,
  ignoreGlobalBinaries: checkBoolean,
  ignoreDependencies: checkPatterns,
  ignoreMembers: checkPatterns,
  ignoreUnresolved: checkPatterns,
  ignoreExportsUsedInFile: checkIgnoreExports,
  ignoreIssues: checkRecord(checkIssueTypes),
  includeEntryExports: checkBoolean,
} satisfies Fields<Omit<WorkspaceProjectConfig, PluginName>>;
const checkWorkspace: Check<WorkspaceProjectConfig> = (value, path, errors): value is WorkspaceProjectConfig =>
  checkObject(value, path, errors, workspaceFields, getPluginCheck);
const cycleFields = { allow: checkArray(checkStrings), dynamicImports: checkBoolean } satisfies Fields<
  NonNullable<RawConfiguration['cycles']>
>;
const checkCompilers = checkRecord((_value): _value is Compiler => true);
const rootFields = {
  $schema: checkString,
  rules: checkRecord(checkSeverity, isIssueType),
  ...workspaceFields,
  cycles: (value, path, errors): value is NonNullable<RawConfiguration['cycles']> =>
    checkObject(value, path, errors, cycleFields),
  ignoreWorkspaces: checkStrings,
  compilers: checkCompilers,
  asyncCompilers: checkCompilers,
  tags: checkStrings,
  treatConfigHintsAsErrors: checkBoolean,
  treatTagHintsAsErrors: checkBoolean,
  preprocessor: checkGlob,
  preprocessorOptions: checkRecord((_value): _value is unknown => true),
  include: checkIssueTypes,
  exclude: checkIssueTypes,
  workspaces: checkRecord(checkWorkspace),
} satisfies Fields<Omit<RawConfiguration, PluginName>>;
const checkConfiguration: Check<RawConfiguration> = (value, path, errors): value is RawConfiguration =>
  checkObject(value, path, errors, rootFields, getPluginCheck);

export const parseConfiguration = (value: unknown): RawConfiguration => {
  const errors: string[] = [];
  if (!checkConfiguration(value, '', errors)) throw new ConfigurationValidationError(errors);
  return value;
};
