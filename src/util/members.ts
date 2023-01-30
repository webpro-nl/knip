import { ts } from 'ts-morph';
import { _findReferences, hasExternalReferences, hasInternalReferences } from './project.js';
import type { ClassDeclaration, MethodDeclaration, PropertyDeclaration, EnumDeclaration } from 'ts-morph';

export const findUnusedClassMembers = (declaration: ClassDeclaration, filePath: string) => {
  const members = declaration.getMembers();
  return members
    .filter((member): member is MethodDeclaration | PropertyDeclaration => {
      const isPrivate = Boolean(member.getCombinedModifierFlags() & ts.ModifierFlags.Private);
      if (
        !isPrivate &&
        (member.isKind(ts.SyntaxKind.PropertyDeclaration) || member.isKind(ts.SyntaxKind.MethodDeclaration))
      ) {
        const refs = _findReferences(member);
        return !hasExternalReferences(refs, filePath) && !hasInternalReferences(refs);
      }
      return false;
    })
    .map(member => member.getName());
};

export const findUnusedEnumMembers = (declaration: EnumDeclaration, filePath: string) => {
  const members = declaration.getMembers();
  return members
    .filter(member => {
      const refs = _findReferences(member);
      return !hasExternalReferences(refs, filePath) && !hasInternalReferences(refs);
    })
    .map(member => member.getName().replace(/['"`]/g, ''));
};
