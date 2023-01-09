import { parseTsconfig } from 'get-tsconfig';
import { isFile } from './fs.js';

export const loadTSConfig = async (tsConfigFilePath: string) => {
  try {
    if (await isFile(tsConfigFilePath)) {
      return parseTsconfig(tsConfigFilePath);
    }
  } catch (error) {
    // TODO
  }
};
