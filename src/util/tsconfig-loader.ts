import { parseTsconfig } from 'get-tsconfig';
import { isFile } from './fs.js';
import { logIfDebug } from './log.js';

export const loadTSConfig = async (tsConfigFilePath: string) => {
  try {
    if (isFile(tsConfigFilePath)) {
      return parseTsconfig(tsConfigFilePath);
    }
  } catch (error) {
    // get-tsconfig throws for `extends` like `@tsconfig/node16` (but this is still handled in typescript plugin)
    logIfDebug(error);
  }
};
