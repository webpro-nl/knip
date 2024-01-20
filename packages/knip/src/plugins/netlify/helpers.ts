import { DEFAULT_EXTENSIONS } from 'src/constants.js';
import type { FunctionsConfig } from './types.js';

export const validFunctionExtensions = () =>
  DEFAULT_EXTENSIONS.filter(ext => !ext.endsWith('x'))
    .map(ext => ext.slice(1))
    .join(',');

export const extractFunctionsConfigProperty = (config: FunctionsConfig, property: keyof FunctionsConfig) => [
  ...(config[property] ?? []),
  ...(Object.values(config).filter(x => typeof x === 'object' && property in x) as FunctionsConfig[]).flatMap(
    x => x[property] || []
  ),
];
