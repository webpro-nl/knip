const jest = { mock() {}, requireActual() {} };

jest.mock('local-mock');
jest.requireActual('local-actual');
