import { ISSUE_TYPES } from '../../src/constants';
import { fillObj } from '../../src/util/array';

const baseCounters = {
  ...fillObj(ISSUE_TYPES, 0),
  processed: 0,
  total: 0,
};

export default baseCounters;
