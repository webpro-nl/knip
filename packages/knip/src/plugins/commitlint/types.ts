export type CommitLintConfig = {
  extends?: string | string[];
  plugins?: string[];
  formatter?: string;
  parserPreset?: string | ParserPreset | Promise<ParserPreset>;
};

type ParserPreset = {
  name?: string;
  path?: string;
  parserOpts?: unknown;
};
