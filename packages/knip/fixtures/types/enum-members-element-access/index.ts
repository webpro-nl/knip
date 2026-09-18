import { StatusCodeDynamic, StatusCodeLiteral } from './codes';

export function lookup(code: number) {
  return [StatusCodeDynamic[code], StatusCodeLiteral[3000]];
}
