import mdx from '@mdx-js/rollup';
import { DEFAULT_EXTENSIONS, fileRoutes as pages } from 'filesystem-routing/vite';

export default {
  plugins: [
    mdx(),
    pages(),
    pages({ extensions: ['tsx'], dir: 'src/pages', httpMethods: false }),
    pages({ httpMethods: ['GET'], dir: 'src/api', extensions: ['ts'] }),
    pages({ dir: 'src/(pages)', extensions: ['tsx'] }),
    pages({ dir: '', extensions: ['jsx'] }),
    pages({ dir: 'src/mixed', extensions: [...DEFAULT_EXTENSIONS, 'mdx'] }),
    pages({ dir: 'src/empty', extensions: [] }),
  ],
};
