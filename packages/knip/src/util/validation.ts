export type Check<T> = (value: unknown, path: string, errors: string[]) => value is T;

export type Fields<T> = { [K in keyof T]-?: Check<Exclude<T[K], undefined>> };

const location = (path: string, key: string | number) => (path ? `${path}.${key}` : String(key));

export const invalid = (path: string, errors: string[], expected?: string, key?: string) => {
  const details = [];
  if (path) details.push(`location: ${path}`);
  if (expected) details.push(`expected: ${expected}`);
  if (key !== undefined) details.push(`unrecognized_keys: ${key}`);
  errors.push(`Invalid input${details.length ? ` (${details.join(', ')})` : ''}`);
  return false;
};

export const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  if (!isObject(value)) return false;
  const constructor = value.constructor;
  return typeof constructor !== 'function' || Object.hasOwn(constructor.prototype ?? {}, 'isPrototypeOf');
};

export const checkString: Check<string> = (value, path, errors): value is string =>
  typeof value === 'string' || invalid(path, errors, 'string');

export const checkBoolean: Check<boolean> = (value, path, errors): value is boolean =>
  typeof value === 'boolean' || invalid(path, errors, 'boolean');

export const checkArray =
  <T>(check: Check<T>): Check<T[]> =>
  (value, path, errors): value is T[] => {
    if (!Array.isArray(value)) return invalid(path, errors, 'array');
    const count = errors.length;
    for (let i = 0; i < value.length; i++) check(value[i], location(path, i), errors);
    return errors.length === count;
  };

export const checkRecord =
  <T>(check: Check<T>, isKey?: (key: string) => boolean): Check<Record<string, T>> =>
  (value, path, errors): value is Record<string, T> => {
    if (!isRecord(value)) return invalid(path, errors, 'record');
    const count = errors.length;
    for (const key of Reflect.ownKeys(value)) {
      if (!Object.prototype.propertyIsEnumerable.call(value, key)) continue;
      if (typeof key !== 'string') invalid(location(path, String(key)), errors);
      else if (isKey && !isKey(key)) invalid(path, errors, undefined, key);
      else check(value[key], location(path, key), errors);
    }
    return errors.length === count;
  };

export const checkObject = (
  value: unknown,
  path: string,
  errors: string[],
  fields: Record<string, Check<unknown>>,
  extraFields: 'reject' | 'ignore' | ((key: string) => Check<unknown> | undefined) = 'reject'
) => {
  if (!isObject(value)) return invalid(path, errors, 'object');
  const count = errors.length;
  let unknownKeys: string | undefined;
  for (const key in value) {
    const check = Object.hasOwn(fields, key)
      ? fields[key]
      : typeof extraFields === 'function'
        ? extraFields(key)
        : undefined;
    if (check) {
      const item = value[key];
      if (item !== undefined) check(item, location(path, key), errors);
    } else if (extraFields !== 'ignore') unknownKeys = unknownKeys === undefined ? key : `${unknownKeys}, ${key}`;
  }
  if (unknownKeys !== undefined) invalid(path, errors, undefined, unknownKeys);
  return errors.length === count;
};
