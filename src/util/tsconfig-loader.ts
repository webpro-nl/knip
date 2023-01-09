import { getTsconfig } from 'get-tsconfig';
import { ensurePosixPath } from './glob.js';

const isEqualPath = (inPath: string, outPath: string) => ensurePosixPath(inPath) === ensurePosixPath(outPath);

export const loadTSConfig = (tsConfigFilePath: string) => {
  try {
    const config = getTsconfig(tsConfigFilePath);
    if (config && isEqualPath(tsConfigFilePath, config.path)) return config.config;
  } catch (error) {
    // TODO
  }
};
