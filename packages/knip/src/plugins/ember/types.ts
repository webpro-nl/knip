export type EmberAddonConfig = {
  version?: number;
  main?: string;
  paths?: string[];
  'renamed-modules'?: Record<string, string>;
  [key: string]: unknown;
};

export type EmberPackage = {
  name?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  'ember-addon'?: EmberAddonConfig;
};
