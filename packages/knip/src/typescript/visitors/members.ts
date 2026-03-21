import type { MemberExpression, JSXMemberExpression } from 'oxc-parser';
import { OPAQUE } from '../../constants.ts';
import { addValue } from '../../util/module-graph.ts';
import { getStringValue, isStringLiteral } from './helpers.ts';
import { isShadowed, type WalkState } from './walk.ts';

export function handleMemberExpression(node: MemberExpression, s: WalkState) {
  if (node.object.type === 'MemberExpression' && node.object.object.type === 'MemberExpression') {
    s.chainedMemberExprs.add(node.object);
  }

  if (node.object.type === 'Identifier') {
    const localName = node.object.name;
    const shadowed = isShadowed(localName, node.object.start);
    const _import = !shadowed ? s.localImportMap.get(localName) : undefined;
    if (_import) {
      const internalImport = s.internal.get(_import.filePath);
      if (internalImport) {
        let memberName: string | undefined;
        if (node.computed === false && node.property.type === 'Identifier') {
          memberName = node.property.name;
        } else if (node.computed && isStringLiteral(node.property)) {
          memberName = getStringValue(node.property);
        } else if (node.computed && _import.isNamespace) {
          addValue(internalImport.import, OPAQUE, s.filePath);
          return;
        }
        if (memberName) {
          if (_import.isDynamicImport) {
            addValue(internalImport.import, memberName, s.filePath);
          } else {
            s.addNsMemberRefs(internalImport, localName, memberName);
          }
        }
      }
    } else if (!shadowed) {
      const memberName =
        node.computed === false && node.property.type === 'Identifier' ? node.property.name : undefined;
      if (memberName) {
        const exp = s.exports.get(localName);
        if (exp) {
          for (const member of exp.members) {
            if (member.identifier === memberName) member.hasRefsInFile = true;
          }
        }
      }
    }

    const aliases = s.importAliases.get(localName);
    if (aliases) {
      s.accessedAliases.add(localName);
      let memberName: string | undefined;
      if (node.computed === false && node.property.type === 'Identifier') {
        memberName = node.property.name;
      } else if (node.computed && isStringLiteral(node.property)) {
        memberName = getStringValue(node.property);
      }
      if (memberName) {
        for (const alias of aliases) {
          const internalImport = s.internal.get(alias.filePath);
          if (internalImport) {
            s.addNsMemberRefs(internalImport, alias.id, memberName);
          }
        }
      }
    }
  }

  if (
    node.object.type === 'MemberExpression' &&
    !node.object.computed &&
    node.object.object.type === 'Identifier' &&
    node.object.property.type === 'Identifier' &&
    !node.computed &&
    node.property.type === 'Identifier'
  ) {
    const rootName = node.object.object.name;
    if (!isShadowed(rootName, node.object.object.start)) {
      const _import = s.localImportMap.get(rootName);
      if (_import) {
        const internalImport = s.internal.get(_import.filePath);
        if (internalImport) {
          const mid = node.object.property.name;
          s.addNsMemberRefs(internalImport, rootName, mid);
          if (!s.chainedMemberExprs.has(node)) {
            s.addNsMemberRefs(internalImport, rootName, `${mid}.${node.property.name}`);
          }
        }
        if (!_import.isNamespace) {
          const mid = node.object.property.name;
          const _import = s.localImportMap.get(mid);
          if (_import) {
            const midImport = s.internal.get(_import.filePath);
            if (midImport) s.addNsMemberRefs(midImport, mid, node.property.name);
          }
        }
      } else {
        const exp = s.exports.get(rootName);
        if (exp && exp.members.length > 0) {
          const mid = node.object.property.name;
          const dottedName = `${mid}.${node.property.name}`;
          for (const member of exp.members) {
            if (member.identifier === mid || member.identifier === dottedName) member.hasRefsInFile = true;
          }
        }
      }
    }
  }

  if (
    node.object.type === 'MemberExpression' &&
    !node.object.computed &&
    node.object.object.type === 'MemberExpression' &&
    !node.object.object.computed &&
    node.object.object.object.type === 'Identifier' &&
    node.object.object.property.type === 'Identifier' &&
    node.object.property.type === 'Identifier' &&
    !node.computed &&
    node.property.type === 'Identifier'
  ) {
    const rootName = node.object.object.object.name;
    if (!isShadowed(rootName, node.object.object.object.start)) {
      const _import = s.localImportMap.get(rootName);
      if (_import) {
        const internalImport = s.internal.get(_import.filePath);
        if (internalImport) {
          const a = node.object.object.property.name;
          const b = node.object.property.name;
          const c = node.property.name;
          s.addNsMemberRefs(internalImport, rootName, a);
          s.addNsMemberRefs(internalImport, rootName, `${a}.${b}`);
          s.addNsMemberRefs(internalImport, rootName, `${a}.${b}.${c}`);
        }
      } else {
        const exp = s.exports.get(rootName);
        if (exp && exp.members.length > 0) {
          const a = node.object.object.property.name;
          const b = node.object.property.name;
          const c = node.property.name;
          const dottedName = `${a}.${b}.${c}`;
          for (const member of exp.members) {
            if (member.identifier === a || member.identifier === `${a}.${b}` || member.identifier === dottedName)
              member.hasRefsInFile = true;
          }
        }
      }
    }
  }

  if (
    node.object.type === 'MemberExpression' &&
    !node.object.computed &&
    node.object.object.type === 'Identifier' &&
    node.object.property.type === 'Identifier'
  ) {
    const containerName = node.object.object.name;
    const nsName = node.object.property.name;
    if (s.shorthandNsContainers.get(containerName)?.has(nsName)) {
      const _import = s.localImportMap.get(nsName);
      if (_import) {
        const internalImport = s.internal.get(_import.filePath);
        if (internalImport) {
          let memberName: string | undefined;
          if (!node.computed && node.property.type === 'Identifier') memberName = node.property.name;
          else if (node.computed && isStringLiteral(node.property)) memberName = getStringValue(node.property);
          if (memberName) {
            s.addNsMemberRefs(internalImport, nsName, memberName);
            s.accessedShorthandNs.add(`${containerName}.${nsName}`);
          }
        }
      }
    }
  }
}

export function handleJSXMemberExpression(node: JSXMemberExpression, s: WalkState) {
  if (node.object.type === 'JSXIdentifier') {
    const localName = node.object.name;
    const memberName = node.property.type === 'JSXIdentifier' ? node.property.name : undefined;
    if (memberName) {
      const _import = s.localImportMap.get(localName);
      if (_import) {
        const internalImport = s.internal.get(_import.filePath);
        if (internalImport) {
          s.addNsMemberRefs(internalImport, localName, memberName);
        }
      }
    }
  }
}
