import ts from 'typescript';
import { findDescendants, getImportMap, stripQuotes } from '../../typescript/ast-helpers.js';

const CLIENT_MAPPING: Record<string, string[]> = {
  pg: ['pg'],
  postgres: ['pg'],
  postgresql: ['pg'],
  mysql: ['mysql', 'mysql2'],
  mysql2: ['mysql2'],
  sqlite3: ['sqlite3'],
  'better-sqlite3': ['better-sqlite3'],
  mssql: ['tedious'],
  tedious: ['tedious'],
  oracledb: ['oracledb'],
  oracle: ['oracledb'],
  cockroachdb: ['pg'],
  redshift: ['pg'],
};

export const clientToPackages = (client: string): string[] => {
  const normalizedClient = client.toLowerCase();
  return CLIENT_MAPPING[normalizedClient] ?? [];
};

const getClientFromObjectLiteral = (node: ts.ObjectLiteralExpression): string | undefined => {
  for (const prop of node.properties) {
    if (ts.isPropertyAssignment(prop) && prop.name.getText() === 'client') {
      if (ts.isStringLiteral(prop.initializer)) {
        return stripQuotes(prop.initializer.text);
      }
    }
  }
};

/**
 * Traverses through source file to find knex() instantiations
 * and extract the client property value
 */
export const getKnexClients = (sourceFile: ts.SourceFile): string[] => {
  const clients: string[] = [];
  const importMap = getImportMap(sourceFile);
  const knexImportNames = new Set<string>();

  for (const [importName, importPath] of importMap) {
    if (importPath === 'knex') {
      knexImportNames.add(importName);
    }
  }

  if (knexImportNames.size === 0) {
    knexImportNames.add('knex');
  }

  const callExpressions = findDescendants<ts.CallExpression>(sourceFile, node => ts.isCallExpression(node));

  for (const callExpr of callExpressions) {
    if (ts.isIdentifier(callExpr.expression) && knexImportNames.has(callExpr.expression.text)) {
      if (callExpr.arguments.length > 0) {
        const firstArg = callExpr.arguments[0];

        if (ts.isObjectLiteralExpression(firstArg)) {
          const client = getClientFromObjectLiteral(firstArg);
          if (client) {
            clients.push(client);
          }
        }
      }
    }
  }

  return clients;
};
