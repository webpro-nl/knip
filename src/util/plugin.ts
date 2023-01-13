export const toCamelCase = (name: string) =>
  name.toLowerCase().replace(/(-[a-z])/g, group => group.toUpperCase().replace('-', ''));

export const getArgumentValues = (value: string, matcher: RegExp) => {
  const match = value.match(matcher);
  if (match) return match.map(value => value.trim().split(/[ =]/)[1].trim());
  return [];
};

export const hasDependency = (dependencies: Set<string>, values: (string | RegExp)[]) =>
  values.some(value => {
    if (typeof value === 'string') {
      return dependencies.has(value);
    } else if (value instanceof RegExp) {
      for (const dependency of dependencies) {
        if (value.test(dependency)) return true;
      }
    }
    return false;
  });
