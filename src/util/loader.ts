import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { load as esmLoad } from '@esbuild-kit/esm-loader';
import yaml from 'js-yaml';
import parsedArgs from './cli-arguments.js';
import { loadJSON } from './fs.js';
import { timerify } from './performance.js';

const require = createRequire(process.cwd());

const {
  values: { 'no-progress': noProgress = false },
} = parsedArgs;

const load = async (filePath: string) => {
  try {
    if (path.extname(filePath) === '.json' || /rc$/.test(filePath)) {
      return loadJSON(filePath);
    }

    if (path.extname(filePath) === '.yaml' || path.extname(filePath) === '.yml') {
      return yaml.load((await fs.readFile(filePath)).toString());
    }

    const imported = await esmLoad(filePath, {}, require);
    return imported.default ?? imported;
  } catch (error: unknown) {
    if (noProgress) {
      // Such console logs destroy fancy progress output, will be reported when --no-progress or --debug
      console.log('Failed to load ' + filePath);
      console.log(error?.toString());
    }
  }
};

export const _load = timerify(load);
