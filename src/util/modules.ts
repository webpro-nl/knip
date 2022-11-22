export const getPackageName = (value: string) => {
  const match = value.replace(/\\/g, '/').match(/(?<=node_modules\/)(@[^/]+\/[^/]+|[^/]+)/);
  if (match) return match[1];

  if (value.startsWith('@')) {
    const [scope, packageName] = value.split('/');
    return [scope, packageName].join('/');
  }

  return value.startsWith('/') ? value : value.split('/')[0];
};
