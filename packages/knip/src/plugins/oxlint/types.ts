import type { Settings } from '../eslint/types.ts';

type JsPlugin =
  | string
  | {
      name: string;
      specifier: string;
    };

type Override = {
  settings?: Settings;
  jsPlugins?: JsPlugin[];
};

export type OxlintConfig = {
  extends?: (string | OxlintConfig)[];
  jsPlugins?: JsPlugin[];
  overrides?: Override[];
  settings?: Settings;
};
