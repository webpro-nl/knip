jest.mock('virtual-search', () => ({ value: 2 }), { virtual: true });
jest.requireMock('virtual-search');
jest.requireActual('virtual-search');

jest.requireMock('virtual-storage');
jest.doMock('virtual-storage', () => ({}), { virtual: true });

jest.unstable_mockModule('virtual-network', () => ({}), { virtual: true });
jest.requireMock('virtual-network');

jest.mock('quoted-search', () => ({}), { 'virtual': true });
jest.doMock('quoted-storage', () => ({}), { 'virtual': true });
jest.unstable_mockModule('quoted-network', () => ({}), { 'virtual': true });
jest.requireMock('quoted-search');
jest.requireMock('quoted-storage');
jest.requireMock('quoted-network');

function withLocalJest(jest) {
  jest.mock('shadowed-search', () => ({}), { virtual: true });
}

withLocalJest({ mock() {} });
jest.requireMock('shadowed-search');
