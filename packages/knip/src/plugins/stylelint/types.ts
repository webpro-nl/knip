interface BaseStyleLintConfig {
  customSyntax?: string;
  extends?: string | string[];
  plugins?: (string | BaseStyleLintConfig)[];
}

export interface StyleLintConfig extends BaseStyleLintConfig {
  overrides?: BaseStyleLintConfig[];
}
