import { glob } from 'node:fs/promises';

export const nestedFiles = glob('*.ts', { cwd: './' });
export const parentMigrationFiles = glob('../migrations/*.ts');
