import { jest as testJest } from '@jest/globals';

testJest.mock('aliased-search');
testJest.requireActual('./actual-module');
testJest.mock('virtual-search', () => ({}), { virtual: true });

function withLocalJest(testJest) {
  testJest.mock('shadowed-alias');
}

withLocalJest({ mock() {} });
