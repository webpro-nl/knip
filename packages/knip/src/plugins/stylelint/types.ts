export type BaseStyleLintConfig = {
  customSyntax?: unknown;
  extends?: string | string[];
  plugins?: unknown[];
};

export type StyleLintConfig = BaseStyleLintConfig & {
  overrides: BaseStyleLintConfig[];
};
