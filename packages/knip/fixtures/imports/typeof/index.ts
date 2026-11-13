let externalModule: typeof import('external') | undefined;

type Apple = import('./fruits').Apple;
let banana: typeof import('./fruits').banana | undefined;
type Lemon = import('./fruits').Citrus.Lemon;
type Season = import('./fruits').Season;

export type Basket = [Apple, typeof banana, Lemon, Season];
