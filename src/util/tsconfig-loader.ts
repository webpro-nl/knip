import { parseTsconfig } from 'get-tsconfig';
import { isFile } from './fs.js';

export const loadTSConfig = async (tsConfigFilePath: string) => {
  try {
    if (isFile(tsConfigFilePath)) {
      return parseTsconfig(tsConfigFilePath);
    }
  } catch (error) {
    // get-tsconfig throws for external `extends` like `@tsconfig/node16` (but this is still handled in typescript plugin)
    if (error instanceof Error && !/File '[^.].+' not found/.test(error.message)) {
      throw error;
    }
  }
};
