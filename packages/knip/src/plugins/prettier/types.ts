export type PrettierOptions = {
  plugins?: (
    | string
    | {
        parsers?: Record<string, unknown>;
        printers?: Record<string, unknown>;
        languages?: unknown[];
        options?: Record<string, unknown>;
      }
  )[];
};

export type PrettierConfig = PrettierOptions & {
  overrides?: {
    options?: PrettierOptions;
  }[];
};
