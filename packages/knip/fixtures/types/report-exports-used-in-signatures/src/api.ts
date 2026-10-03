export type FetchOptions = { limit: number };
export type FetchResult = { items: string[] };
export type UnusedSpec = { id: string };

export async function fetchItems(options: FetchOptions): Promise<FetchResult> {
  return { items: [] };
}
