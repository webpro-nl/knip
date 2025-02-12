export type BaseStyleLintConfig = {
  customSyntax?: unknown;
  extends?: string | string[];
  plugins?: string[];
};

export type StyleLintConfig = BaseStyleLintConfig & {
  overrides: BaseStyleLintConfig[];
};
