import type { VisitorObject } from 'oxc-parser';

export type PluginVisitorContext = {
  filePath: string;
  sourceText: string;
  addScript: (script: string) => void;
  addImport: (specifier: string, pos: number, modifiers: number) => void;
  markImportExpressionHandled: (pos: number) => void;
  addImportGlob: (
    patterns: string[],
    options?: { base?: string; cwd?: string; filter?: RegExp; analyzeExports?: boolean }
  ) => void;
  /**
   * Credit a local export as used by an in-module runtime registration (e.g. a custom element
   * registered through a framework decorator), so it isn't reported as an unused export even
   * when no other file imports it by name. Pass the local binding name (or `'default'`).
   */
  markExportRegistered: (name: string) => void;
};

export type PluginVisitorObject = VisitorObject;

export type RegisterVisitorsOptions = {
  ctx: PluginVisitorContext;
  registerVisitor: (visitor: PluginVisitorObject) => void;
  registeredPlugins: Set<string>;
};

export type RegisterVisitors = (options: RegisterVisitorsOptions) => void;
