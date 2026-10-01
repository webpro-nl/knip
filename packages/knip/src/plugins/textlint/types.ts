export type TextlintConfig = {
  rules?: Record<string, unknown>;
  filters?: Record<string, unknown>;
  plugins?: string[] | Record<string, unknown>;
};
