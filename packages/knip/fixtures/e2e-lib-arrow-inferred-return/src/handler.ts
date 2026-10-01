export interface HandlerOptions {
  force: boolean;
}

export interface RecursiveUploadFile {
  id: string;
  name: string;
}

export interface UnusedHandlerOptions {
  stale: boolean;
}

export const createHandler = () => {
  const run = (options: HandlerOptions) => (options.force ? 'forced' : 'ok');

  return { run };
};

const getFilesRecursive = () => Promise.resolve([] as RecursiveUploadFile[]);

export const getDownloadFilesHandler = async () => {
  const files = await getFilesRecursive();

  return files;
};
