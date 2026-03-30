export class Validator {
  validate() {
    return true;
  }
}
export namespace Validator {
  export const maxLength = 255;
  export const unusedMinLength = 0;
}

export function format(value: string) {
  return value.trim();
}
export namespace format {
  export const separator = ',';
  export const unusedPadding = ' ';
}

export enum Status {
  Active,
  Inactive,
}
export namespace Status {
  export function label(s: Status) {
    return s === Status.Active ? 'active' : 'inactive';
  }
  export const unusedDefault = Status.Active;
}
