export interface PrivateParam {
  value: string;
}

export interface RequiredResult {
  id: string;
}

export interface PassthroughParam {
  value: string;
}

export interface ComposedParam {
  value: string;
}

declare const memberResultBrand: unique symbol;

export interface MemberResult {
  readonly [memberResultBrand]: true;
  value: string;
}

export interface MemberParam {
  result: MemberResult;
}

declare const constrainedResultBrand: unique symbol;

export interface ConstrainedResult {
  readonly [constrainedResultBrand]: true;
  value: string;
}

export interface SelfParam {
  self: this;
}

const read = (param: PrivateParam) => param.value;
const getRequired = (): RequiredResult => ({ id: 'required' });
const passthrough = (param: PassthroughParam) => param;
const compose = <T>(fn: T): T => fn;
const parseComposed = (param: ComposedParam): { value: string } => ({ ...param });
declare const memberResult: MemberResult;
const readMemberResult = (param: MemberParam) => param.result;
declare const getConstrained: <T extends ConstrainedResult>() => T;
const readSelf = (param: SelfParam) => param.self;

export const readPrivateParam = () => read({ value: 'private' });
export const getRequiredResult = () => getRequired();
export const readPassthrough = () => passthrough({ value: 'passthrough' });
export const composedApi = {
  parser: compose(parseComposed),
  run: () => parseComposed({ value: 'composed' }),
};
export const getMemberResult = () => readMemberResult({ result: memberResult });
export const readConstrained = () => getConstrained();
export const getSelf = () => readSelf(null!);
