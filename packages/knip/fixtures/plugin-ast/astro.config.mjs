import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [
    starlight({
      components: {
        Head: './src/components/Head.astro',
        Footer: './src/components/Footer.astro',
      },
    }),
  ],
});
