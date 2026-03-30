type ParserOptions = {
  project?: string;
  parser?: string;
  babelOptions?: {
    plugins: string[];
    presets: string[];
  };
};

type Settings = Record<string, Record<string, unknown> | string>;

type Rules = Record<string, string | number>;

type BaseConfig = {
  extends?: string | string[];
  parser?: string;
  parserOptions?: ParserOptions;
  processor?: string;
  plugins?: string[];
  settings?: Settings;
  rules?: Rules;
};

export type ESLintConfig = BaseConfig[];

export type OverrideConfigDeprecated = BaseConfig & { files: string[]; overrides: OverrideConfigDeprecated };

export type ESLintConfigDeprecated = BaseConfig & {
  env?: Record<string, boolean>;
  overrides?: OverrideConfigDeprecated[];
};
