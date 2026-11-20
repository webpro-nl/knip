import { defineConfig } from 'vite-plus';
import { sharedTasks } from './tooling/tasks.ts';

export default defineConfig({
  run: {
    tasks: {
      sprite: {
        command: 'node scripts/build-sprite.ts',
      },
      fonts: 'node scripts/subset-fonts.ts',
      ...sharedTasks,
    },
  },
  staged: {
    '*.ts': 'node scripts/check-format.ts',
  },
});
