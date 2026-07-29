export type MarkoTaglib = {
  'tags-dir'?: string | string[];
  exports?: string | string[];
};

export type MarkoTagDef = {
  template?: string;
  renderer?: string;
  transformer?: string | string[];
  transform?: string | string[];
  migrator?: string;
  migrate?: string;
  'code-generator'?: string;
  translate?: string;
  'node-factory'?: string;
  parse?: string;
  analyze?: string;
};
