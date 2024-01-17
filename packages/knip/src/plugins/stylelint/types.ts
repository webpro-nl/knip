export type BaseStyleLintConfig = {
  extends?: string | string[];
  plugins?: string[];
};

export type StyleLintConfig = BaseStyleLintConfig & {
  overrides: BaseStyleLintConfig[];
};
