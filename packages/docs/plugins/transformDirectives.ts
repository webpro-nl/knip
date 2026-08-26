import { defineMdastPlugin } from 'satteri';

export const transformDirectives = defineMdastPlugin({
  name: 'transform-directives',
  containerDirective(node, ctx) {
    ctx.setProperty(node, 'data', {
      hName: node.name,
      hProperties: node.attributes ?? {},
    });
  },
  leafDirective(node, ctx) {
    ctx.setProperty(node, 'data', {
      hName: node.name,
      hProperties: node.attributes ?? {},
    });
  },
  textDirective(node, ctx) {
    ctx.setProperty(node, 'data', {
      hName: node.name,
      hProperties: node.attributes ?? {},
    });
  },
});
