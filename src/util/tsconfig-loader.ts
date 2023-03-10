import ts from 'typescript';
import { isFile } from './fs.js';

export const loadTSConfig = async (tsConfigFilePath: string) => {
  if (isFile(tsConfigFilePath)) {
    const config = ts.readConfigFile(tsConfigFilePath, ts.sys.readFile);
    return config.config.compilerOptions;
  }
};
