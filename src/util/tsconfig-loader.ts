import ts from 'typescript';
import { isFile } from './fs.js';
import { dirname } from './path.js';

export const loadTSConfig = async (tsConfigFilePath: string) => {
  if (isFile(tsConfigFilePath)) {
    const config = ts.readConfigFile(tsConfigFilePath, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(tsConfigFilePath));
    const compilerOptions = parsedConfig.options ?? {};

    // Local declaration files pushed to `lib: []` seem not be taken into account by ts.resolveModuleName()
    // const definitionPaths = parsedConfig.fileNames.filter(filePath => filePath.endsWith('.d.ts'));
    // compilerOptions.lib = compilerOptions.lib ?? [];
    // compilerOptions.lib.push(...definitionPaths);
    const definitionPaths: string[] = [];

    return { compilerOptions, definitionPaths };
  }
  return { compilerOptions: {}, definitionPaths: [] };
};
