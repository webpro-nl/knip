import type { FunctionsConfig } from './types.js';

export const extractFunctionsConfigProperty = (config: FunctionsConfig, property: keyof FunctionsConfig) => [
  ...(config[property] ?? []),
  ...(Object.values(config).filter(x => typeof x === 'object' && property in x) as FunctionsConfig[]).flatMap(
    x => x[property] || []
  ),
];
