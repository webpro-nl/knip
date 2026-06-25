import type { ESLintConfig, ESLintConfigDeprecated } from '../eslint/types.ts';

// https://github.com/xojs/xo/blob/41b9bb952548cab10b67d77a5c61312667b9763d/lib/types.ts#L91
type XOConfigItem = ESLintConfig[number] & {
  files?: string | Array<string | string[]> | undefined;
  ignores?: string | string[] | undefined;
  prettier?: boolean | 'compat' | undefined;
  semicolon?: boolean | undefined;
  space?: boolean | number | string | undefined;
};

// https://github.com/xojs/xo/tree/09cfbd1934a05abf39e6e77dee8fb85d25760390#config
type XOV0Config = ESLintConfigDeprecated & {
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

export type XOConfig = XOV0Config | XOConfigItem | XOConfigItem[];
