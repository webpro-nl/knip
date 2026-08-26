import { glob } from 'node:fs/promises';
import * as fsPromises from 'node:fs/promises';

const { glob: requireGlob } = require('node:fs/promises');

export const migrationFiles = glob('*.ts', { cwd: './migrations' });
export const namespaceMigrationFiles = fsPromises.glob('*.ts', { cwd: './migrations' });
export const commonJsMigrationFiles = requireGlob('*.ts', { cwd: './migrations' });
