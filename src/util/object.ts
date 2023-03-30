// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getStringValues = (obj: any): string[] => {
  let values: string[] = [];
  for (const prop in obj) {
    if (obj[prop]) {
      if (typeof obj[prop] === 'string') {
        values.push(obj[prop]);
      } else if (typeof obj[prop] === 'object') {
        values = values.concat(getStringValues(obj[prop]));
      }
    }
  }
  return values;
};
