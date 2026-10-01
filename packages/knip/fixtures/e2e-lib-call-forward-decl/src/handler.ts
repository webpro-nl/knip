export interface UnusedHelperOptions {
  stale: boolean;
}

export const getDownloadFiles = async () => {
  const files = await getFilesRecursive();
  return files;
};

export interface RecursiveUploadFile {
  id: string;
  name: string;
}

const getFilesRecursive = async (): Promise<RecursiveUploadFile[]> => [];
