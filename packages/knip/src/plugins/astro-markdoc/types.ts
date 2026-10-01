export type MarkdocRenderSpecifier = string | { [key: string]: unknown };

type MarkdocRenderableNode = {
  render?: MarkdocRenderSpecifier;
  [key: string]: unknown;
};

export type MarkdocConfig = {
  nodes?: Record<string, MarkdocRenderableNode>;
  tags?: Record<string, MarkdocRenderableNode>;
};
