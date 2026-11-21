import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    '*.ts': 'vp check --fix',
  },
});
