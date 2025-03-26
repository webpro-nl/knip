import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [
    starlight({
      components: {
        Head: './components/Head.astro',
        Footer: './components/Footer.astro',
      },
    }),
  ],
});
