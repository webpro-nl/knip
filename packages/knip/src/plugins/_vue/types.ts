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
  ifConditions?: { block: TemplateAstNode }[];
  scopedSlots?: Record<string, TemplateAstNode>;
}

interface DescriptorBlock {
  content: string;
  lang?: string;
}

interface Descriptor {
  script: DescriptorBlock | null;
  scriptSetup: DescriptorBlock | null;
  template: (DescriptorBlock & { ast?: TemplateAstNode }) | null;
}

export interface VueSfc {
  parse: (source: string, path: string) => { descriptor: Descriptor };
  compileTemplate?: (
    source: string,
    path: string,
    isTS: boolean,
    preprocessLang?: string
  ) => { ast?: TemplateAstNode; code: string };
}

export interface AutoImportMaps {
  importMap: Map<string, string>;
  componentMap: Map<string, string[]>;
}
