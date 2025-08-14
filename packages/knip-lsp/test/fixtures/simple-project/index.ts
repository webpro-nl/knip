// Test file with various Knip issues

// Used import
import express from 'express';

// Unresolved import (will trigger error)
import { something } from './non-existent';

// Unused export (will trigger warning)
export const unusedFunction = () => {
  console.debug('This function is never imported');
};

// Used export
export const usedFunction = () => {
  const app = express();
  return app;
};

// Unused type export
export type UnusedType = {
  field: string;
};

// Unused enum member
export enum Status {
  Active = 'active',
  Inactive = 'inactive', // This is unused
  Pending = 'pending',
}

// Unused class member
export class TestClass {
  usedMethod() {
    return 'used';
  }

  unusedMethod() {
    return 'unused';
  }
}

// Duplicate export
export { usedFunction as duplicateFunction };
