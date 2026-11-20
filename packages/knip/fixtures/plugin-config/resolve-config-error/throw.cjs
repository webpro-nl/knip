module.exports = {
  pageExtensions: ['page.ts', 'page.tsx', 'api.ts'],
};

const values = {
  string: 'Missing environment',
  undefined: undefined,
  null: null,
  error: new Error('Missing environment'),
};

const fail = () => {
  throw values[process.env.KNIP_TEST_THROW];
};

module.exports = process.env.KNIP_TEST_ASYNC === 'true' ? async () => fail() : fail;
