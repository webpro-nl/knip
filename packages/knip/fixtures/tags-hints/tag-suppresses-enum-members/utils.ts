import { StatusCode } from './status';

export function labelFor(code: string): string {
  return StatusCode[Number.parseInt(code)] ?? 'unrecognized';
}
