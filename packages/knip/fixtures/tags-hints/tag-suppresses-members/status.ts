/** @knipignore */
export enum StatusCode {
  normal = 1000,
  warning = 3000,
  critical = 4000,
}

/** @knipignore */
export enum Level {
  low = 1,
  high = 2,
}

/** @knipignore */
export namespace Settings {
  export const timeout = 1000;
  export const retries = 3;
}
