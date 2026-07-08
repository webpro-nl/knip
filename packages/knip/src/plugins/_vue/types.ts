interface TemplateExpressionNode {
  content: string;
  isStatic: boolean;
}

interface TemplateAstProp {
  type: number;
  exp?: TemplateExpressionNode;
  arg?: TemplateExpressionNode;
}

export interface TemplateAstNode {
  type?: number;
  tag?: string;
  props?: TemplateAstProp[];
  content?: TemplateExpressionNode;
  children?: TemplateAstNode[];
}

interface Descriptor {
  script: { content: string } | null;
  scriptSetup: { content: string } | null;
  template: { content: string; ast?: TemplateAstNode } | null;
}

export type VueSfc = { parse: (source: string, path: string) => { descriptor: Descriptor } };

export interface AutoImportMaps {
  importMap: Map<string, string>;
  componentMap: Map<string, string[]>;
}
