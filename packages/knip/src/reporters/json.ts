import type { Entries } from 'type-fest';
import type { Issue, IssueRecords, Report, ReporterOptions } from '../types/issues.js';
import { createOwnershipEngine } from '../util/codeowners.js';
import { isFile } from '../util/fs.js';
import { relative, resolve } from '../util/path.js';
import { convert } from './util/util.js';

type ExtraReporterOptions = {
  codeowners?: string;
};

interface BaseItem {
  name: string;
}

interface Item extends BaseItem {
  pos?: number;
  line?: number;
  col?: number;
}

type BaseItems = Array<BaseItem>;
type Items = Array<Item>;

type Row = {
  file: string;
  owners?: BaseItems;
  dependencies?: Items;
  devDependencies?: Items;
  optionalPeerDependencies?: Items;
  unlisted?: BaseItems;
  binaries?: BaseItems;
  unresolved?: Items;
  exports?: Items;
  types?: Items;
  nsExports?: Items;
  nsTypes?: Items;
  duplicates?: Array<Items>;
  enumMembers?: Record<string, Items>;
  classMembers?: Record<string, Items>;
};

export default async ({ report, issues, options }: ReporterOptions) => {
  let opts: ExtraReporterOptions = {};
  try {
    opts = options ? JSON.parse(options) : opts;
  } catch (error) {
    console.error(error);
  }

  const json: Record<string, Row> = {};
  const codeownersFilePath = resolve(opts.codeowners ?? '.github/CODEOWNERS');
  const findOwners = isFile(codeownersFilePath) && createOwnershipEngine(codeownersFilePath);

  const flatten = (issues: IssueRecords): Issue[] => Object.values(issues).flatMap(Object.values);

  const initRow = (filePath: string) => {
    const file = relative(filePath);
    const row: Row = {
      file,
      ...(findOwners && { owners: findOwners(file).map(name => ({ name })) }),
      ...(report.dependencies && { dependencies: [] }),
      ...(report.devDependencies && { devDependencies: [] }),
      ...(report.optionalPeerDependencies && { optionalPeerDependencies: [] }),
      ...(report.unlisted && { unlisted: [] }),
      ...(report.binaries && { binaries: [] }),
      ...(report.unresolved && { unresolved: [] }),
      ...(report.exports && { exports: [] }),
      ...(report.nsExports && { nsExports: [] }),
      ...(report.types && { types: [] }),
      ...(report.nsTypes && { nsTypes: [] }),
      ...(report.enumMembers && { enumMembers: {} }),
      ...(report.classMembers && { classMembers: {} }),
      ...(report.duplicates && { duplicates: [] }),
    };
    return row;
  };

  for (const [type, isReportType] of Object.entries(report) as Entries<Report>) {
    if (isReportType) {
      if (type === 'files' || type === '_files') {
        // Ignore, added below - we should probably deprecate and make all issue types consistent
      } else {
        for (const issue of flatten(issues[type] as IssueRecords)) {
          const { filePath, symbol, symbols, parentSymbol } = issue;
          json[filePath] = json[filePath] ?? initRow(filePath);
          if (type === 'duplicates') {
            symbols && json[filePath][type]?.push(symbols.map(convert));
          } else if (type === 'enumMembers' || type === 'classMembers') {
            const item = json[filePath][type];
            if (parentSymbol && item) {
              item[parentSymbol] = item[parentSymbol] ?? [];
              item[parentSymbol].push(convert(issue));
            }
          } else {
            if (['unlisted', 'binaries'].includes(type)) {
              json[filePath][type]?.push({ name: symbol });
            } else {
              json[filePath][type]?.push(convert(issue));
            }
          }
        }
      }
    }
  }

  const output = JSON.stringify({
    files: Array.from(issues.files).map(filePath => relative(filePath)),
    issues: Object.values(json),
  });

  // See: https://github.com/nodejs/node/issues/6379
  // @ts-expect-error _handle is private
  process.stdout._handle?.setBlocking?.(true);
  process.stdout.write(`${output}\n`);
};
