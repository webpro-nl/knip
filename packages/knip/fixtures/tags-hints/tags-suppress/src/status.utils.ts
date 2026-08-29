import { StatusCode } from './status.model';

export const getStatus = (code: string): StatusCode => StatusCode[Number.parseInt(code)];
