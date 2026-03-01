import { createOptions } from '../../src/util/create-options.ts';

const _createOptions: typeof createOptions = options => {
  options.isShowProgress = false;
  return createOptions(options);
};

export { _createOptions as createOptions };
