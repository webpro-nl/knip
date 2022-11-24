import { ts, Node, SourceFile } from 'ts-morph';
import { _findExternalImportModuleSpecifiers } from './util/externalImports.js';
import { findUnusedClassMembers, findUnusedEnumMembers } from './util/members.js';
import {
  _findDuplicateExportedNames,
  _hasReferencingDefaultImport,
  _findReferencingNamespaceNodes,
  _getExportedDeclarations,
  _findReferences,
  hasExternalReferences,
} from './util/project.js';
import { getType } from './util/type.js';
import type { Report, Issue } from './types/issues.js';
import type { Identifier } from 'ts-morph';

type FileLabOptions = {
  report: Report;
  workspaceDirs: string[];
};

/**
 * - Collects files to skip exports analysis for
 * - Analyzes source files for unused exported values and types
 * - Returns external module specifiers (i.e. potential external dependencies)
 */
export default class SourceLab {
  report;
  workspaceDirs;
  skipExportsAnalysis;
  isReportExports;
  isReportValues;
  isReportTypes;

  constructor({ report, workspaceDirs }: FileLabOptions) {
    this.report = report;
    this.workspaceDirs = workspaceDirs;
    this.skipExportsAnalysis = new Set();

    this.isReportValues = report.exports || report.nsExports || report.classMembers;
    this.isReportTypes = report.types || report.nsTypes || report.enumMembers;
    this.isReportExports = this.isReportValues || this.isReportTypes;
  }

  public skipExportsAnalysisFor(filePath: string | string[]) {
    if (typeof filePath === 'string') this.skipExportsAnalysis.add(filePath);
    else filePath.forEach(filePath => this.skipExportsAnalysis.add(filePath));
  }

  public analyzeSourceFile(sourceFile: SourceFile) {
    const issues: Set<Issue> = new Set();
    const report = this.report;
    const filePath = sourceFile.getFilePath();
    let externalModuleSpecifiers: string[] = [];

    if (report.dependencies || report.unlisted) {
      externalModuleSpecifiers = _findExternalImportModuleSpecifiers(sourceFile);
    }

    if (report.duplicates) {
      const duplicateExports = _findDuplicateExportedNames(sourceFile);
      duplicateExports.forEach(symbols => {
        const symbol = symbols.join('|');
        issues.add({ type: 'duplicates', filePath, symbol, symbols });
      });
    }

    if (this.skipExportsAnalysis.has(filePath)) return { externalModuleSpecifiers, issues };

    if (this.isReportExports) {
      const exportsIssues = this.analyzeExports(sourceFile);
      exportsIssues.forEach(issue => issues.add(issue));
    }

    return { externalModuleSpecifiers, issues };
  }

  private analyzeExports(sourceFile: SourceFile) {
    const issues: Set<Issue> = new Set();
    const report = this.report;
    const filePath = sourceFile.getFilePath();

    // The file is used, let's visit all export declarations to see which of them are not used somewhere else
    const exportDeclarations = _getExportedDeclarations(sourceFile);

    exportDeclarations.forEach(declarations => {
      declarations.forEach(declaration => {
        const type = getType(declaration);

        if (type && !this.isReportTypes) return;
        if (!type && !this.isReportValues) return;

        // Leave exports with a JSDoc `@public` tag alone
        if (ts.getJSDocPublicTag(declaration.compilerNode)) return;

        // TODO: Find out why we have to do this
        if (Node.isJSDocTag(declaration)) return;

        let identifier: Identifier | undefined;
        let fakeIdentifier: string | undefined;

        // Analyze unused enum/class members before potential early bail-out of default exports
        if (declaration.isKind(ts.SyntaxKind.EnumDeclaration)) {
          identifier = declaration.getFirstChildByKind(ts.SyntaxKind.Identifier);
          if (report.enumMembers) {
            findUnusedEnumMembers(declaration, filePath).forEach(member =>
              issues.add({
                type: 'enumMembers',
                filePath,
                symbol: member.getName(),
                parentSymbol: identifier?.getText(),
              })
            );
          }
        } else if (declaration.isKind(ts.SyntaxKind.ClassDeclaration)) {
          identifier = declaration.getFirstChildByKind(ts.SyntaxKind.Identifier);
          if (report.classMembers) {
            findUnusedClassMembers(declaration, filePath).forEach(member =>
              issues.add({
                type: 'classMembers',
                filePath,
                symbol: member.getName(),
                parentSymbol: identifier?.getText(),
              })
            );
          }
        }

        // Special case: we have to explicitly find references to default exports, and then we can bail out early
        if (
          Node.isExportGetable(declaration) &&
          declaration.isDefaultExport() &&
          _hasReferencingDefaultImport(sourceFile)
        ) {
          return;
        }

        if (!identifier) {
          if (declaration.isKind(ts.SyntaxKind.Identifier)) {
            identifier = declaration;
          } else if (
            declaration.isKind(ts.SyntaxKind.ArrowFunction) ||
            declaration.isKind(ts.SyntaxKind.ObjectLiteralExpression) ||
            declaration.isKind(ts.SyntaxKind.ArrayLiteralExpression) ||
            declaration.isKind(ts.SyntaxKind.StringLiteral) ||
            declaration.isKind(ts.SyntaxKind.NumericLiteral)
          ) {
            // No ReferenceFindableNode/Identifier available for anonymous default exports, let's go the extra mile
            if (!_hasReferencingDefaultImport(sourceFile)) {
              fakeIdentifier = 'default';
            }
          } else if (
            declaration.isKind(ts.SyntaxKind.FunctionDeclaration) ||
            declaration.isKind(ts.SyntaxKind.TypeAliasDeclaration) ||
            declaration.isKind(ts.SyntaxKind.InterfaceDeclaration)
          ) {
            identifier = declaration.getFirstChildByKind(ts.SyntaxKind.Identifier);
          } else if (declaration.isKind(ts.SyntaxKind.PropertyAccessExpression)) {
            identifier = declaration.getLastChildByKind(ts.SyntaxKind.Identifier);
          } else {
            identifier = declaration.getFirstDescendantByKind(ts.SyntaxKind.Identifier);
          }
        }

        if (identifier || fakeIdentifier) {
          const identifierText = fakeIdentifier ?? identifier?.getText() ?? '*';

          const refs = _findReferences(identifier);

          if (refs.length === 0) {
            issues.add({ type: 'exports', filePath, symbol: identifierText });
          } else {
            if (hasExternalReferences(refs, filePath)) return;

            // No more reasons left to think this identifier is used somewhere else, report it as unreferenced. If
            // it's on a namespace somewhere, report it in a separate issue type.
            if (_findReferencingNamespaceNodes(sourceFile).length > 0) {
              if (type) {
                issues.add({ type: 'nsTypes', filePath, symbol: identifierText, symbolType: type });
              } else {
                issues.add({ type: 'nsExports', filePath, symbol: identifierText });
              }
            } else if (type) {
              issues.add({ type: 'types', filePath, symbol: identifierText, symbolType: type });
            } else {
              issues.add({ type: 'exports', filePath, symbol: identifierText });
            }
          }
        }
      });
    });

    return issues;
  }
}
