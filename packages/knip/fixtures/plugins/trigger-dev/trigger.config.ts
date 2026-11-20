import { defineConfig } from '@trigger.dev/sdk';

export default defineConfig({
  project: 'proj_fixture',
  dirs: ['./src/jobs'],
  maxDuration: 3600,
});
