import { jest as testJest } from '@jest/globals';

jest.mock('manual-search');
jest.requireMock('manual-search');
jest.requireActual('manual-search');
testJest.doMock('@mock/storage');
testJest.requireMock('@mock/storage');
jest.mock('mock-clock/timer');
jest.requireMock('mock-clock/timer');
jest.mock('missing-search');
jest.requireMock('missing-search');
jest.createMockFromModule('manual-search');
