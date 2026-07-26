export type MarkoTaglib = {
  'taglib-id'?: string;
  'tags-dir'?: string | string[];
  exports?: string | string[];
  'taglib-imports'?: string | string[];
  tags?: Record<string, unknown>;
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
