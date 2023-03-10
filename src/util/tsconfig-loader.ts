import path from 'node:path';
import ts from 'typescript';
import { isFile } from './fs.js';

export const loadTSConfig = async (tsConfigFilePath: string) => {
  if (isFile(tsConfigFilePath)) {
    const config = ts.readConfigFile(tsConfigFilePath, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(tsConfigFilePath));
    return parsedConfig.options ?? {};
  }
  return {};
};
