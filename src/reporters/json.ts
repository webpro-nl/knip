import path from 'node:path';
import { isFile } from '../util/fs';
import { relative } from '../util/path';
import { OwnershipEngine } from '@snyk/github-codeowners/dist/lib/ownership';
import type { Issue, ReporterOptions } from '../types';

type ExtraReporterOptions = {
  codeowners?: string;
};

type Row = {
  file: string;
  owners: string[];
  files?: boolean;
  unlisted?: string[];
  exports?: string[];
  types?: string[];
  duplicates?: string[];
};

export default async ({ report, issues, cwd, options }: ReporterOptions) => {
  let opts: ExtraReporterOptions = {};
  try {
    opts = options ? JSON.parse(options) : opts;
  } catch (error) {
    console.error(error);
  }

  const json: Record<string, Row> = {};
  const codeownersFilePath = path.resolve(opts.codeowners ?? '.github/CODEOWNERS');
  const codeownersEngine = (await isFile(codeownersFilePath)) && OwnershipEngine.FromCodeownersFile(codeownersFilePath);

  const flatten = (issues: Record<string, Record<string, Issue>>) => Object.values(issues).map(Object.values).flat();

  const initRow = (filePath: string) => {
    const file = relative(filePath);
    const row: Row = {
      file,
      ...(codeownersEngine && { owners: codeownersEngine.calcFileOwnership(file) }),
      ...(report.files && { files: false }),
      ...(report.unlisted && { unlisted: [] }),
      ...((report.exports || report.nsExports) && { exports: [] }),
      ...((report.types || report.nsTypes) && { types: [] }),
      ...(report.duplicates && { duplicates: [] }),
    };
    return row;
  };

  if (report.files) {
    issues.files.forEach(filePath => {
      json[filePath] = json[filePath] ?? initRow(filePath);
      json[filePath].files = true;
    });
  }

  if (report.unlisted) {
    flatten(issues.unresolved).forEach(({ filePath, symbol }) => {
      json[filePath] = json[filePath] ?? initRow(filePath);
      json[filePath].unlisted?.push(symbol);
    });
  }

  if (report.exports) {
    flatten(issues.exports).forEach(({ filePath, symbol }) => {
      json[filePath] = json[filePath] ?? initRow(filePath);
      json[filePath].exports?.push(symbol);
    });
  }

  if (report.nsExports) {
    flatten(issues.nsExports).forEach(({ filePath, symbol }) => {
      json[filePath] = json[filePath] ?? initRow(filePath);
      json[filePath].exports?.push(symbol);
    });
  }

  if (report.types) {
    flatten(issues.types).forEach(({ filePath, symbol }) => {
      json[filePath] = json[filePath] ?? initRow(filePath);
      json[filePath].types = json[filePath].types ?? [];
      json[filePath].types?.push(symbol);
    });
  }

  if (report.nsTypes) {
    flatten(issues.nsTypes).forEach(({ filePath, symbol }) => {
      json[filePath] = json[filePath] ?? initRow(filePath);
      json[filePath].types?.push(symbol);
    });
  }

  if (report.duplicates) {
    flatten(issues.duplicates).forEach(({ filePath, symbols }) => {
      json[filePath] = json[filePath] ?? initRow(filePath);
      json[filePath].duplicates?.push(...symbols);
    });
  }

  console.log(JSON.stringify(Object.values(json)));
};
