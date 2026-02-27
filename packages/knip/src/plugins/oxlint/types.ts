type JsPlugin =
  | string
  | {
      name: string;
      specifier: string;
    };

type Override = {
  jsPlugins?: JsPlugin[];
};

export type OxlintConfig = {
  jsPlugins?: JsPlugin[];
  overrides?: Override[];
};
