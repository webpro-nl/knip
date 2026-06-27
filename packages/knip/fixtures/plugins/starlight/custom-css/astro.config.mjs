import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [
    starlight({
      customCss: ['./styles/used.css']
    }),
  ],
});
