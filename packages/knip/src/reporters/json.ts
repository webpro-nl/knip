import type { Entries } from '../types/entries.ts';
import type { IssueRecords, Report, ReporterOptions } from '../types/issues.ts';
import { createOwnershipEngine } from '../util/codeowners.ts';
import { isFile } from '../util/fs.ts';
import { relative, resolve } from '../util/path.ts';
import { convert, flattenIssues } from './util/util.ts';

type ExtraReporterOptions = {
  codeowners?: string;
};

interface BaseItem {
  name: string;
}

interface Item extends BaseItem {
  namespace?: string;
  pos?: number;
  line?: number;
  col?: number;
}

type BaseItems = Array<BaseItem>;
type Items = Array<Item>;

type Row = {
  file: string;
  owners?: BaseItems;
  binaries?: BaseItems;
  catalog?: Items;
  dependencies?: Items;
  devDependencies?: Items;
  duplicates?: Array<Items>;
  enumMembers?: Items;
  exports?: Items;
  files?: Items;
  namespaceMembers?: Items;
  nsExports?: Items;
  nsTypes?: Items;
  optionalPeerDependencies?: Items;
  types?: Items;
  unlisted?: BaseItems;
  unresolved?: Items;
};

export default async ({ report, issues, options, cwd }: ReporterOptions) => {
  let opts: ExtraReporterOptions = {};
  try {
    opts = options ? JSON.parse(options) : opts;
  } catch (error) {
    console.error(error);
  }

  const json: Record<string, Row> = {};
  const codeownersFilePath = resolve(opts.codeowners ?? '.github/CODEOWNERS');
  const findOwners = isFile(codeownersFilePath) && createOwnershipEngine(codeownersFilePath);

  const initRow = (filePath: string) => {
    const file = relative(cwd, filePath);
    const row: Row = {
      file,
      ...(findOwners && { owners: findOwners(file).map(name => ({ name })) }),
      ...(report.binaries && { binaries: [] }),
      ...(report.catalog && { catalog: [] }),
      ...(report.dependencies && { dependencies: [] }),
      ...(report.devDependencies && { devDependencies: [] }),
      ...(report.duplicates && { duplicates: [] }),
      ...(report.enumMembers && { enumMembers: [] }),
      ...(report.exports && { exports: [] }),
      ...(report.files && { files: [] }),
      ...(report.namespaceMembers && { namespaceMembers: [] }),
      ...(report.nsExports && { nsExports: [] }),
      ...(report.nsTypes && { nsTypes: [] }),
      ...(report.optionalPeerDependencies && { optionalPeerDependencies: [] }),
      ...(report.types && { types: [] }),
      ...(report.unlisted && { unlisted: [] }),
      ...(report.unresolved && { unresolved: [] }),
    };
    return row;
  };

  for (const [type, isReportType] of Object.entries(report) as Entries<Report>) {
    if (isReportType) {
      for (const issue of flattenIssues(issues[type] as IssueRecords)) {
        const { filePath, symbol, symbols } = issue;
        json[filePath] = json[filePath] ?? initRow(filePath);
        if (type === 'duplicates') {
          symbols && json[filePath][type]?.push(symbols.map(convert));
        } else if (type === 'binaries') {
          json[filePath][type]?.push({ name: symbol });
        } else {
          json[filePath][type]?.push(convert(issue));
        }
      }
    }
  }

  const output = JSON.stringify({
    issues: Object.values(json),
  });

  // See: https://github.com/nodejs/node/issues/6379
  // @ts-expect-error _handle is private
  process.stdout._handle?.setBlocking?.(true);
  process.stdout.write(`${output}\n`);
};
