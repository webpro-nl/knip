import { jest as testJest } from '@jest/globals';

testJest.requireMock('virtual-clock');
testJest.mock('virtual-clock', () => ({}), { virtual: true });
testJest.requireMock('virtual-storage');
