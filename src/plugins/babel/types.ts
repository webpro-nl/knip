export type BabelConfig = {
  plugins?: (string | [string, unknown])[];
  presets?: (string | [string, unknown])[];
  env?: Record<string, BabelConfig>;
};
