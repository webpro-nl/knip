export type MarkdownlintConfig = {
  config?: {
    extends?: string;
  };
  customRules?: unknown[];
  extends?: string;
  markdownItPlugins?: unknown[];
  outputFormatters?: unknown[];
};
