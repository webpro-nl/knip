import ts from 'typescript';

export function createCustomSys(cwd: string, virtualFileExtensions: string[]) {
  const sys = {
    ...ts.sys,
    getCurrentDirectory: () => cwd,
  };

  if (virtualFileExtensions.length === 0) return sys;

  return {
    ...sys,
    fileExists(path: string) {
      return ts.sys.fileExists(ensureRealFilePath(path, virtualFileExtensions));
    },
  };
}

function toRealFilePath(filePath: string) {
  return filePath.slice(0, -'.ts'.length);
}

export function isVirtualFilePath(filePath: string, extensions: string[]) {
  return extensions.some(extension => filePath.endsWith(`${extension}.ts`));
}

export function ensureRealFilePath(filePath: string, extensions: string[]) {
  return isVirtualFilePath(filePath, extensions) ? toRealFilePath(filePath) : filePath;
}
