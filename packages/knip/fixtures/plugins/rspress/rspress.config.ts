import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginLlms } from '@rspress/plugin-llms';

export default defineConfig({
  root: path.join(__dirname, 'guide'),
  themeDir: 'custom-theme',
  globalStyles: path.join(__dirname, 'src/styles/global.scss'),
  globalUIComponents: [
    path.join(__dirname, 'src/components/Banner.tsx'),
    [path.join(__dirname, 'src/components/Announcement.tsx'), { title: 'Hello' }],
  ],
  markdown: {
    globalComponents: [path.join(__dirname, 'src/components/Callout.tsx')],
  },
  search: {
    searchHooks: path.join(__dirname, 'src/search-hooks.ts'),
  },
  route: {
    exclude: ['drafts/**'],
  },
  plugins: [pluginLlms()],
  builderConfig: {
    resolve: {
      alias: {
        '@shared': './src/shared',
      },
    },
    source: {
      preEntry: './src/polyfills.ts',
    },
  },
});
