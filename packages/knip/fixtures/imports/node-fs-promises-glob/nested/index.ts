import { glob } from 'node:fs/promises';

glob('*.ts', { cwd: 'workspace-cwd' });
glob('workspace-default/*.ts');
