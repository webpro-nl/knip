import type { FunctionsConfig } from './types.js';

export const NETLIFY_FUNCTIONS_EXTS = 'js,mjs,cjs,ts,mts,cts';

export const extractFunctionsConfigProperty = (config: FunctionsConfig, property: keyof FunctionsConfig) => [
  ...(config[property] ?? []),
  ...(Object.values(config).filter(x => typeof x === 'object' && property in x) as FunctionsConfig[]).flatMap(
    x => x[property] || []
  ),
];
