import ts from 'typescript';
import { stripQuotes } from '../../ast-helpers.js';
import { hasImportSpecifier } from '../helpers.js';
import { scriptVisitor as visit } from '../index.js';

const tags = new Set(['$', '$sync']);
const methods = new Set(['execa', 'execaSync', 'execaCommand', 'execaCommandSync', '$sync']);

export default visit(
  sourceFile => sourceFile.statements.some(node => hasImportSpecifier(node, 'execa')),
  node => {
    if (ts.isTaggedTemplateExpression(node)) {
      if (tags.has(node.tag.getText()) || (ts.isCallExpression(node.tag) && tags.has(node.tag.expression.getText()))) {
        return stripQuotes(node.template.getText());
      }
    }

    if (ts.isCallExpression(node)) {
      const functionName = node.expression.getText();
      if (methods.has(functionName)) {
        if (functionName.startsWith('execaCommand')) {
          if (node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
            return stripQuotes(node.arguments[0].getText());
          }
        } else {
          const [executable, args] = node.arguments;
          if (executable && ts.isStringLiteral(executable)) {
            const executableStr = stripQuotes(executable.getText());
            if (args && ts.isArrayLiteralExpression(args)) {
              const argStrings = args.elements.filter(ts.isStringLiteral).map(arg => stripQuotes(arg.getText()));
              return [executableStr, ...argStrings].join(' ');
            }
            return executableStr;
          }
        }
      }
    }
  }
);
