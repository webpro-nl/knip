export const deferRoute = (load: () => Promise<unknown>) => load;

export const router = {
  lazy: (load: () => Promise<unknown>) => load,
};
