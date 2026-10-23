import type { Expression, ObjectExpression, Program, SpreadElement } from 'oxc-parser';
import { Visitor } from 'oxc-parser';
import { type Input, toDeferResolve } from '../../util/input.ts';
import { findProperty, getPropertyKey } from '../../typescript/ast-helpers.ts';
import { getStringValue } from '../../typescript/ast-nodes.ts';
import { isInternal } from '../../util/path.ts';
import { type ImportSettingKind, importSettingKinds, toParser } from './helpers.ts';

const isParserObjectExpression = (node: ObjectExpression) => {
  for (const prop of node.properties) {
    if (prop.type === 'SpreadElement') return true;
    const key = getPropertyKey(prop);
    if (key === 'parse' || key === 'parseForESLint') return true;
  }
  return false;
};

const getInputsFromSettingsAST = (program: Program): Input[] => {
  const inputs: Input[] = [];

  const addResolver = (kind: ImportSettingKind, resolver: string | undefined) => {
    if (!resolver || resolver === 'node' || isInternal(resolver)) return;
    const dep = kind === 'resolver' ? `eslint-import-resolver-${resolver}` : resolver;
    inputs.push(toDeferResolve(dep, { optional: true }));
  };

  const addParser = (name: string | undefined) => {
    if (name) inputs.push(toParser(name));
  };

  const addResolvers = (kind: ImportSettingKind, node: Expression | SpreadElement | null) => {
    if (node?.type === 'ArrayExpression') {
      for (const element of node.elements) addResolvers(kind, element);
    } else if (node?.type === 'ObjectExpression') {
      if (kind === 'resolver' && findProperty(node, 'name') && findProperty(node, 'resolver')) return;
      for (const prop of node.properties) {
        if (prop.type === 'Property') addResolver(kind, getPropertyKey(prop));
      }
    } else {
      addResolver(kind, getStringValue(node));
    }
  };

  const visitor = new Visitor({
    ObjectExpression(node) {
      const settingsNode = findProperty(node, 'settings');
      if (settingsNode?.type === 'ObjectExpression') {
        for (const prop of settingsNode.properties ?? []) {
          if (prop.type !== 'Property') continue;
          const key = getPropertyKey(prop);
          const kind = key && importSettingKinds.get(key);
          if (kind) addResolvers(kind, prop.value);
        }
      }

      const parser = findProperty(findProperty(node, 'parserOptions'), 'parser');
      if (parser?.type === 'ObjectExpression') {
        if (isParserObjectExpression(parser)) return;
        for (const prop of parser.properties) if (prop.type === 'Property') addParser(getStringValue(prop.value));
      } else {
        addParser(getStringValue(parser));
      }
    },
  });
  visitor.visit(program);

  return inputs;
};

export const getInputsFromFlatConfigAST = (program: Program): Input[] => [
  ...getInputsFromSettingsAST(program),
  toDeferResolve('eslint-import-resolver-typescript', { optional: true }),
];
