export type BaseStyleLintConfig = {
  customSyntax?: string | object;
  extends?: string | string[];
  plugins?: string[];
};

export type StyleLintConfig = BaseStyleLintConfig & {
  overrides: BaseStyleLintConfig[];
};
