import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: 'project-id',
    dataset: 'production',
  },
});
