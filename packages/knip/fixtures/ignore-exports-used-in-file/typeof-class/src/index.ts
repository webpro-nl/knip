import { setLogger, createTree, type Collection } from './api';

setLogger(() => {});
createTree();

const c: Collection = { isLeaf: () => false };
c.isLeaf();
