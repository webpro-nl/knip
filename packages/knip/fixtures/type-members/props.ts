export interface PropsA {
  usedProp1?: boolean;
  usedProp2?: boolean;
  unusedPropA?: boolean;
}

export type PropsB = {
  usedPropB: boolean;
  unusedPropB?: boolean;
};

export type PropsC = {
  usedPropC?: boolean;
  unusedPropC?: boolean;
};

export type PropsD = {
  usedPropC?: boolean;
  unusedPropD?: boolean;
};

export interface FnArg {
  optionA?: boolean;
  optionB?: boolean;
}
