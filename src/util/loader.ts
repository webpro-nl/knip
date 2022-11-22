import { createRequire } from 'node:module';
import path from 'node:path';
import { load } from '@esbuild-kit/esm-loader';
import { loadJSON } from './fs.js';

const require = createRequire(process.cwd());

const loader = async (filePath: string) => {
  if (path.extname(filePath) === '.json' || /rc$/.test(filePath)) {
    return loadJSON(filePath);
  }
  try {
    const imported = await load(filePath, {}, require);
    return imported.default ?? imported;
  } catch (error: unknown) {
    console.log('Failed to load ' + filePath);
    console.log(error?.toString());
  }
};

export default loader;
