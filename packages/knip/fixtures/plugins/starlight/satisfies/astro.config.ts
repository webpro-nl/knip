import starlight from '@astrojs/starlight';
import type { StarlightUserConfig } from '@astrojs/starlight/types';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Docs',
      components: {
        Head: './components/Head.astro',
      },
    } satisfies StarlightUserConfig),
  ],
});
