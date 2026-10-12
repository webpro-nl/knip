jest.mock('@babel/core', () => ({}));
jest.mock('./mocked-module', () => ({}));
jest.doMock('mock-storage');
jest.requireMock('mock-network');
jest.createMockFromModule(`mock-clock`);

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
