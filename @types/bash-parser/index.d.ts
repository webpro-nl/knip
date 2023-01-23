declare module 'bash-parser' {
  type Name = {
    type: string;
    text: string;
  };

  type CompoundList = {
    type: 'CompoundList';
    commands: Command[];
  };

  type Command = {
    type: 'Command';
    name?: Name;
    suffix: {
      text: string;
    }[];
  };

  type LogicalExpression = {
    type: 'LogicalExpression';
    left: Command;
    right: Command;
  };

  type If = {
    type: 'If';
    clause: {
      commands: Command[];
    };
    then: {
      commands: Command[];
    };
  };

  type For = {
    type: 'For';
    name: Name;
    wordlist: Name[];
    do: CompoundList;
  };

  type Function_ = {
    type: 'Function';
    name: Name;
    body: CompoundList;
  };

  export type Item = Command | LogicalExpression | If | For | Function_;

  export type AST = {
    type: 'Script';
    commands: Item[];
  };

  declare const parse: (s: string) => AST;

  export default parse;
}
