type ParserOptions = {
  project?: string;
  babelOptions?: {
    presets: string[];
  };
};

type Settings = Record<string, Record<string, unknown>>;

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

type OverrideConfig = BaseConfig & { files: string[] };

export type ESLintConfig = BaseConfig & {
  env?: Record<string, boolean>;
  overrides?: OverrideConfig[];
};
