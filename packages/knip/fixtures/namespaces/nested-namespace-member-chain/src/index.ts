import * as zoo from './zoo.ts';
import { Animals } from './taxonomy.ts';

console.log(zoo.mammals.dog);
console.log(zoo.mammals.felines.housecat);
console.log(zoo.mammals.felines.bigCats.tiger);
console.log(zoo.mammals.felines.bigCats.lions.asiatic);
console.log(Animals.Mammals.Felines.BigCats.jaguar);

export type Lion = zoo.mammals.felines.bigCats.lions.Lion;
