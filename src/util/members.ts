import { MethodDeclaration, PropertyDeclaration, ts } from 'ts-morph';
import { _findReferences, hasExternalReferences, hasInternalReferences } from './project.js';
import type { ClassDeclaration, EnumDeclaration } from 'ts-morph';

export const findUnusedClassMembers = (declaration: ClassDeclaration, filePath: string) => {
  const members = declaration.getMembers();
  return members.filter((member): member is MethodDeclaration | PropertyDeclaration => {
    const isPrivate = member.getCombinedModifierFlags() & ts.ModifierFlags.Private;
    if (
      !isPrivate &&
      (member.isKind(ts.SyntaxKind.PropertyDeclaration) || member.isKind(ts.SyntaxKind.MethodDeclaration))
    ) {
      const refs = _findReferences(member);
      return !hasExternalReferences(refs, filePath) && !hasInternalReferences(refs);
    }
    return false;
  });
};

export const findUnusedEnumMembers = (declaration: EnumDeclaration, filePath: string) => {
  const members = declaration.getMembers();
  return members.filter(member => {
    const refs = _findReferences(member);
    return !hasExternalReferences(refs, filePath) && !hasInternalReferences(refs);
  });
};
