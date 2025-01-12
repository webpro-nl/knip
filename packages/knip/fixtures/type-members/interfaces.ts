export interface MyInterface {
  usedInterfaceMember?: boolean;
  usedKey?: boolean;
  usedInExtends?: boolean;
  usedInImplements?: boolean;

  usedInExtendsInternal?: boolean;
  usedInImplementsInternal?: boolean;

  unusedInterfaceMember?: boolean;
  'unused-interface-quoted'?: boolean;
}

export interface ExtendedInterface extends Pick<MyInterface, 'usedInExtends' | 'usedInExtendsInternal'> {
  boolA?: true;
}

class ImplementingClass implements Exclude<MyInterface, 'usedInExtends' | 'usedInExtendsInternal'> {
  usedInImplementsInternal = true;
}

const internalInterfaceUsage: ExtendedInterface = {
  usedInExtendsInternal: true,
};

ImplementingClass;
internalInterfaceUsage;

export interface OnlyTypedUsage {
  id: string;
}
