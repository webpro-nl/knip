export const getPackageName = (value: string) => {
  const match = value.replace(/\\/g, '/').match(/(?<=node_modules\/)(@[^/]+\/[^/]+|[^/]+)/);
  if (match) return match[1];

  if (value.startsWith('@')) {
    const [scope, packageName] = value.split('/');
    return [scope, packageName].join('/');
  }

  return value.startsWith('/') ? value : value.split('/')[0];
};

export const isDefinitelyTyped = (packageName: string) => packageName.startsWith('@types/');

export const getDefinitelyTypedPackage = (packageName: string) => {
  if (isDefinitelyTyped(packageName)) return packageName;
  return '@types/' + packageName.replace('@', '__');
};
