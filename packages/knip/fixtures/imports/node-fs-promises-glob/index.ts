import { glob } from 'node:fs/promises';
import * as fsPromises from 'node:fs/promises';
import './nested/index.ts';
import path from 'node:path';

const { glob: requireGlob } = require('node:fs/promises');
const { 'glob': literalKeyGlob } = require('node:fs/promises');
const staticCwd = './migrations';
const dynamicPattern = process.env.PATTERN ?? 'dynamic/*.ts';

export const migrationFiles = glob('*.ts', { cwd: './migrations' });
export const namespaceMigrationFiles = fsPromises.glob('*.ts', { cwd: './migrations' });
export const commonJsMigrationFiles = requireGlob('*.ts', { cwd: './migrations' });
export const literalKeyMigrationFiles = literalKeyGlob('*.ts', { cwd: './migrations' });
export const computedCwdMigrationFiles = glob('*.ts', { ['cwd']: './migrations' });
export const rootFiles = glob('root/*.ts');
export const emptyOptionsRootFiles = glob('root/*.ts', {});
export const staticArrayFiles = glob(['root/*.ts', 'migrations/*.ts']);
export const dynamicCwdFiles = glob('dynamic/*.ts', { cwd: process.cwd() });
export const dynamicResolvedCwdFiles = glob('*.ts', { cwd: path.resolve('migrations') });
export const identifierCwdFiles = glob('*.ts', { cwd: staticCwd });
export const dynamicPatternFiles = glob([dynamicPattern, 'dynamic/*.ts']);
