/**
 * Members are looked up by reverse numeric index, so they have no static references.
 *
 * @knipignore
 */
export enum StatusCode {
  normal = 1000,
  unknown = 2000,
  warning = 3000,
  critical = 4000,
  nostatus = 5000,
}
