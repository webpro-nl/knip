import mdx from '@mdx-js/rollup';
import { DEFAULT_EXTENSIONS, fileRoutes as pages, treeShake } from 'filesystem-routing/vite';
import * as routing from 'filesystem-routing/vite';

const extension = 'tsx';

export default {
  plugins: [
    mdx(),
    pages({ extensions: ['tsx'], dir: 'src/pages', httpMethods: false }),
    pages({ httpMethods: ['GET'], dir: 'src/api', extensions: ['ts'] }),
    routing.fileRoutes({ dir: 'src/namespaced', extensions: ['ts'] }),
    treeShake(),
    pages({ dir: 'src/(pages)', extensions: ['tsx'] }),
    pages({ dir: 'src/[locale]', extensions: ['ts'] }),
    pages({ dir: '', extensions: ['jsx'] }),
    pages({ dir: 'src/spread', extensions: [...DEFAULT_EXTENSIONS] }),
    pages({ dir: 'src/mixed', extensions: [...DEFAULT_EXTENSIONS, 'mdx'] }),
    pages({ dir: 'src/dynamic', extensions: [extension, 'mdx'] }),
    pages({ dir: 'src/empty', extensions: [] }),
  ],
};
