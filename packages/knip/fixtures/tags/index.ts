import * as NS from './tags.js';
import { MyClass, MyEnum } from './tags.js';
import { ignored, notIgnored } from './unimported.js';

const x: MyEnum = {};

const xm = MyEnum.UsedUntagged;

const y = new MyClass();
