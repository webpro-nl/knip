export type SemanticReleaseConfig = {
  extends?: string | string[];
  plugins?: (string | [string, Record<string, unknown>])[];
};
