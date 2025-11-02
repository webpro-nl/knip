import type { ConfigurationHint, ConfigurationHintType, ReporterOptions } from '../../types/issues.js';
import { relative, toRelative } from '../../util/path.js';
import { Table } from '../../util/table.js';
import { byPathDepth } from '../../util/workspace.js';
import { bright, dim, getColoredTitle, getDimmedTitle } from './util.js';

interface PrintHintOptions {
  type: ConfigurationHintType;
  identifier: string | RegExp;
  filePath: string;
  configFilePath?: string;
  workspaceName?: string;
  size?: number;
}

type TableRow = ConfigurationHint & { message: string };

const getWorkspaceName = (hint: ConfigurationHint) =>
  hint.workspaceName &&
  hint.workspaceName !== '.' &&
  hint.type !== 'top-level-unconfigured' &&
  hint.type !== 'workspace-unconfigured' &&
  hint.type !== 'package-entry'
    ? hint.workspaceName
    : '';

const getIdentifier = (hint: ConfigurationHint) =>
  hint.identifier === '.' ? `. ${dim('(root)')}` : hint.identifier.toString();

const getTableForHints = (hints: TableRow[]) => {
  const table = new Table({ truncateStart: ['identifier', 'workspace', 'filePath'] });
  for (const hint of hints) {
    table.row();
    table.cell('identifier', getIdentifier(hint));
    table.cell('workspace', getWorkspaceName(hint));
    table.cell('filePath', hint.filePath);
    table.cell('description', dim(hint.message));
  }
  return table;
};

const type = (id: ConfigurationHintType) => bright(id.split('-').at(0));

const unused = (options: PrintHintOptions) => `Remove from ${type(options.type)}`;
const empty = (options: PrintHintOptions) => `Refine ${type(options.type)} pattern (no matches)`;
const remove = (options: PrintHintOptions) => `Remove redundant ${type(options.type)} pattern`;
const topLevel = (options: PrintHintOptions) =>
  `Remove, or move unused top-level ${type(options.type)} to one of ${bright('"workspaces"')}`;
const add = (options: PrintHintOptions) =>
  options.configFilePath
    ? `Add ${bright('entry')} and/or refine ${bright('project')} files (${options.size} unused files)`
    : `Create ${bright('knip.json')} configuration file, and add ${bright('entry')} and/or refine ${bright('project')} files (${options.size} unused files)`;
const addWorkspace = (options: PrintHintOptions) =>
  options.configFilePath
    ? `Add ${bright('entry')} and/or refine ${bright('project')} files in ${bright(`workspaces["${options.workspaceName}"]`)} (${options.size} unused files)`
    : `Create ${bright('knip.json')} configuration file with ${bright(`workspaces["${options.workspaceName}"]`)} object (${options.size} unused files)`;

const packageEntry = () => 'Package entry file not found';

const hintPrinters = new Map<ConfigurationHintType, { print: (options: PrintHintOptions) => string }>([
  ['ignoreBinaries', { print: unused }],
  ['ignoreDependencies', { print: unused }],
  ['ignoreUnresolved', { print: unused }],
  ['ignoreWorkspaces', { print: unused }],
  ['entry-empty', { print: empty }],
  ['project-empty', { print: empty }],
  ['entry-redundant', { print: remove }],
  ['project-redundant', { print: remove }],
  ['top-level-unconfigured', { print: add }],
  ['workspace-unconfigured', { print: addWorkspace }],
  ['entry-top-level', { print: topLevel }],
  ['project-top-level', { print: topLevel }],
  ['package-entry', { print: packageEntry }],
]);

export { hintPrinters };

const hintTypesOrder: ConfigurationHintType[][] = [
  ['top-level-unconfigured', 'workspace-unconfigured'],
  ['entry-top-level', 'project-top-level'],
  ['ignoreWorkspaces'],
  ['ignoreDependencies'],
  ['ignoreBinaries'],
  ['ignoreUnresolved'],
  ['entry-empty', 'project-empty', 'entry-redundant', 'project-redundant'],
  ['package-entry'],
];

export const printConfigurationHints = ({
  cwd,
  counters,
  issues,
  tagHints,
  configurationHints,
  isTreatConfigHintsAsErrors,
  includedWorkspaceDirs,
  configFilePath,
}: ReporterOptions) => {
  if (counters.files > 20) {
    const workspaces = includedWorkspaceDirs
      .sort(byPathDepth)
      .reverse()
      .map(dir => ({ dir, size: 0 }));

    for (const filePath of issues.files) {
      const workspace = workspaces.find(ws => filePath.startsWith(ws.dir));
      if (workspace) workspace.size++;
    }

    if (workspaces.length === 1) {
      configurationHints.add({ type: 'top-level-unconfigured', identifier: '.', size: workspaces[0].size });
    } else {
      const topWorkspaces = workspaces.sort((a, b) => b.size - a.size).filter(ws => ws.size > 1);
      for (const { dir, size } of topWorkspaces) {
        const identifier = toRelative(dir, cwd) || '.';
        configurationHints.add({ type: 'workspace-unconfigured', workspaceName: identifier, identifier, size });
      }
    }
  }

  if (configurationHints.size > 0) {
    const getTitle = isTreatConfigHintsAsErrors ? getColoredTitle : getDimmedTitle;

    console.log(getTitle('Configuration hints', configurationHints.size));

    const hintsByType = new Map<ConfigurationHintType, ConfigurationHint[]>();
    for (const hint of configurationHints) {
      const hints = hintsByType.get(hint.type) ?? [];
      hintsByType.set(hint.type, [...hints, hint]);
    }

    const rows: TableRow[] = hintTypesOrder.flatMap(hintTypes =>
      hintTypes.flatMap(hintType => {
        const _hints = hintsByType.get(hintType) ?? [];
        const hints = _hints.length > 10 ? _hints.toSpliced(10) : _hints;
        const row = hints.map(hint => {
          hint.filePath = relative(cwd, hint.filePath ?? configFilePath ?? '');
          const hintPrinter = hintPrinters.get(hint.type);
          const message = hintPrinter ? hintPrinter.print({ ...hint, configFilePath }) : '';
          return { ...hint, message };
        });
        if (_hints.length !== hints.length) {
          const identifier = dim(`...${_hints.length - hints.length} more similar hints`);
          row.push({ type: hintType, identifier, filePath: '', message: '' });
        }
        return row;
      })
    );

    console.warn(getTableForHints(rows).toString());
  }

  if (tagHints.size > 0) {
    console.log(getColoredTitle('Tag issues', tagHints.size));
    for (const hint of tagHints) {
      const { filePath, identifier, tagName } = hint;
      const message = `Unused tag in ${toRelative(filePath, cwd)}:`;
      console.warn(dim(message), `${identifier} → ${tagName}`);
    }
  }
};
