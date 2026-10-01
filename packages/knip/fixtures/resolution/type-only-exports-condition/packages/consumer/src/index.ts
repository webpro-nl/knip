import type { UsedType } from '@fixtures/type-only-exports-condition-contracts';
import { runtimeValue } from '@fixtures/type-only-exports-condition-contracts';
import type { ReExportedType } from './barrel.js';
import { reExportedRuntime } from './barrel.js';

export const value: UsedType = { value: 'used' };
const reExportedValue: ReExportedType = {};
runtimeValue;
reExportedRuntime;
reExportedValue;
