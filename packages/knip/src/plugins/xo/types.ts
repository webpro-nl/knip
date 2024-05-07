import type { ESLintConfig } from '../eslint/types.js';

export type XOConfig = ESLintConfig & {
  envs?: string[] | undefined;
  globals?: string[] | undefined;
  ignores?: string[] | undefined;
  nodeVersion?: string | boolean | undefined;
  prettier?: boolean | undefined;
  printConfig?: string | undefined;
  semicolon?: boolean | undefined;
  space?: boolean | number | undefined;
  webpack?: boolean | object | undefined;
};
