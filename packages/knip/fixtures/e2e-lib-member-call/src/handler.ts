export interface UnusedHelperOptions {
  stale: boolean;
}

export interface RecursiveUploadFile {
  id: string;
  name: string;
}

const helpers = {
  recurse: async (): Promise<RecursiveUploadFile[]> => [],
};

export const listFiles = async () => {
  const files = await helpers.recurse();
  return files;
};
