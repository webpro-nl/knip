import type { Results } from '../../run.ts';
import { ROOT_WORKSPACE_NAME } from '../../constants.ts';
import type {
  ConfigurationHint,
  ConfigurationHintType,
  ReporterOptions,
  UnusedIgnorePatternReason,
} from '../../types/issues.ts';
import { basename, relative, toRelative } from '../../util/path.ts';
import { Table } from '../../util/table.ts';
import { byPathDepth } from '../../util/workspace.ts';
import { bright, dim, getColoredTitle, getDimmedTitle } from './util.ts';

interface PrintHintOptions {
  type: ConfigurationHintType;
  identifier: string | RegExp;
  filePath: string;
  configFilePath?: string;
  workspaceName?: string;
  configKey?: string;
  reason?: UnusedIgnorePatternReason;
  size?: number;
}

type TableRow = ConfigurationHint & { message: string };

const getIdentifier = (hint: ConfigurationHint) => {
  if (hint.identifier === '.') return `. ${dim('(root)')}`;
  if (hint.identifier instanceof RegExp) return hint.identifier.source.replaceAll('\\/', '/');
  return hint.identifier.toString();
};

const getTableForHints = (hints: TableRow[]) => {
  const table = new Table({ truncate: { identifier: 'start', description: 'none' } });
  for (const hint of hints) {
    table.row();
    table.cell('identifier', getIdentifier(hint));
    table.cell('description', dim(hint.message));
  }
  return table;
};

const type = (id: ConfigurationHintType) => id.split('-').at(0) as string;

const SEP = ' → ';

const location = (options: PrintHintOptions, key?: string) => {
  const segments: string[] = [];
  if (options.filePath) {
    segments.push(options.filePath);
    if (basename(options.filePath) === 'package.json') segments.push('knip');
  }
  const workspace =
    options.configKey ?? (options.workspaceName !== ROOT_WORKSPACE_NAME ? options.workspaceName : undefined);
  if (workspace) segments.push(workspace === ROOT_WORKSPACE_NAME ? '(root)' : workspace);
  if (key) segments.push(bright(key));
  return segments.join(SEP);
};

const reasons: Record<UnusedIgnorePatternReason, string> = {
  'no-issues': 'no issues',
  gitignored: 'gitignored',
  'no-matches': 'no matches',
};

const unused = (options: PrintHintOptions) => {
  const reason = options.reason
    ? options.type === 'ignoreFiles' && options.reason === 'no-issues'
      ? 'files are used'
      : reasons[options.reason]
    : undefined;
  return `Remove from ${location(options, type(options.type))}${reason ? ` (${reason})` : ''}`;
};
const empty = (options: PrintHintOptions) => `Refine ${location(options, type(options.type))} pattern (no matches)`;
const remove = (options: PrintHintOptions) => `Remove redundant pattern from ${location(options, type(options.type))}`;
const topLevel = (options: PrintHintOptions) =>
  `Remove unused ${location(options, type(options.type))}, or move to ${bright('"workspaces"')}`;
const add = (options: PrintHintOptions) =>
  options.configFilePath
    ? `Add ${bright('entry')} and/or refine ${bright('project')} files in ${location(options)} (${options.size} unused files)`
    : `Create ${bright('knip.json')} configuration file, and add ${bright('entry')} and/or refine ${bright('project')} files (${options.size} unused files)`;
const addWorkspace = (options: PrintHintOptions) =>
  options.configFilePath
    ? `Add ${bright('entry')} and/or refine ${bright('project')} files in ${location({ ...options, workspaceName: undefined }, `workspaces["${options.workspaceName}"]`)} (${options.size} unused files)`
    : `Create ${bright('knip.json')} configuration file with ${bright(`workspaces["${options.workspaceName}"]`)} object (${options.size} unused files)`;

const packageEntry = (options: PrintHintOptions) =>
  `Package entry file not found${options.filePath ? ` in ${options.filePath}` : ''}`;

const extensionUnregistered = (options: PrintHintOptions) =>
  `Extension in ${location(options, 'project')} not registered as a compiler`;

const extensionExcluded = (options: PrintHintOptions) =>
  `Compiled extension excluded by ${location(options, 'project')} (imports not followed)`;

export const hintPrinters = new Map<ConfigurationHintType, { print: (options: PrintHintOptions) => string }>([
  ['ignore', { print: unused }],
  ['ignoreFiles', { print: unused }],
  ['ignoreBinaries', { print: unused }],
  ['ignoreDependencies', { print: unused }],
  ['ignoreUnresolved', { print: unused }],
  ['workspaces', { print: unused }],
  ['ignoreWorkspaces', { print: unused }],
  ['entry-empty', { print: empty }],
  ['project-empty', { print: empty }],
  ['project-extension-unregistered', { print: extensionUnregistered }],
  ['project-extension-excluded', { print: extensionExcluded }],
  ['entry-redundant', { print: remove }],
  ['project-redundant', { print: remove }],
  ['top-level-unconfigured', { print: add }],
  ['workspace-unconfigured', { print: addWorkspace }],
  ['entry-top-level', { print: topLevel }],
  ['project-top-level', { print: topLevel }],
  ['package-entry', { print: packageEntry }],
]);

const hintTypesOrder: ConfigurationHintType[][] = [
  ['top-level-unconfigured', 'workspace-unconfigured'],
  ['entry-top-level', 'project-top-level'],
  ['workspaces'],
  ['ignore', 'ignoreFiles'],
  ['ignoreWorkspaces'],
  ['ignoreDependencies'],
  ['ignoreBinaries'],
  ['ignoreUnresolved'],
  ['entry-empty', 'project-empty', 'entry-redundant', 'project-redundant'],
  ['project-extension-unregistered', 'project-extension-excluded'],
  ['package-entry'],
];

interface ProcessedHint extends ConfigurationHint {
  message: string;
}

const UNCONFIGURED_MIN_FILES = 20;
const UNCONFIGURED_MIN_RATIO = 0.2;

export const finalizeConfigurationHints = (
  results: Results,
  options: { cwd: string; configFilePath?: string }
): ProcessedHint[] => {
  const { files, processed } = results.counters;
  const unusedFileRatio = processed > 0 ? files / processed : 0;
  if (files > UNCONFIGURED_MIN_FILES && unusedFileRatio > UNCONFIGURED_MIN_RATIO) {
    const workspaces = results.includedWorkspaceDirs
      .sort(byPathDepth)
      .reverse()
      .map(dir => ({ dir, size: 0 }));

    for (const issues of Object.values(results.issues.files)) {
      for (const issue of Object.values(issues)) {
        const workspace = workspaces.find(ws => issue.filePath.startsWith(ws.dir));
        if (workspace) workspace.size++;
      }
    }

    if (workspaces.length === 1) {
      results.configurationHints.push({ type: 'top-level-unconfigured', identifier: '.', size: workspaces[0].size });
    } else {
      const topWorkspaces = workspaces.sort((a, b) => b.size - a.size).filter(ws => ws.size > 1);
      for (const { dir, size } of topWorkspaces) {
        const identifier = toRelative(dir, options.cwd);
        results.configurationHints.push({
          type: 'workspace-unconfigured',
          workspaceName: identifier,
          identifier,
          size,
        });
      }
    }
  }

  const hintsByType = new Map<ConfigurationHintType, ConfigurationHint[]>();
  for (const hint of results.configurationHints) {
    const hints = hintsByType.get(hint.type) ?? [];
    hintsByType.set(hint.type, [...hints, hint]);
  }

  return hintTypesOrder.flatMap(hintTypes =>
    hintTypes.flatMap(hintType => {
      const hints = hintsByType.get(hintType) ?? [];
      const topHints = hints.length > 10 ? Array.from(hints).slice(0, 10) : hints;
      const row = topHints.map(hint => {
        hint.filePath = relative(options.cwd, hint.filePath || options.configFilePath || options.cwd);
        const hintPrinter = hintPrinters.get(hint.type);
        // @ts-expect-error
        const message = hintPrinter ? hintPrinter.print({ ...hint, configFilePath: options.configFilePath }) : '';
        return { ...hint, message };
      });
      if (hints.length !== topHints.length) {
        const more = hints.length - topHints.length;
        row.push({ type: hintType, identifier: `...${more} more similar hints`, filePath: '', message: '' });
      }
      return row;
    })
  );
};

export const printConfigurationHints = ({
  cwd,
  counters,
  issues,
  tagHints,
  configurationHints,
  hasConfigLoadErrors,
  enabledPlugins,
  isTreatConfigHintsAsErrors,
  includedWorkspaceDirs,
  selectedWorkspaces,
  configFilePath,
}: ReporterOptions) => {
  const rows = finalizeConfigurationHints(
    {
      issues,
      counters,
      configurationHints,
      hasConfigLoadErrors,
      tagHints,
      includedWorkspaceDirs,
      selectedWorkspaces,
      enabledPlugins,
    },
    { cwd, configFilePath }
  );

  if (rows.length > 0) {
    const getTitle = isTreatConfigHintsAsErrors ? getColoredTitle : getDimmedTitle;
    console.warn(getTitle('Configuration hints', configurationHints.length));
    console.warn(getTableForHints(rows).toString());
  }
};

export const printTagHints = ({ cwd, tagHints, isTreatTagHintsAsErrors }: ReporterOptions) => {
  if (tagHints.size > 0) {
    const getTitle = isTreatTagHintsAsErrors ? getColoredTitle : getDimmedTitle;
    console.warn(getTitle('Tag hints', tagHints.size));
    for (const hint of tagHints) {
      const { filePath, identifier, tagName } = hint;
      const message = `Unused tag in ${toRelative(filePath, cwd)}:`;
      console.warn(dim(message), `${identifier} → ${tagName}`);
    }
  }
};
