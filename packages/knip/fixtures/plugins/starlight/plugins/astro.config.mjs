import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Docs',
      plugins: [
        starlightBlog({
          title: 'Blog',
        }),
      ],
    }),
  ],
});
