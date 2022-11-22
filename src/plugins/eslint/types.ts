export type ESLintConfig = {
  parser?: string;
  parserOptions?: {
    babelOptions?: {
      presets: string[];
    };
  };
  plugins?: string[];
  settings?: Record<string, Record<string, unknown>>;
};
