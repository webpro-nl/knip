import { ISSUE_TYPE_TITLE } from '../constants.js';
import type { Entries } from '../types/entries.js';
import type { Issue, ReporterOptions } from '../types/issues.js';
import { relative } from '../util/path.js';
import { hintPrinters } from './util/configuration-hints.js';
import { getIssueTypeTitle } from './util/util.js';

const createGitHubActionsLogger = () => {
  const formatAnnotation = (
    level: 'error' | 'warning' | 'notice',
    message: string,
    options: {
      file: string;
      startLine?: number;
      endLine?: number;
      startColumn?: number;
      endColumn?: number;
      title?: string;
    }
  ) => {
    const params = [`file=${options.file}`];
    if (options.startLine != null) params.push(`line=${options.startLine}`);
    if (options.endLine != null) params.push(`endLine=${options.endLine}`);
    if (options.startColumn != null) params.push(`col=${options.startColumn}`);
    if (options.endColumn != null) params.push(`endColumn=${options.endColumn}`);
    params.push(`title=✂️ Knip${options.title ? ` / ${options.title}` : ''}`);

    const paramString = params.join(',');
    console.log(`::${level} ${paramString}::${message}`);
  };

  return {
    info: (message: string) => console.log(message),
    error: (
      message: string,
      options: {
        file: string;
        startLine?: number;
        endLine?: number;
        startColumn?: number;
        endColumn?: number;
        title?: string;
      }
    ) => formatAnnotation('error', message, options),
    warning: (
      message: string,
      options: {
        file: string;
        startLine?: number;
        endLine?: number;
        startColumn?: number;
        endColumn?: number;
        title?: string;
      }
    ) => formatAnnotation('warning', message, options),
    notice: (
      message: string,
      options: {
        file: string;
        startLine?: number;
        endLine?: number;
        startColumn?: number;
        endColumn?: number;
        title?: string;
      }
    ) => formatAnnotation('notice', message, options),
  };
};

export default ({
  report,
  issues,
  cwd,
  configurationHints,
  isDisableConfigHints,
  isTreatConfigHintsAsErrors,
  configFilePath,
}: ReporterOptions) => {
  const core = createGitHubActionsLogger();
  const reportMultipleGroups = Object.values(report).filter(Boolean).length > 1;

  for (let [reportType, isReportType] of Object.entries(report) as Entries<typeof report>) {
    if (reportType === 'files') reportType = '_files';

    if (isReportType) {
      const title = reportMultipleGroups && getIssueTypeTitle(reportType);

      const issuesForType: Issue[] = Object.values(issues[reportType]).flatMap(Object.values);
      if (issuesForType.length > 0) {
        title && core.info(`${title} (${issuesForType.length})`);

        for (const issue of issuesForType) {
          if (issue.isFixed || issue.severity === 'off') continue;

          const log = issue.severity === 'error' ? core.error : core.warning;
          const filePath = relative(cwd, issue.filePath);

          const message = reportType === '_files' ? issue.symbol : `${issue.symbol} in ${filePath}`;

          log(message, {
            file: filePath,
            startLine: issue.line ?? 1,
            endLine: issue.line ?? 1,
            startColumn: issue.col ?? 1,
            endColumn: issue.col ?? 1,
            title: ISSUE_TYPE_TITLE[issue.type],
          });
        }
      }
    }
  }

  if (!isDisableConfigHints && configurationHints.size > 0) {
    const CONFIG_HINTS_TITLE = 'Configuration hints';
    core.info(`${CONFIG_HINTS_TITLE} (${configurationHints.size})`);

    for (const hint of configurationHints) {
      const hintPrinter = hintPrinters.get(hint.type);
      const message =
        hintPrinter?.print({
          ...hint,
          filePath: hint.filePath ?? configFilePath ?? '',
          configFilePath,
        }) ?? '';

      const file = hint.filePath
        ? relative(cwd, hint.filePath)
        : configFilePath
          ? relative(cwd, configFilePath)
          : 'knip.json';

      const hintMessage = `${message}: ${hint.identifier} in ${file}`;

      if (isTreatConfigHintsAsErrors) {
        core.error(hintMessage, {
          file,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
          title: CONFIG_HINTS_TITLE,
        });
      } else {
        core.notice(hintMessage, {
          file,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
          title: CONFIG_HINTS_TITLE,
        });
      }
    }
  }
};
