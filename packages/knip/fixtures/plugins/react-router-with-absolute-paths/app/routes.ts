import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));

export default [
  { file: resolve(dir, 'routes/home.tsx'), index: true },
  {
    file: resolve(dir, 'routes/layout.tsx'),
    children: [{ file: resolve(dir, 'routes/child.tsx') }],
  },
];
