import { fileURLToPath } from 'node:url';

export default {
  build: {
    rollupOptions: {
      input: {
        nested: 'nested/index.html',
        admin: 'pages/admin.html',
        settings: fileURLToPath(new URL('pages/settings.html', import.meta.url)),
      },
    },
  },
};
