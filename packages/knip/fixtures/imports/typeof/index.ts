import type { Color, Roots, Size } from './vegetables';

let externalModule: typeof import('external') | undefined;

type Apple = import('./fruits').Apple;
let banana: typeof import('./fruits').banana | undefined;
type Lemon = import('./fruits').Citrus.Lemon;
type Season = import('./fruits').Season;

type Carrot = Roots.Carrot;
type Green = Color.Green;

export type Basket = [Apple, typeof banana, Lemon, Season, Carrot, Green, Size];
