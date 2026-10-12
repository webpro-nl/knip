jest.mock('@babel/core', () => ({}));
jest.mock('./mocked-module', () => ({}));
jest.doMock('mock-storage');
jest.requireMock('mock-network');
jest.createMockFromModule(`mock-clock`);
jest.unmock('picomatch');
jest.dontMock('zod');
jest.deepUnmock('lodash');
jest.setMock('minimist', {});
jest.unstable_mockModule('prettier', () => ({}), { virtual: false });
jest.unstable_unmockModule('react-dom');
jest.doMock('virtual-storage', () => ({}), { virtual: true });
jest.unstable_mockModule('virtual-esm-search', () => ({}), { virtual: true });

function withLocalJest(jest) {
  jest.mock('unused-package');
  jest.requireActual('shadowed-react');
  jest.mock('./ignored-module');
}

withLocalJest({ mock() {}, requireActual() {} });

jest.fn('unrelated-package');
jest.mock();
jest.mock(`dynamic-${'package'}`);

const other = { mock() {} };
other.mock('unrelated-package');
