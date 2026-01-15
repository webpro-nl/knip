import { createOptions } from '../../src/util/create-options.js';

const _createOptions: typeof createOptions = options => {
  options.isShowProgress = false;
  return createOptions(options);
};

export { _createOptions as createOptions };
