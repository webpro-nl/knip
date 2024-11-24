import ts from 'typescript';
import { FIX_FLAGS } from '../../../constants.js';
import type { Fix } from '../../../types/exports.js';
import { getDefaultKeywordNode, getExportKeywordNode } from '../../ast-helpers.js';
import { jsxComponentVisitor as visit } from '../index.js';

export default visit(
  () => true,
  (node, { isFixComponentProps }) => {
    const exportKeyword = getExportKeywordNode(node);

    if (exportKeyword) {
      const getFix = (node: ts.Node, defaultKeyword?: ts.Node): Fix =>
        isFixComponentProps ? [node.getStart(), (defaultKeyword ?? node).getEnd() + 1, FIX_FLAGS.NONE] : undefined;

      if (ts.isVariableStatement(node)) {
        return node.declarationList.declarations.flatMap(declaration => {
          if (ts.isObjectBindingPattern(declaration.name)) {
            return [];
          }
          if (ts.isArrayBindingPattern(declaration.name)) {
            return [];
          }

          const props = findReactComponentProps(declaration);
          if (props) {
            const identifier = declaration.name.getText();
            return {
              node,
              identifier,
              propsPos: props.getStart(),
              fix: getFix(node),
            };
          }

          return [];
        });
      }

      const defaultKeyword = getDefaultKeywordNode(node);
      if (ts.isFunctionDeclaration(node)) {
        const name = defaultKeyword ? 'default' : node.name?.getText();
        if (
          ts.isFunctionDeclaration(node) &&
          (!node.name || isComponentName(node.name.getText())) &&
          node.parameters.length >= 1 &&
          ((ts.isIdentifier(node.parameters[0].name) && node.parameters[0].name.getText() === 'props') ||
            ts.isObjectBindingPattern(node.parameters[0].name)) &&
          node.parameters[0].type &&
          ts.isTypeReferenceNode(node.parameters[0].type) &&
          ts.isIdentifier(node.parameters[0].type.typeName)
        ) {
          // Declaration of type of the form `function Component(props: Something) {}`
          // and `function Component({destructured, prop}:
          const props = node.parameters[0].type.typeName;
          if (props && name) {
            return {
              node,
              identifier: name,
              propsPos: props.getStart(),
              fix: getFix(node),
            };
          }
        }
      }

      if (ts.isClassDeclaration(node) && node.name) {
        if (ts.isIdentifier(node.name) && isComponentName(node.name.getText()) && node.heritageClauses?.length) {
          for (const clause of node.heritageClauses) {
            for (const type of clause.types) {
              if (
                ts.isExpressionWithTypeArguments(type) &&
                ts.isPropertyAccessExpression(type.expression) &&
                type.expression.expression.getText() === 'React' &&
                ['Component', 'ComponentClass'].includes(type.expression.name.getText()) &&
                type.typeArguments?.length &&
                ts.isTypeReferenceNode(type.typeArguments[0]) &&
                ts.isIdentifier(type.typeArguments[0].typeName)
              ) {
                const props = type.typeArguments[0].typeName;
                const identifier = defaultKeyword ? 'default' : node.name.getText();

                return {
                  node,
                  identifier,
                  propsPos: props.getStart(),
                  fix: getFix(node),
                };
              }
            }
          }
        }
      }
    }
  }
);

function isComponentName(name: string): boolean {
  return name.charAt(0) === name.charAt(0).toUpperCase();
}

function findReactComponentProps(node: ts.Node): ts.Identifier | null {
  if (ts.isVariableDeclaration(node)) {
    if (!node.initializer || !isComponentName(node.name.getText())) {
      return null;
    }
    if (
      node.type &&
      ts.isTypeReferenceNode(node.type) &&
      ts.isQualifiedName(node.type.typeName) &&
      node.type.typeName.left.getText() === 'React' &&
      ['VFC', 'FC', 'FunctionComponent', 'VoidFunctionComponent'].includes(node.type.typeName.right.getText()) &&
      node.type.typeArguments &&
      node.type.typeArguments.length === 1 &&
      ts.isTypeReferenceNode(node.type.typeArguments[0]) &&
      ts.isIdentifier(node.type.typeArguments[0].typeName)
    ) {
      // Declaration of type of the form `const Component: React.VFC<Something>`
      return node.type.typeArguments[0].typeName;
    }
    if (
      node.initializer &&
      ts.isArrowFunction(node.initializer) &&
      node.initializer.parameters.length >= 1 &&
      ts.isIdentifier(node.initializer.parameters[0].name) &&
      node.initializer.parameters[0].name.getText() === 'props' &&
      node.initializer.parameters[0].type &&
      ts.isTypeReferenceNode(node.initializer.parameters[0].type) &&
      ts.isIdentifier(node.initializer.parameters[0].type.typeName)
    ) {
      // Declaration of type of the form `const Component = (props: Something) => {}`
      return node.initializer.parameters[0].type.typeName;
    }
    if (
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isPropertyAccessExpression(node.initializer.expression) &&
      node.initializer.expression.expression.getText() === 'React' &&
      node.initializer.expression.name.getText() === 'memo' &&
      node.initializer.typeArguments &&
      node.initializer.typeArguments.length &&
      ts.isTypeReferenceNode(node.initializer.typeArguments[0]) &&
      ts.isIdentifier(node.initializer.typeArguments[0].typeName)
    ) {
      // Declaration of type of the form `const Component = React.memo<Something>((props) => {})`
      return node.initializer.typeArguments[0].typeName;
    }
    if (
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isPropertyAccessExpression(node.initializer.expression) &&
      node.initializer.expression.expression.getText() === 'React' &&
      node.initializer.expression.name.getText() === 'memo' &&
      node.initializer.arguments.length > 0 &&
      ts.isArrowFunction(node.initializer.arguments[0]) &&
      node.initializer.arguments[0].parameters.length >= 1 &&
      ts.isIdentifier(node.initializer.arguments[0].parameters[0].name) &&
      node.initializer.arguments[0].parameters[0].name.getText() === 'props' &&
      node.initializer.arguments[0].parameters[0].type &&
      ts.isTypeReferenceNode(node.initializer.arguments[0].parameters[0].type) &&
      ts.isIdentifier(node.initializer.arguments[0].parameters[0].type.typeName)
    ) {
      // Declaration of type of the form `const Component = React.memo((props: Something) => {})`
      return node.initializer.arguments[0].parameters[0].type.typeName;
    }
  }

  return null;
}
