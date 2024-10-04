export type BaseStyleLintConfig = {
  customSyntax?: string;
  extends?: string | string[];
  plugins?: string[];
};

export type StyleLintConfig = BaseStyleLintConfig & {
  overrides: BaseStyleLintConfig[];
};
