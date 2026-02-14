export interface NuxtConfig {
  srcDir?: string;
  buildDir?: string;
  serverDir?: string;
  dir?: {
    pages?: string;
    layouts?: string;
    middleware?: string;
    plugins?: string;
  };
  modules?: Array<string | ((inlineOptions: any, nuxt: any) => any) | [string, Record<string, any>]>;
  imports?: {
    autoImport?: boolean;
    dirs?: string[];
  };
  components?: {
    dirs?: Array<string | { path: string }>;
  };
  css?: string[];
  alias?: Record<string, string>
}

export interface TemplateExpressionNode {
  content: string;
  isStatic: boolean;
}

export interface TemplateAstProp {
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

export interface Descriptor {
  script: { content: string } | null;
  scriptSetup: { content: string } | null;
  template: { content: string; ast?: TemplateAstNode } | null;
}

export type VueSfc = { parse: (source: string, path: string) => { descriptor: Descriptor } };
