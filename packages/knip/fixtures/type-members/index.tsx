import { MyInterface, ExtendedInterface } from './interfaces';
import { MyType, WithIntersection, WithUnion } from './types';
import type { PropsA, PropsB, PropsC, PropsD, FnArg } from './props';
import type { OnlyTypedUsage } from './interfaces';

const interfaceRef: MyInterface = {
  usedInterfaceMember: true,
};

type TypeRef = {
  prop: MyType['usedTypeMember'];
  key: MyInterface['usedKey'];
};

class ImplementsUsage implements Pick<MyInterface, 'usedInImplements' | 'usedInImplementsInternal'> {
  usedInImplements = true;
}

const interfaceUsage: ExtendedInterface = {
  usedInExtends: true,
};

const intersectionUsage: WithIntersection = {
  usedInIntersection: true,
};

const unionUsage: WithUnion = {
  usedInUnion: true,
};

interfaceRef;
ImplementsUsage;
interfaceUsage;
intersectionUsage;
unionUsage;

declare const React: any;

declare namespace React {
  type FC<P = Record<string, unknown>> = (props: P) => any;
}

const ComponentA: React.FC<PropsA> = () => null;

const ComponentB: React.FC<PropsB> = props => <div {...props} />;

const ComponentC: React.FC<PropsC> = props => <div>{props.usedPropC}</div>;

const ComponentD: React.FC<PropsD> = props => <div>{props.usedPropC}</div>;

const App = () => (
  <>
    <ComponentA usedProp1={true} />
    <ComponentA usedProp2={true} />
    <ComponentB {...{ usedPropB: true }} />
    <ComponentC />
    {React.createElement(ComponentD, { usedPropD: true })}
  </>
);

function fn(options: FnArg) {
  if (options.optionA) return 1;
  // if (options.optionB) return 2;
}

fn({ optionA: true });

type TypedDocumentNode<T> = T extends string ? () => string : () => number;

export const anotherFn = async (): Promise<() => number> => {
  const info = await f({
    query: (() => 1) as TypedDocumentNode<OnlyTypedUsage>,
  });
  return info;
};

export const getQuery: TypedDocumentNode<OnlyTypedUsage> = () => 1;
