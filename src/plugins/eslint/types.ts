export type ESLintConfig = {
  extends?: string | string[];
  parser?: string;
  parserOptions?: {
    babelOptions?: {
      presets: string[];
    };
  };
  plugins?: string[];
  settings?: Record<string, Record<string, unknown>>;
  overrides?: { files: string[] }[];
};
