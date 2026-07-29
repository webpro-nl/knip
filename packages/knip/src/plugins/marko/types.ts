export type MarkoTaglib = {
  'tags-dir'?: string | string[];
  exports?: string | string[];
};

export type MarkoTagDef = {
  template?: string;
  renderer?: string;
  parse?: string;
  migrate?: string;
  transform?: string;
  analyze?: string;
  translate?: string;
};
