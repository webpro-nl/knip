// This file imports some exports to make them "used"
import { usedFunction, Status, TestClass } from './index';

// Use the imports
const app = usedFunction();
const status = Status.Active;
const instance = new TestClass();
instance.usedMethod();

export { app, status, instance };