import 'used';
import '@dev/used';
import 'optional-peer-dep';
import './unresolved';
import 'unlisted';
import * as NS from './ns';
import default_, { used, type UsedType, MyClass, MyEnum } from './exports';

const x: UsedType | NS.UsedType = [default_, used, MyEnum.used, NS.used];
const y = new MyClass();
