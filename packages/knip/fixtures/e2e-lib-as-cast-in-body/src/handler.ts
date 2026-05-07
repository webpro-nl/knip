export interface UnusedHelperOptions {
  stale: boolean;
}

export interface InternalCast {
  secret: number;
}

export const ping = () => {
  const x = JSON.parse('{}') as InternalCast;
  return x.secret > 0 ? 'a' : 'b';
};
