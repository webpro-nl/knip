import { Fruits, Animals } from './members.ts';
import * as NS from './members.ts';
import { standalone, Standalone } from './members.ts';
import { Types } from './types.ts';
import { Validator, format, Status } from './merged.ts';
import { Colors } from './modules.ts';

console.log(Fruits.apple + Fruits.Tropical.mango);

console.log(Animals.cat + Animals.Birds.eagle);

console.log(NS.Shapes.circle + NS.Shapes.Nested.triangle);

console.log(standalone + Standalone.value + Standalone.Nested.deep);

type T = Types.UsedType;
const v: Types.UsedInterface = { value: '' };

new Validator().validate();
console.log(Validator.maxLength);

console.log(format('hello') + format.separator);

console.log(Status.Active, Status.label(Status.Active));

console.log(Colors.red + Colors.Shades.dark);
