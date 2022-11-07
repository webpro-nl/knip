import path from 'node:path';
import { register } from 'esbuild-register/dist/node.js';
import { loadJSON } from './fs.js';

register();

export default async (filePath: string) => {
  if (path.extname(filePath) === '.json' || /rc$/.test(filePath)) {
    return loadJSON(filePath);
  }
  try {
    const imported = await import(filePath);
    return imported.default ?? imported;
  } catch (error) {
    console.log('Failed to load ' + filePath);
    console.log(error);
  }
};
