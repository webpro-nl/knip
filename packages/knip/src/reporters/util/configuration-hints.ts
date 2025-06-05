import type { ConfigurationHint, ConfigurationHintType, ReporterOptions } from '../../types/issues.js';
import { toRelative } from '../../util/path.js';
import { byPathDepth } from '../../util/workspace.js';
import { bright, dim, getColoredTitle, getDimmedTitle, plain, yellow } from './util.js';

interface PrintHintOptions {
  type: ConfigurationHintType;
  identifier: string | RegExp;
  isRootOnly: boolean;
  workspaceName?: string;
  size?: number;
}

const id = (id: string | RegExp) => bright(id.toString() + (id === '.' ? ' (root)' : ''));
const type = (id: ConfigurationHintType) => yellow(id.split('-').at(0));
const workspace = ({ isRootOnly, workspaceName: id }: PrintHintOptions) =>
  isRootOnly ? '' : id === '.' ? ` in root ${yellow('"."')} workspace` : ` in ${yellow(id ?? '.')}`;

const unused = (options: PrintHintOptions) =>
  `Remove from ${type(options.type)}${options.workspaceName === '.' ? '' : `${workspace(options)}`}: ${id(options.identifier)}`;

const empty = (options: PrintHintOptions) =>
  `Refine ${type(options.type)}${workspace(options)}: ${id(options.identifier)} (no files found)`;

const remove = (options: PrintHintOptions) =>
  `Remove ${type(options.type)}${workspace(options)}: ${id(options.identifier)}`;

const add = (options: PrintHintOptions) =>
  `Add to or refine in ${yellow('workspaces')}: ${id(options.identifier)} (${options.size} unused files)`;

const topLevel = (options: PrintHintOptions) =>
  `Remove or move unused top-level ${type(options.type)} to ${yellow('"."')} workspace: ${id(options.identifier)}`;

const hintPrinters = new Map<ConfigurationHintType, { print: (options: PrintHintOptions) => string }>([
  ['ignoreBinaries', { print: unused }],
  ['ignoreDependencies', { print: unused }],
  ['ignoreUnresolved', { print: unused }],
  ['ignoreWorkspaces', { print: unused }],
  ['entry-empty', { print: empty }],
  ['project-empty', { print: empty }],
  ['entry-redundant', { print: remove }],
  ['project-redundant', { print: remove }],
  ['workspace-unconfigured', { print: add }],
  ['entry-top-level', { print: topLevel }],
  ['project-top-level', { print: topLevel }],
]);

export const printConfigurationHints = ({
  counters,
  issues,
  tagHints,
  configurationHints,
  isTreatConfigHintsAsErrors,
  includedWorkspaces,
}: ReporterOptions) => {
  if (counters.files > 20) {
    const workspaces = includedWorkspaces
      .map(workspace => workspace.dir)
      .sort(byPathDepth)
      .reverse()
      .map(dir => ({ dir, size: 0 }));

    for (const filePath of issues.files) {
      const workspace = workspaces.find(ws => filePath.startsWith(ws.dir));
      if (workspace) workspace.size++;
    }

    const hlWorkspaces = workspaces.sort((a, b) => b.size - a.size).filter(ws => ws.size > 1);

    for (const { dir, size } of hlWorkspaces) {
      const identifier = toRelative(dir) || '.';
      configurationHints.add({ type: 'workspace-unconfigured', workspaceName: identifier, identifier, size });
    }
  }

  if (configurationHints.size > 0) {
    const isTopLevel = (type: ConfigurationHintType) => type.includes('top-level');
    const hintOrderer = (a: ConfigurationHint, b: ConfigurationHint) =>
      isTopLevel(a.type) && !isTopLevel(b.type) ? -1 : !isTopLevel(a.type) && isTopLevel(b.type) ? 1 : 0;

    const getTitle = isTreatConfigHintsAsErrors ? getColoredTitle : getDimmedTitle;
    const style = isTreatConfigHintsAsErrors ? plain : dim;

    console.log(getTitle('Configuration hints', configurationHints.size));

    const isRootOnly = includedWorkspaces.length === 1 && includedWorkspaces[0].name === '.';
    for (const hint of Array.from(configurationHints).sort(hintOrderer)) {
      const hintPrinter = hintPrinters.get(hint.type);
      if (hintPrinter) console.warn(style(hintPrinter.print({ ...hint, isRootOnly })));
    }
  }

  if (tagHints.size > 0) {
    console.log(getColoredTitle('Tag issues', tagHints.size));
    for (const hint of tagHints) {
      const { filePath, identifier, tagName } = hint;
      const message = `Unused tag in ${toRelative(filePath)}:`;
      console.warn(dim(message), `${identifier} → ${tagName}`);
    }
  }
};
