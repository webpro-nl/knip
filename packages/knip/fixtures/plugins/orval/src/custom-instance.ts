export const customInstance = <T>(url: string): Promise<T> => fetch(url).then(r => r.json());
