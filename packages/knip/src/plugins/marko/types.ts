export type MarkoTaglib = {
  'taglib-id'?: string;
  'tags-dir'?: string | string[];
  exports?: string | string[];
  'taglib-imports'?: string | string[];
  tags?: Record<string, unknown>;
};

/**
 * Something a template depends on without importing it: a sibling file as a specifier, or the body of
 * an inline `style` block as `code`. The `path` of such a block is the template itself.
 */
export type MarkoDep = string | { type?: string; path?: string; code?: string; virtualPath?: string };

/** Subset of the `compileSync` result this plugin reads */
export type CompileResult = {
  code: string;
  meta: { deps?: MarkoDep[] };
};

/** Subset of `@marko/compiler`, loaded from the project so it matches the Marko version in use */
export type MarkoCompiler = {
  configure: (config: object) => void;
  compileSync: (source: string, path: string, config?: object) => CompileResult;
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
