import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      sprite: {
        command: 'node scripts/build-sprite.ts',
      },
    },
  },
  staged: {
    '*.ts': 'node scripts/check-format.ts',
  },
});
