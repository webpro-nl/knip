/** @internal */
export const getValuesByKeyDeep = (obj: any, key: string): unknown[] => {
  const objects = [];
  if (obj && typeof obj === 'object') {
    for (const i in obj) {
      if (obj[i] && typeof obj[i] === 'object') {
        const values = getValuesByKeyDeep(obj[i], key);
        objects.push(...values);
      } else if (i === key) {
        objects.push(obj[i]);
      }
    }
  }
  return objects;
};

export const findByKeyDeep = <T>(obj: any, key: string): T[] => {
  const objects = [];
  if (obj && typeof obj === 'object') {
    if (key in obj) {
      objects.push(obj);
    }
    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          objects.push(...findByKeyDeep(item, key));
        }
      } else if (typeof value === 'object') {
        objects.push(...findByKeyDeep(value, key));
      }
    }
  }
  return objects;
};

export const getKeysByValue = <T>(obj: T, value: unknown): (keyof T)[] => {
  const keys = [];
  for (const key in obj) {
    if (obj[key] === value) keys.push(key);
  }
  return keys;
};

export const get = <T>(obj: T, path: string) => path.split('.').reduce((o: any, p) => o?.[p], obj);
