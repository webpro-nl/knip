import { api } from './helpers.js';

export type BabelConfigFn = (options: typeof api) => BabelConfig;

export type BabelConfig = {
  plugins?: (string | [string, unknown])[];
  presets?: (string | [string, unknown])[];
  env?: Record<string, BabelConfig>;
};
