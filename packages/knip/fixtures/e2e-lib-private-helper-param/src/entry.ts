import {
  composedApi,
  getMemberResult,
  getRequiredResult,
  getSelf,
  readConstrained,
  readPassthrough,
  readPrivateParam,
} from './handler.ts';

export const entry = {
  composedApi: () => composedApi,
  getMemberResult: () => getMemberResult(),
  getRequiredResult,
  getSelf: () => getSelf(),
  readConstrained: () => readConstrained(),
  readPassthrough: () => readPassthrough(),
  readPrivateParam,
};
