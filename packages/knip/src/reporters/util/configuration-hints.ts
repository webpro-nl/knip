import type { ConfigurationHintType, ReporterOptions } from '../../types/issues.js';
import { toRelative } from '../../util/path.js';
import { byPathDepth } from '../../util/workspace.js';
import { bright, dim, getColoredTitle, getDimmedTitle, plain, yellow } from './util.js';

interface PrintHintOptions {
  type: ConfigurationHintType;
  identifier: string | RegExp;
  workspaceName?: string;
  size?: number;
}

const unused = (options: PrintHintOptions) =>
  `Remove from ${yellow(options.type)}: ${bright(options.identifier.toString())}`;

const empty = (options: PrintHintOptions) =>
  `Refine in ${options.workspaceName === '.' ? `top-level or root ${yellow('"."')}` : yellow(`"${options.workspaceName}"`)} workspace: ${bright(options.identifier.toString())}${options.identifier === '.' ? ' (root)' : ''} (no files found)`;

const remove = (options: PrintHintOptions) =>
  `Remove ${yellow(options.type.split('-').at(0))} from ${options.workspaceName === '.' ? `top-level or root ${yellow('"."')} workspace` : `"${options.workspaceName}" workspace`}: ${bright(options.identifier.toString())}`;

const refine = (options: PrintHintOptions) =>
  `Refine in ${yellow('"workspaces"')}: ${bright(options.identifier.toString())}${options.identifier === '.' ? ' (root)' : ''} (${options.size} unused files)`;

const topLevel = (options: PrintHintOptions) =>
  `Remove or move unused ${yellow(`top-level "${options.type.split('-').at(0)}"`)} to ${yellow('"."')} workspace: ${bright(options.identifier.toString())}`;

const hintPrinters = new Map<ConfigurationHintType, { print: (options: PrintHintOptions) => string }>([
  ['ignoreBinaries', { print: unused }],
  ['ignoreDependencies', { print: unused }],
  ['ignoreUnresolved', { print: unused }],
  ['ignoreWorkspaces', { print: unused }],
  ['entry-empty', { print: empty }],
  ['project-empty', { print: empty }],
  ['entry-redundant', { print: remove }],
  ['project-redundant', { print: remove }],
  ['workspace-unconfigured', { print: refine }],
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
    const getTitle = isTreatConfigHintsAsErrors ? getColoredTitle : getDimmedTitle;
    const style = isTreatConfigHintsAsErrors ? plain : dim;

    console.log(getTitle('Configuration hints', configurationHints.size));

    for (const hint of configurationHints) {
      const hintPrinter = hintPrinters.get(hint.type);
      if (hintPrinter) console.warn(style(hintPrinter.print(hint)));
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
