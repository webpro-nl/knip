import { TsConfigJson } from 'type-fest';
import ts from 'typescript';

export const loadTSConfig = async (tsConfigFilePath: string) => {
  try {
    const config = ts.readConfigFile(tsConfigFilePath, ts.sys.readFile);
    if (!config.error) return config.config as TsConfigJson;
  } catch (error) {
    // TODO
  }
};
