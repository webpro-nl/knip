import { namespaceL, namespaceR } from './pseudo';

const callfuncDynamically = () => {
  const funcs = Math ? namespaceL : namespaceR;
  funcs.fn();
};
