export interface Dog {
  legs: number;
  wings?: boolean;
}

const charlie: Dog = {
  legs: 4,
};

export type Pet = {
  legs: number;
  fins: boolean;
};

export type Cat = {
  legs: Pet['legs'];
  horn?: boolean;
};

const coco: Cat = {
  legs: 4,
};

export interface Args {
  caseA: boolean;
  caseB?: boolean;
}

function fn(options: Args) {
  if (options.caseA) return 1;
}

fn({ caseA: true });

declare const React: any;

declare namespace React {
  type FC<P = Record<string, unknown>> = (props: P) => any;
}

export interface ComponentProps {
  usedProp: boolean;
  unusedProp?: boolean;
}

const Component: React.FC<ComponentProps> = props => null;

const App = () => (
  <>
    <Component usedProp={true} />
    <Component {...{ usedProp: true }} />
    {React.createElement(Component, { usedProp: true })}
  </>
);

export type ComponentPropsB = {
  usedProp: boolean;
  deep?: {
    usedProp: boolean;
    unusedProp: boolean;
  };
};

const ComponentB: React.FC<ComponentPropsB> = props => (
  <span>
    {props.usedProp} | {props.deep.usedProp}
  </span>
);

const AppB = () => <ComponentB usedProp={true} />;
